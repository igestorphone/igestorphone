import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants
} from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Menu,
  MessageCircle,
  Minus,
  Plus,
  Quote,
  Shield,
  Sparkles,
  Star,
  Workflow,
  X
} from 'lucide-react'

const navLinks = [
  { href: '#top', label: 'Home', id: 'top' },
  { href: '#recursos', label: 'Recursos', id: 'recursos' },
  { href: '#comparativo', label: 'Comparativo', id: 'comparativo' },
  { href: '#passos', label: 'Como funciona', id: 'passos' },
  { href: '#faq', label: 'Dúvidas', id: 'faq' }
] as const

const WHATSAPP_ATENDIMENTO = 'https://wa.me/5511941007348?text=Ol%C3%A1!%20Quero%20assinar%20o%20iGestorPhone.'
const WHATSAPP_SAC = 'https://wa.me/5511922961688'
const LOGO_URL = '/assets/images/logo-dark.png'
const LANDING_DASHBOARD_IMG = '/assets/images/landing-dashboard-search.png'

const glass =
  'rounded-2xl border border-white/10 bg-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150'
const glassPanel =
  'rounded-3xl border border-white/[0.14] bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150'

const floatingBadge =
  'rounded-2xl border border-white/[0.14] bg-[#0b0e18]/90 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl'

/** Botão principal com brilho que atravessa no hover. */
const primaryBtn =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 font-semibold text-white shadow-xl shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/45 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none'

function ButtonShine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[450%] motion-reduce:hidden"
    />
  )
}

type Stat = { label: string; value?: string; prefix?: string; count?: number; suffix?: string }

const heroStats: Stat[] = [
  { prefix: '+', count: 12, suffix: ' mil', label: 'Listas processadas' },
  { prefix: '+', count: 180, label: 'Fornecedores monitorados' },
  { count: 97, suffix: '%', label: 'Renovam a assinatura' }
]

const trustStats: Stat[] = [
  { value: 'Brasil', label: 'Operação em todo o país' },
  { prefix: '+', count: 12, suffix: ' mil', label: 'Listas organizadas pela IA' },
  { prefix: '+', count: 180, label: 'Fornecedores no radar' },
  { value: '24/7', label: 'Acesso web em qualquer lugar' }
]

const highlights = [
  {
    title: 'Busca o menor preço',
    description: 'Compare iPhones lacrado, semi-novo e Android entre fornecedores em tempo real.',
    icon: Sparkles
  },
  {
    title: 'IA nas listas',
    description: 'Cole a lista bruta do WhatsApp e receba produtos, cores e preços organizados.',
    icon: Workflow
  },
  {
    title: 'Ranking e avaliações',
    description: 'Veja quais fornecedores são mais bem avaliados pela comunidade de lojistas antes de fechar.',
    icon: Star
  },
  {
    title: 'Operação segura',
    description: 'Usuários por loja, logs e infraestrutura em nuvem com alta disponibilidade.',
    icon: Shield
  }
]

const comparisonRows = [
  { label: 'Busca menor preço entre fornecedores', us: true, them: false },
  { label: 'Processamento de listas com IA', us: true, them: false },
  { label: 'Ranking e avaliações de fornecedores', us: true, them: false },
  { label: 'Filtro por regiões e fornecedores', us: true, them: false },
  { label: 'Atualização em tempo real no dia', us: true, them: false },
  { label: 'Planilhas e grupos de WhatsApp', us: false, them: true }
]

const steps = [
  {
    title: 'Pesquise o modelo',
    description: 'iPhone 16, Pro Max, cores e armazenamento — tudo numa busca só.',
    highlight: 'Lacrado, semi-novo ou Android.'
  },
  {
    title: 'Veja o menor preço',
    description: 'Fornecedores ranqueados com preço, variante e contato na hora.',
    highlight: 'Atualização automática do dia.'
  },
  {
    title: 'Feche comprando melhor',
    description: 'WhatsApp do fornecedor com um clique e margem protegida.',
    highlight: 'Sem planilha, sem caos no grupo.'
  }
]

