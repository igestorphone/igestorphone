import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createWhatsAppUrl } from '@/lib/utils'
import { WHATSAPP_ATENDIMENTO } from '@/constants/contact'

export function buildReferralWhatsAppMessage(opts: {
  userName?: string | null
  userEmail?: string | null
}): string {
  const who = opts.userName?.trim() || 'usuário iGestorPhone'
  const emailLine = opts.userEmail?.trim() ? `\nE-mail: ${opts.userEmail.trim()}` : ''
  return `Olá! Vim pelo programa *Indique e Ganhe* do iGestorPhone.

Quero indicar um lojista:

• Nome / loja do indicado:
• WhatsApp do indicado:

Meu cadastro: ${who}${emailLine}

Obrigado!`
}

type BannerSlide = {
  id: string
  mobileSrc: string
  desktopSrc: string
  alt: string
  ariaLabel: string
  action: 'referral-whatsapp'
}

/** Slides do carrossel — hoje só indicação; adicionar itens aqui depois. */
const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'referral',
    mobileSrc: '/assets/images/referral-banner-mobile.jpg',
    desktopSrc: '/assets/images/referral-banner-desktop.jpg',
    alt: 'Programa de indicação iGestorPhone: indique lojistas e use grátis',
    ariaLabel: 'Programa de indicação iGestorPhone — Enviar meu convite',
    action: 'referral-whatsapp',
  },
]

const AUTO_MS = 5500

type ReferralProgramCardProps = {
  userName?: string | null
  userEmail?: string | null
  className?: string
}

export default function ReferralProgramCard({ userName, userEmail, className = '' }: ReferralProgramCardProps) {
  const slides = BANNER_SLIDES
  const multi = slides.length > 1
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [cycle, setCycle] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback(
    (next: number, dir: number) => {
      const len = slides.length
      if (len <= 0) return
      setDirection(dir)
      setIndex(((next % len) + len) % len)
      setCycle((c) => c + 1)
    },
    [slides.length]
  )

  const goNext = useCallback(() => {
    if (multi) goTo(index + 1, 1)
    else setCycle((c) => c + 1)
  }, [goTo, index, multi])

  const goPrev = useCallback(() => {
    if (multi) goTo(index - 1, -1)
    else setCycle((c) => c + 1)
  }, [goTo, index, multi])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(goNext, AUTO_MS)
    return () => window.clearInterval(id)
  }, [goNext, paused, cycle])

  const openReferralWhatsApp = () => {
    const url = createWhatsAppUrl(
      WHATSAPP_ATENDIMENTO,
      buildReferralWhatsAppMessage({ userName, userEmail })
    )
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const onSlideActivate = (s: BannerSlide) => {
    if (s.action === 'referral-whatsapp') openReferralWhatsApp()
  }

  const slide = slides[index] ?? slides[0]
  if (!slide) return null

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '14%' : '-14%', opacity: 0.35 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-14%' : '14%', opacity: 0.35 }),
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-md xl:self-start ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null
        setPaused(true)
      }}
      onTouchEnd={(e) => {
        setPaused(false)
        const start = touchStartX.current
        touchStartX.current = null
        if (start == null) return
        const end = e.changedTouches[0]?.clientX
        if (end == null) return
        const delta = end - start
        if (Math.abs(delta) < 40) return
        if (delta < 0) goNext()
        else goPrev()
      }}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Banners promocionais"
    >
      {/*
        Proporção na própria <img> fantasma — no Safari/iOS aspect-ratio +
        só filhos absolute pode colapsar a altura a 0.
      */}
      <div className="relative w-full">
        <img
          src={slide.mobileSrc}
          alt=""
          aria-hidden
          className="block w-full aspect-[5/2] object-cover opacity-0 pointer-events-none xl:hidden"
        />
        <img
          src={slide.desktopSrc}
          alt=""
          aria-hidden
          className="hidden w-full aspect-[1024/341] object-cover opacity-0 pointer-events-none xl:block"
        />

        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.button
            key={multi ? `${slide.id}-${index}` : slide.id}
            type="button"
            custom={direction}
            variants={variants}
            initial={multi ? 'enter' : false}
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSlideActivate(slide)}
            className="absolute inset-0 block w-full h-full cursor-pointer touch-manipulation overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            aria-label={slide.ariaLabel}
          >
            <motion.img
              src={slide.mobileSrc}
              alt={slide.alt}
              className="absolute inset-0 block h-full w-full object-cover object-[center_30%] xl:hidden"
              loading="eager"
              decoding="async"
              draggable={false}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: AUTO_MS / 1000, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.img
              src={slide.desktopSrc}
              alt={slide.alt}
              className="absolute inset-0 hidden h-full w-full object-cover object-center xl:block"
              loading="eager"
              decoding="async"
              draggable={false}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: AUTO_MS / 1000, ease: 'easeInOut', repeat: Infinity }}
            />
          </motion.button>
        </AnimatePresence>
      </div>

      <div
        className="pointer-events-none absolute bottom-2.5 left-0 right-0 z-10 flex justify-center gap-1.5 xl:bottom-3"
        role="tablist"
        aria-label="Banners"
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Banner ${i + 1} de ${slides.length}`}
            onClick={(e) => {
              e.stopPropagation()
              if (multi) goTo(i, i > index ? 1 : -1)
              else setCycle((c) => c + 1)
            }}
            className={`pointer-events-auto relative h-1.5 overflow-hidden rounded-full transition-all duration-300 touch-manipulation ${
              i === index ? 'w-6 bg-white/35' : 'w-1.5 bg-white/50 hover:bg-white/80'
            }`}
          >
            {i === index && !paused && (
              <motion.span
                key={`bar-${index}-${cycle}`}
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTO_MS / 1000, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
