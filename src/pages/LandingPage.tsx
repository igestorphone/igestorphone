import { type ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Menu,
  MessageCircle,
  Minus,
  Shield,
  Sparkles,
  TrendingUp,
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

const heroStats = [
  { value: '+12 mil', label: 'Listas processadas' },
  { value: '+180', label: 'Fornecedores monitorados' },
  { value: '97%', label: 'Renovam a assinatura' }
]

const trustStats = [
  { value: 'Brasil', label: 'Operação em todo o país' },
  { value: '+12 mil', label: 'Listas organizadas pela IA' },
  { value: '+180', label: 'Fornecedores no radar' },
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
    title: 'Calendário e médias',
    description: 'Acompanhe tendências de preço e planeje compras com dados do dia.',
    icon: TrendingUp
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
  { label: 'Calendário e médias de preço', us: true, them: false },
  { label: 'Painel de metas e fornecedores', us: true, them: false },
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
    answer: 'Sim. Busca, IA para listas, calendário, metas, fornecedores e suporte via WhatsApp.'
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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }
})

const viewport = { once: true, amount: 0.12 }
const fadeInView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }
})

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/90 backdrop-blur-md">
      {children}
    </span>
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
    const sectionIds = navLinks.map((l) => l.id)
    const elements = sectionIds
      .map((id) => document.getElementById(id))
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
    'rounded-full border border-white/12 bg-[#0c0c14]/80 shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-[padding] duration-300 sm:px-4 sm:pt-4 ${
          scrolled ? 'sm:pt-3' : ''
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <nav
            className={`flex w-full max-w-4xl items-center gap-1 p-1.5 sm:gap-1.5 sm:p-2 ${navPill} ${
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
                    onClick={() => setMenuOpen(false)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-all sm:px-4 ${
                      isActive
                        ? 'bg-white/12 text-white shadow-inner'
                        : 'text-white/70 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </a>
                )
              })}
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 md:hidden">
              <a
                href="#top"
                className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                  activeId === 'top' ? 'bg-white/12 text-white' : 'text-white/70'
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
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>

            <Link
              to="/login"
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-400 hover:to-blue-500 sm:px-5 sm:py-2.5"
            >
              Login
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

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
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={`absolute left-3 right-3 top-[4.25rem] p-3 ${navPill}`}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      activeId === link.id ? 'bg-white/12 text-white' : 'text-white/70'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href={WHATSAPP_ATENDIMENTO}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-center text-sm font-medium text-cyan-300"
                >
                  Falar com especialista
                </a>
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
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
        ok
          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
          : 'border-white/10 bg-white/5 text-white/25'
      }`}
    >
      {ok ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
    </span>
  )
}