const testimonials = [
  {
    content: 'Simplificou o trabalho da equipe e garantiu listas limpas para os clientes.',
    role: 'Loja parceira — São Paulo'
  },
  {
    content: 'Em poucos minutos a IA organiza tudo. O retorno em produtividade foi imediato.',
    role: 'Revendedor Apple — Minas Gerais'
  },
  {
    content: 'O painel mostra o que precisa de atenção. Hoje gerimos fornecedores sem planilhas.',
    role: 'Operação — Rio de Janeiro'
  }
]

const faqs = [
  {
    question: 'A assinatura inclui todos os módulos?',
    answer:
      'Sim. Busca do menor preço, IA para listas, consulta de listas, ranking e avaliações de fornecedores e suporte via WhatsApp.'
  },
  {
    question: 'Funciona no celular?',
    answer: 'Sim. É 100% web — abra no navegador do iPhone ou Android com internet.'
  },
  {
    question: 'Quanto tempo para começar?',
    answer: 'Após a assinatura criamos seu acesso na hora e ajudamos nas primeiras listas.'
  },
  {
    question: 'Tem fidelidade?',
    answer: 'Não. Mensal e você cancela quando quiser.'
  }
]

/* ------------------------------------------------------------------ */
/* Motion presets                                                      */
/* ------------------------------------------------------------------ */

// Curva "expo out": entra rápido e assenta suave.
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const viewport = { once: true, amount: 0.2 }

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE }
})

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.8, delay, ease: EASE }
})

const stagger = (step = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } }
})

const itemUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } }
}

const pop: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 18, delay: 0.15 } }
}

const inViewStagger = { initial: 'hidden', whileInView: 'show', viewport } as const

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/90 backdrop-blur-md">
      {children}
    </span>
  )
}

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <motion.div {...reveal()} className="mx-auto max-w-2xl text-center">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">{subtitle}</p>}
    </motion.div>
  )
}

/** Barra fina no topo que acompanha o scroll. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
    />
  )
}

/** Fundo com "aurora" em movimento lento. Só transform (compositor), sem blur por filtro. */
function AuroraBackground() {
  const blob = 'absolute rounded-full motion-reduce:animate-none'
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`${blob} -top-[30vh] left-[5vw] h-[80vh] w-[90vw] animate-aurora-a`}
        style={{ background: 'radial-gradient(closest-side, rgba(34,211,238,0.16), transparent)' }}
      />
      <div
        className={`${blob} -right-[20vw] top-[25vh] h-[70vh] w-[70vw] animate-aurora-b`}
        style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.12), transparent)' }}
      />
      <div
        className={`${blob} -bottom-[25vh] -left-[20vw] h-[65vh] w-[65vw] animate-aurora-c`}
        style={{ background: 'radial-gradient(closest-side, rgba(99,102,241,0.12), transparent)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)'
        }}
      />
    </div>
  )
}

/** Número que conta de 0 até o valor quando entra na tela. */
function StatValue({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (stat.count == null || !inView) return
    if (reduce) {
      setN(stat.count)
      return
    }
    const controls = animate(0, stat.count, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v))
    })
    return () => controls.stop()
  }, [inView, reduce, stat.count])

  if (stat.count == null) return <span ref={ref}>{stat.value}</span>
  return (
    <span ref={ref} className="tabular-nums">
      {stat.prefix}
      {n}
      {stat.suffix}
    </span>
  )
}

const headline: { text: string; gradient?: boolean }[] = [
  { text: 'O sistema que organiza' },
  { text: 'fornecedores, listas e preços', gradient: true },
  { text: 'no mesmo lugar' }
]

