import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { throttle } from '@/lib/utils'
import { clearActivity, getLastActivityAt, setLastActivityAt, touchActivity } from '@/lib/idle'
import { useAuthStore } from '@/stores/authStore'

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 60 * 1000 // 5 horas sem atividade = logout
const CHECK_EVERY_MS = 15 * 1000
const TOUCH_THROTTLE_MS = 2000

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

    const listenerOptions: AddEventListenerOptions = { passive: true, capture: true }
    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'pointerdown',
    ]

    events.forEach((event) => window.addEventListener(event, onActivity, listenerOptions))

    const interval = window.setInterval(() => {
      const last = getLastActivityAt()
      if (!last) {
        // Se o storage foi limpo por qualquer motivo, reinicia o timer enquanto logado
        touchActivity()
        return
      }

      const idleForMs = Date.now() - last
      if (idleForMs < idleTimeoutMs) return
      performLogout()
    }, CHECK_EVERY_MS)

    return () => {
      window.clearInterval(interval)
      events.forEach((event) => window.removeEventListener(event, onActivity, listenerOptions))
    }
  }, [idleTimeoutMs, isAuthenticated, location.pathname, logout, navigate])
}