export default function LandingPage() {
  return (
    <motion.div className="relative min-h-screen overflow-x-hidden bg-[#06060b] text-white">
      {/* Fundo atmosférico */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.14),transparent)]" />
        <motion.div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(59,130,246,0.08),transparent)]" />
        <motion.div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(99,102,241,0.08),transparent)]" />
        <motion.div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)'
          }}
        />
      </div>

      <LandingNav />

      <main className="scroll-smooth">
        {/* Hero */}
        <section
          id="top"
          className="relative scroll-mt-28 px-5 pb-20 pt-24 sm:px-6 sm:pt-28 lg:pb-28 lg:pt-32"
        >
          <motion.div className="mx-auto max-w-6xl">
            <motion.div className="flex flex-col items-center gap-14 lg:flex-row lg:items-center lg:gap-12">
              <motion.div className="w-full text-center lg:w-[48%] lg:text-left">
                <motion.div {...fadeUp(0)} className="mb-8 flex justify-center lg:justify-start">
                  <Link to="/" className="inline-block">
                    <img
                      src={LOGO_URL}
                      alt="iGestorPhone"
                      className="h-10 w-auto object-contain sm:h-11"
                    />
                  </Link>
                </motion.div>
                <motion.div {...fadeUp(0.04)}>
                  <SectionLabel>
                    <Sparkles className="h-3.5 w-3.5" />
                    Automação para revendas Apple
                  </SectionLabel>
                </motion.div>
                <motion.h1
                  {...fadeUp(0.08)}
                  className="mt-8 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem]"
                >
                  O sistema que organiza{' '}
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                    fornecedores, listas e preços
                  </span>{' '}
                  no mesmo lugar
                </motion.h1>
                <motion.p {...fadeUp(0.16)} className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 lg:mx-0 lg:text-lg">
                  Esqueça planilhas e mensagens perdidas no WhatsApp. IA para listas, busca do menor preço e painéis
                  que aceleram a decisão de compra.
                </motion.p>
                <motion.div {...fadeUp(0.24)} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <a
                    href={WHATSAPP_ATENDIMENTO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-cyan-500/25 transition hover:scale-[1.02] hover:shadow-cyan-500/40"
                  >
                    Quero uma demonstração
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    to="/login"
                    className={`inline-flex items-center justify-center px-7 py-3.5 text-base font-medium text-white/90 transition hover:bg-white/10 ${glass}`}
                  >
                    Já sou cliente
                  </Link>
                </motion.div>
              </motion.div>

              {/* Preview real — Buscar mais barato */}
              <motion.div {...fadeUp(0.12)} className="relative w-full lg:w-[52%]">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-transparent to-blue-600/20 blur-2xl" />
                <motion.div
                  className={`relative overflow-hidden ${glassPanel}`}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <motion.div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-4">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400/90" aria-hidden />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400/90" aria-hidden />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400/90" aria-hidden />
                    <span className="ml-1 min-w-0 flex-1 truncate rounded-lg border border-white/8 bg-black/30 px-3 py-1 text-[10px] text-white/45 sm:text-xs">
                      app.igestorphone.com.br — Buscar mais barato
                    </span>
                  </motion.div>
                  <img
                    src={LANDING_DASHBOARD_IMG}
                    alt="Tela Buscar mais barato: estatísticas, busca, filtros, Indique e Ganhe e lista de preços"
                    className="block w-full"
                    width={1400}
                    height={900}
                    loading="eager"
                    decoding="async"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Stats hero */}
            <motion.div
              {...fadeInView(0.2)}
              className={`mt-14 grid gap-4 p-6 sm:grid-cols-3 sm:p-8 ${glassPanel}`}
            >
              {heroStats.map((stat) => (
                <motion.div key={stat.label} className="text-center sm:text-left">
                  <p className="text-2xl font-bold sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-white/45">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Trust stats — estilo Mercado Phone */}
        <section className="border-y border-white/10 bg-white/[0.02] py-14 backdrop-blur-sm">
          <motion.div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            {trustStats.map((stat, i) => (
              <motion.div key={stat.label} {...fadeInView(i * 0.06)} className="text-center">
                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="scroll-mt-28 px-5 py-20 sm:px-6 sm:py-24">
          <motion.div className="mx-auto max-w-6xl">
            <motion.div {...fadeInView(0)} className="mx-auto max-w-2xl text-center">
              <SectionLabel>Recursos</SectionLabel>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Feito para operações Apple</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
                Da captura da lista à decisão de compra — cada módulo pensado para quem vive de margem e velocidade.
              </p>
            </motion.div>
            <motion.div className="mt-14 grid gap-4 sm:grid-cols-2">
              {highlights.map(({ title, description, icon: Icon }, i) => (
                <motion.div
                  key={title}
                  {...fadeInView(i * 0.05)}
                  className={`group relative overflow-hidden p-6 transition hover:border-cyan-400/25 hover:bg-white/[0.09] ${glass}`}
                >
                  <motion.div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/20" />
                  <motion.div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/25 to-blue-600/20 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Comparativo — estilo Mercado Phone */}
        <section id="comparativo" className="scroll-mt-28 px-5 py-20 sm:px-6 sm:py-24">
          <motion.div className="mx-auto max-w-4xl">
            <motion.div {...fadeInView(0)} className="text-center">
              <SectionLabel>Comparativo</SectionLabel>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">iGestorPhone vs. planilhas</h2>
              <p className="mt-4 text-sm text-white/50">Veja por que lojistas trocam grupos de WhatsApp e Excel por um painel único.</p>
            </motion.div>
            <motion.div {...fadeInView(0.1)} className={`mt-12 overflow-hidden ${glassPanel}`}>
              <motion.div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1 border-b border-white/10 bg-white/[0.06] px-4 py-4 text-sm font-semibold sm:px-6">
                <span className="text-white/70">Recurso</span>
                <span className="text-center text-cyan-300">iGestorPhone</span>
                <span className="text-center text-white/40">Manual</span>
              </motion.div>
              {comparisonRows.map((row, i) => (
                <motion.div
                  key={row.label}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-4 text-sm sm:px-6 ${
                    i % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <span className="text-white/80">{row.label}</span>
                  <span className="flex justify-center">
                    <CompareCell ok={row.us} />
                  </span>
                  <span className="flex justify-center">
                    <CompareCell ok={row.them} />
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Passos */}
        <section id="passos" className="scroll-mt-28 border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24">
          <motion.div className="mx-auto max-w-6xl">
            <motion.div {...fadeInView(0)} className="text-center">
              <SectionLabel>Como funciona</SectionLabel>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Três passos para transformar seu fluxo</h2>
            </motion.div>
            <motion.div className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <motion.div key={step.title} {...fadeInView(index * 0.08)} className={`relative p-6 ${glass}`}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-blue-600/20 text-lg font-bold text-cyan-200">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{step.description}</p>
                  <p className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">
                    {step.highlight}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Assinatura CTA glass */}
        <section id="assinatura" className="scroll-mt-28 px-5 py-20 sm:px-6">
          <motion.div {...fadeInView(0)} className={`relative mx-auto max-w-3xl overflow-hidden p-8 text-center sm:p-12 ${glassPanel}`}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10" />
            <motion.div className="relative">
              <h2 className="text-2xl font-bold sm:text-3xl">Pronto para sair das planilhas?</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
                Demonstração personalizada e ativação do acesso com nossa equipe — fale direto no WhatsApp.
              </p>
              <motion.div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href={WHATSAPP_ATENDIMENTO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-8 py-4 text-base font-semibold shadow-xl shadow-cyan-500/25 transition hover:scale-[1.02]"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chamar no WhatsApp
                </a>
                <Link to="/login" className={`inline-flex items-center justify-center px-8 py-4 text-base font-medium ${glass}`}>
                  Já sou cliente
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Depoimentos */}
        <section className="border-t border-white/10 px-5 py-20 sm:px-6 sm:py-24">
          <motion.div className="mx-auto max-w-6xl">
            <motion.div {...fadeInView(0)} className="text-center">
              <SectionLabel>Depoimentos</SectionLabel>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Quem já usa recomenda</h2>
            </motion.div>
            <motion.div className="mt-14 grid gap-4 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <motion.div key={t.role} {...fadeInView(i * 0.06)} className={`flex flex-col p-6 ${glass}`}>
                  <p className="flex-1 text-sm leading-relaxed text-white/70">&ldquo;{t.content}&rdquo;</p>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-white/40">{t.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-28 px-5 pb-20 sm:px-6">
          <motion.div className="mx-auto max-w-3xl">
            <motion.div {...fadeInView(0)} className="text-center">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="mt-6 text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
            </motion.div>
            <motion.div className="mt-12 space-y-3">
              {faqs.map((faq, i) => (
                <motion.details
                  key={faq.question}
                  {...fadeInView(i * 0.04)}
                  className={`group px-5 py-4 transition open:border-cyan-400/25 open:bg-cyan-500/5 ${glass}`}
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{faq.answer}</p>
                </motion.details>
              ))}
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/40 py-10 backdrop-blur-xl">
        <motion.div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 text-center text-xs text-white/45 sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} iGestorPhone. Todos os direitos reservados.</p>
          <motion.div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            <a href={WHATSAPP_ATENDIMENTO} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
              Atendimento: (11) 94100-7348
            </a>
            <a href={WHATSAPP_SAC} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
              SAC: (11) 92296-1688
            </a>
            <Link to="/terms" className="hover:text-cyan-300">
              Termos
            </Link>
            <Link to="/privacy" className="hover:text-cyan-300">
              Privacidade
            </Link>
            <Link to="/support" className="hover:text-cyan-300">
              Suporte
            </Link>
          </motion.div>
        </motion.div>
      </footer>
    </motion.div>
  )
}