/** Título do hero: cada palavra sobe de trás de uma máscara, em cascata. */
function AnimatedHeadline() {
  const words = headline.flatMap((seg) => seg.text.split(' ').map((w) => ({ w, gradient: !!seg.gradient })))
  const gradientTotal = words.filter((w) => w.gradient).length
  let gradientIndex = 0

  return (
    <motion.h1
      initial="hidden"
      animate="show"
      variants={stagger(0.055, 0.15)}
      className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.35rem]"
    >
      <span className="sr-only">{headline.map((s) => s.text).join(' ')}</span>
      {words.map(({ w, gradient }, i) => {
        // Cada palavra do trecho em gradiente recebe uma "fatia" do mesmo gradiente,
        // para que o conjunto pareça contínuo mesmo animando palavra por palavra.
        const slice = gradient ? (gradientIndex++ / Math.max(gradientTotal - 1, 1)) * 100 : 0
        return (
          <span key={i} aria-hidden>
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span
                className={`inline-block ${gradient ? 'bg-clip-text text-transparent' : ''}`}
                style={
                  gradient
                    ? {
                        backgroundImage: 'linear-gradient(90deg, #67e8f9, #7dd3fc, #60a5fa)',
                        backgroundSize: `${gradientTotal * 100}% 100%`,
                        backgroundPosition: `${slice}% 0`
                      }
                    : undefined
                }
                variants={{
                  hidden: { y: '110%', opacity: 0 },
                  show: { y: '0%', opacity: 1, transition: { duration: 0.9, ease: EASE } }
                }}
              >
                {w}
              </motion.span>
            </span>{' '}
          </span>
        )
      })}
    </motion.h1>
  )
}

