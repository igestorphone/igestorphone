import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { throttle } from '@/lib/utils'
import { clearActivity, getLastActivityAt, setLastActivityAt, touchActivity } from '@/lib/idle'
import { useAuthStore } from '@/stores/authStore'

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 60 * 1000 // 5 horas sem atividade = logout
const CHECK_EVERY_MS = 15 * 1000
const TOUCH_THROTTLE_MS = 3000

export function useIdleLogout(idleTimeoutMs: number = DEFAULT_IDLE_TIMEOUT_MS) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuthStore()
  const didLogoutRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      didLogoutRef.current = false
      return
    }

    // Garante um "marco inicial" assim que autenticou
    if (!getLastActivityAt()) {
      touchActivity()
    }

    // No mobile, atrasa a ligação dos listeners para o primeiro toque não competir com a thread
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches
    const delayMs = isTouch ? 500 : 0

    const performLogout = () => {
      if (didLogoutRef.current) return
      didLogoutRef.current = true

      clearActivity()
      logout()
      toast.error('Você foi desconectado por inatividade.')

      if (location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
    }

    const touchThrottled = throttle(() => {
      setLastActivityAt(Date.now())
    }, TOUCH_THROTTLE_MS)

    const onActivity = () => {
      const last = getLastActivityAt()
      if (last && Date.now() - last >= idleTimeoutMs) {
        performLogout()
        return
      }

      touchThrottled()
    }

    // capture: false = handler roda DEPOIS do alvo (clique chega no botão antes)
    const listenerOptions: AddEventListenerOptions = { passive: true, capture: false }
    const events: Array<keyof WindowEventMap> = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ]

    let intervalId: ReturnType<typeof setInterval> | null = null
    const setupListeners = () => {
      events.forEach((event) => window.addEventListener(event, onActivity, listenerOptions))
      intervalId = window.setInterval(() => {
        const last = getLastActivityAt()
        if (!last) {
          touchActivity()
          return
        }
        const idleForMs = Date.now() - last
        if (idleForMs < idleTimeoutMs) return
        performLogout()
      }, CHECK_EVERY_MS)
    }

    if (delayMs > 0) {
      const t = setTimeout(setupListeners, delayMs)
      return () => {
        clearTimeout(t)
        if (intervalId) window.clearInterval(intervalId)
        events.forEach((event) => window.removeEventListener(event, onActivity, listenerOptions))
      }
    }

    setupListeners()
    return () => {
      if (intervalId) window.clearInterval(intervalId)
      events.forEach((event) => window.removeEventListener(event, onActivity, listenerOptions))
    }
  }, [idleTimeoutMs, isAuthenticated, location.pathname, logout, navigate])
}