/** Print do app com inclinação 3D seguindo o mouse e parallax leve no scroll. */
function HeroPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [40, -40])

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onPointerLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.35, ease: EASE }}
      className="relative w-full [perspective:1400px] lg:w-[52%]"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div style={reduce ? undefined : { y: parallaxY }}>
        <div
          aria-hidden
          className="absolute -inset-4 animate-pulse-slow rounded-[2rem] bg-gradient-to-br from-cyan-400/25 via-transparent to-blue-600/25 blur-2xl motion-reduce:animate-none"
        />
        <motion.div
          className={`relative overflow-hidden ${glassPanel}`}
          style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-4">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400/90" aria-hidden />
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400/90" aria-hidden />
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400/90" aria-hidden />
            <span className="ml-1 min-w-0 flex-1 truncate rounded-lg border border-white/[0.08] bg-black/30 px-3 py-1 text-[10px] text-white/45 sm:text-xs">
              app.igestorphone.com.br — Buscar mais barato
            </span>
          </div>
          <img
            src={LANDING_DASHBOARD_IMG}
            alt="Tela Buscar mais barato: estatísticas, busca, filtros, Indique e Ganhe e lista de preços"
            className="block w-full"
            width={1400}
            height={900}
            loading="eager"
            decoding="async"
          />
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
              initial={{ x: '-120%' }}
              animate={{ x: '320%' }}
              transition={{ duration: 1.4, delay: 1.2, ease: 'easeInOut' }}
            />
          )}
        </motion.div>

        {/* Selos flutuantes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: EASE }}
          className="absolute -left-5 bottom-8 hidden sm:block"
        >
          <div
            className={`flex animate-float-slow items-center gap-3 px-4 py-3 motion-reduce:animate-none ${floatingBadge}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold">Menor preço do dia</span>
              <span className="block text-[11px] text-white/50">Fornecedores ranqueados</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3, ease: EASE }}
          className="absolute -right-4 top-14 hidden sm:block"
        >
          <div
            className={`flex animate-float-slow items-center gap-3 px-4 py-3 [animation-delay:-3s] motion-reduce:animate-none ${floatingBadge}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold">Lista organizada pela IA</span>
              <span className="block text-[11px] text-white/50">Produtos, cores e preços</span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/** Card com um holofote que segue o cursor. */
function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <motion.div
      variants={itemUp}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onPointerMove={onPointerMove}
      className={`group relative overflow-hidden transition-colors duration-300 hover:border-cyan-400/30 ${glass} ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), rgba(34,211,238,0.13), transparent 45%)'
        }}
      />
      {children}
    </motion.div>
  )
}

function LandingNav() {
  const [activeId, setActiveId] = useState<string>('top')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const elements = navLinks
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => el != null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navPill =
    'rounded-full border border-white/[0.12] bg-[#0c0c14]/80 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150'

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-[padding] duration-300 sm:px-4 sm:pt-4 ${
          scrolled ? 'sm:pt-3' : ''
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <nav
            className={`flex w-full max-w-4xl items-center gap-1 p-1.5 transition-shadow duration-300 sm:gap-1.5 sm:p-2 ${navPill} ${
              scrolled ? 'shadow-[0_16px_56px_rgba(0,0,0,0.55)]' : ''
            }`}
            aria-label="Principal"
          >
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
              {navLinks.map((link) => {
                const isActive = activeId === link.id
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
                      isActive ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="landing-nav-active"
                        className="absolute inset-0 rounded-full bg-white/[0.12] shadow-inner"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{link.label}</span>
                  </a>
                )
              })}
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 md:hidden">
              <a
                href="#top"
                className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                  activeId === 'top' ? 'bg-white/[0.12] text-white' : 'text-white/70'
                }`}
              >
                Home
              </a>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={menuOpen ? 'x' : 'menu'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>

            <Link
              to="/login"
              className="group ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-400 hover:to-blue-500 sm:px-5 sm:py-2.5"
            >
              Login
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`absolute left-3 right-3 top-[4.25rem] p-3 ${navPill}`}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="flex flex-col gap-1" initial="hidden" animate="show" variants={stagger(0.04, 0.05)}>
                {navLinks.map((link) => (
                  <motion.a
                    key={link.id}
                    variants={itemUp}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      activeId === link.id ? 'bg-white/[0.12] text-white' : 'text-white/70'
                    }`}
                  >
                    {link.label}
                  </motion.a>
                ))}
                <motion.a
                  variants={itemUp}
                  href={WHATSAPP_ATENDIMENTO}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-center text-sm font-medium text-cyan-300"
                >
                  Falar com especialista
                </motion.a>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function CompareCell({ ok }: { ok: boolean }) {
  return (
    <motion.span
      variants={pop}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
        ok
          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
          : 'border-white/10 bg-white/5 text-white/25'
      }`}
    >
      {ok ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
    </motion.span>
  )
}

function FaqList() {
  const [open, setOpen] = useState<number | null>(0)
  const reduce = useReducedMotion()

  return (
    <motion.div {...inViewStagger} variants={stagger(0.06)} className="mt-12 space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        const panelId = `faq-panel-${i}`
        return (
          <motion.div
            key={faq.question}
            variants={itemUp}
            className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors duration-300 ${
              isOpen
                ? 'border-cyan-400/25 bg-cyan-500/[0.06]'
                : 'border-white/10 bg-white/[0.07] hover:border-white/20'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold"
            >
              {faq.question}
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isOpen ? 'border-cyan-400/40 text-cyan-300' : 'border-white/10 text-white/60'
                }`}
              >
                <Plus className="h-4 w-4" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-white/60">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const reduce = useReducedMotion()

  // Rolagem suave nos links âncora, só enquanto a landing está montada.
  useEffect(() => {
    if (reduce) return
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = 'smooth'
    return () => {
      root.style.scrollBehavior = previous
    }
  }, [reduce])

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-hidden bg-[#06060b] text-white">
        <AuroraBackground />
        <ScrollProgress />
        <LandingNav />

        <main>
          {/* Hero */}
          <section id="top" className="relative scroll-mt-28 px-5 pb-20 pt-24 sm:px-6 sm:pt-28 lg:pb-28 lg:pt-32">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col items-center gap-14 lg:flex-row lg:items-center lg:gap-12">
                <div className="w-full text-center lg:w-[48%] lg:text-left">
                  <motion.div {...fadeUp(0)} className="mb-8 flex justify-center lg:justify-start">
                    <Link to="/" className="inline-block">
                      <img src={LOGO_URL} alt="iGestorPhone" className="h-10 w-auto object-contain sm:h-11" />
                    </Link>
                  </motion.div>
                  <motion.div {...fadeUp(0.08)}>
                    <SectionLabel>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60 motion-reduce:animate-none" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                      </span>
                      Automação para revendas Apple
                    </SectionLabel>
                  </motion.div>

                  <AnimatedHeadline />

                  <motion.p
                    {...fadeUp(0.55)}
                    className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 lg:mx-0 lg:text-lg"
                  >
                    Esqueça planilhas e mensagens perdidas no WhatsApp. IA para listas, busca do menor preço e painéis
                    que aceleram a decisão de compra.
                  </motion.p>
                  <motion.div
                    {...fadeUp(0.68)}
                    className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
                  >
                    <a
                      href={WHATSAPP_ATENDIMENTO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${primaryBtn} px-7 py-3.5 text-base`}
                    >
                      <ButtonShine />
                      Quero uma demonstração
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                    <Link
                      to="/login"
                      className={`inline-flex items-center justify-center px-7 py-3.5 text-base font-medium text-white/90 transition hover:border-white/25 hover:bg-white/10 ${glass}`}
                    >
                      Já sou cliente
                    </Link>
                  </motion.div>
                </div>

                <HeroPreview />
              </div>

              {/* Stats hero */}
              <motion.div
                {...inViewStagger}
                variants={stagger(0.1, 0.1)}
                className={`mt-16 grid gap-6 p-6 sm:grid-cols-3 sm:p-8 ${glassPanel}`}
              >
                {heroStats.map((stat) => (
                  <motion.div key={stat.label} variants={itemUp} className="text-center sm:text-left">
                    <p className="text-2xl font-bold sm:text-3xl">
                      <StatValue stat={stat} />
                    </p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-white/45">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Trust stats */}
          <section className="border-y border-white/10 bg-white/[0.02] py-14 backdrop-blur-sm">
            <motion.div
              {...inViewStagger}
              variants={stagger(0.08)}
              className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4"
            >
              {trustStats.map((stat) => (
                <motion.div key={stat.label} variants={itemUp} className="text-center">
                  <p className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                    <StatValue stat={stat} />
                  </p>
                  <p className="mt-2 text-sm text-white/50">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Recursos */}
          <section id="recursos" className="scroll-mt-28 px-5 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHeader
                label="Recursos"
                title="Feito para operações Apple"
                subtitle="Da captura da lista à decisão de compra — cada módulo pensado para quem vive de margem e velocidade."
              />
              <motion.div {...inViewStagger} variants={stagger(0.08)} className="mt-14 grid gap-4 sm:grid-cols-2">
                {highlights.map(({ title, description, icon: Icon }) => (
                  <SpotlightCard key={title} className="p-6 sm:p-7">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/25 to-blue-600/20 text-cyan-300 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="relative mt-5 text-lg font-semibold">{title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-white/55">{description}</p>
                  </SpotlightCard>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Comparativo */}
          <section id="comparativo" className="scroll-mt-28 px-5 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-4xl">
              <SectionHeader
                label="Comparativo"
                title="iGestorPhone vs. planilhas"
                subtitle="Veja por que lojistas trocam grupos de WhatsApp e Excel por um painel único."
              />
              <motion.div {...reveal(0.1)} className={`mt-12 overflow-hidden ${glassPanel}`}>
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1 border-b border-white/10 bg-white/[0.06] px-4 py-4 text-sm font-semibold sm:px-6">
                  <span className="text-white/70">Recurso</span>
                  <span className="text-center text-cyan-300">iGestorPhone</span>
                  <span className="text-center text-white/40">Manual</span>
                </div>
                <motion.div {...inViewStagger} variants={stagger(0.07, 0.2)}>
                  {comparisonRows.map((row, i) => (
                    <motion.div
                      key={row.label}
                      variants={{
                        hidden: { opacity: 0, x: -16 },
                        show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } }
                      }}
                      className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-4 text-sm transition-colors hover:bg-white/[0.05] sm:px-6 ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <span className="text-white/80">{row.label}</span>
                      <span className="flex w-[5.5rem] justify-center">
                        <CompareCell ok={row.us} />
                      </span>
                      <span className="flex w-[3.5rem] justify-center">
                        <CompareCell ok={row.them} />
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Passos */}
          <section id="passos" className="scroll-mt-28 border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-6xl">
              <SectionHeader label="Como funciona" title="Três passos para transformar seu fluxo" />
              <motion.div {...inViewStagger} variants={stagger(0.15)} className="mt-14 grid gap-5 md:grid-cols-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    variants={itemUp}
                    whileHover={{ y: -4 }}
                    className={`relative p-6 transition-colors duration-300 hover:border-cyan-400/25 ${glass}`}
                  >
                    {/* Conector entre os cards (desktop) */}
                    {index < steps.length - 1 && (
                      <motion.span
                        aria-hidden
                        variants={{
                          hidden: { scaleX: 0 },
                          show: { scaleX: 1, transition: { duration: 0.6, delay: 0.45, ease: EASE } }
                        }}
                        className="absolute -right-5 top-11 hidden h-px w-5 origin-left bg-gradient-to-r from-cyan-400/80 to-blue-500/40 md:block"
                      />
                    )}
                    <motion.span
                      variants={pop}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-blue-600/20 text-lg font-bold text-cyan-200 ring-1 ring-cyan-400/20"
                    >
                      {index + 1}
                    </motion.span>
                    <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/55">{step.description}</p>
                    <p className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">
                      {step.highlight}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Assinatura CTA com borda animada */}
          <section id="assinatura" className="scroll-mt-28 px-5 py-20 sm:px-6">
            <motion.div
              {...reveal()}
              className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white/10 p-px shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            >
              <div
                aria-hidden
                className="absolute -inset-[100%] animate-[spin_10s_linear_infinite] motion-reduce:animate-none"
                style={{
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,0.9) 50deg, transparent 110deg, transparent 180deg, rgba(59,130,246,0.8) 230deg, transparent 290deg)'
                }}
              />
              <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0a0d16]/95 p-8 text-center backdrop-blur-2xl sm:p-12">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10"
                />
                <div className="relative">
                  <h2 className="text-2xl font-bold sm:text-3xl">Pronto para sair das planilhas?</h2>
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
                    Demonstração personalizada e ativação do acesso com nossa equipe — fale direto no WhatsApp.
                  </p>
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <a
                      href={WHATSAPP_ATENDIMENTO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${primaryBtn} px-8 py-4 text-base`}
                    >
                      <ButtonShine />
                      <MessageCircle className="h-5 w-5" />
                      Chamar no WhatsApp
                    </a>
                    <Link
                      to="/login"
                      className={`inline-flex items-center justify-center px-8 py-4 text-base font-medium transition hover:border-white/25 hover:bg-white/10 ${glass}`}
                    >
                      Já sou cliente
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Depoimentos */}
          <section className="border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-6xl">
              <SectionHeader label="Depoimentos" title="Quem já usa recomenda" />
              <motion.div {...inViewStagger} variants={stagger(0.1)} className="mt-14 grid gap-4 md:grid-cols-3">
                {testimonials.map((t) => (
                  <motion.figure
                    key={t.role}
                    variants={itemUp}
                    whileHover={{ y: -4 }}
                    className={`flex flex-col p-6 transition-colors duration-300 hover:border-white/20 ${glass}`}
                  >
                    <Quote className="h-6 w-6 text-cyan-400/50" aria-hidden />
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/70">
                      &ldquo;{t.content}&rdquo;
                    </blockquote>
                    <figcaption className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      {t.role}
                    </figcaption>
                  </motion.figure>
                ))}
              </motion.div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-28 px-5 pb-24 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <SectionHeader label="FAQ" title="Perguntas frequentes" />
              <FaqList />
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-black/40 py-10 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 text-center text-xs text-white/45 sm:flex-row sm:px-6 sm:text-left">
            <p>© {new Date().getFullYear()} iGestorPhone. Todos os direitos reservados.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
              <a href={WHATSAPP_ATENDIMENTO} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-300">
                Atendimento: (11) 94100-7348
              </a>
              <a href={WHATSAPP_SAC} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-300">
                SAC: (11) 92296-1688
              </a>
              <Link to="/terms" className="transition-colors hover:text-cyan-300">
                Termos
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-cyan-300">
                Privacidade
              </Link>
              <Link to="/support" className="transition-colors hover:text-cyan-300">
                Suporte
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}
