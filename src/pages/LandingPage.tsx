import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  MessageCircle,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap
} from 'lucide-react'

const WHATSAPP_ATENDIMENTO = 'https://wa.me/5511941007348?text=Ol%C3%A1!%20Quero%20assinar%20o%20iGestorPhone.'
const WHATSAPP_SAC = 'https://wa.me/5511922961688'
const LOGO_URL = '/assets/images/logo.png'

const heroStats = [
  { value: '+12 mil', label: 'Listas processadas' },
  { value: '+180', label: 'Fornecedores monitorados' },
  { value: '97%', label: 'Clientes ativos renovam' }
]

const highlights = [
  {
    title: 'IA a seu favor',
    description: 'Padronize listas cruas, detecte variações de armazenamento e mergulhe em insights instantâneos.',
    icon: Sparkles
  },
  {
    title: 'Gestão centralizada',
    description: 'Histórico completo de fornecedores, metas e notas em um painel pensado para times Apple.',
    icon: Workflow
  },
  {
    title: 'Resultados visíveis',
    description: 'Dashboards com indicadores e alertas para agir na hora certa e manter margens saudáveis.',
    icon: TrendingUp
  },
  {
    title: 'Camada de segurança',
    description: 'Acesso por usuário, logs e infraestrutura em nuvem com alta disponibilidade.',
    icon: Shield
  }
]

const steps = [
  {
    title: 'Envie suas listas',
    description: 'Importe arquivos, cole mensagens ou crie integrações. A IA cuida do resto.',
    highlight: 'Compatível com CSV, texto e WhatsApp.'
  },
  {
    title: 'Valide em minutos',
    description: 'Veja tudo normalizado, com variantes como ANATEL, e-SIM e cores identificadas.',
    highlight: 'Processamento automático e histórico salvo.'
  },
  {
    title: 'Execute com clareza',
    description: 'Acompanhe metas, notas e fornecedores em tempo real e feche mais vendas.',
    highlight: 'Painel completo em nuvem, 24/7.'
  }
]

const testimonials = [
  {
    content: '“Simplificou o trabalho da equipe e garantiu que as listas cheguem limpas para os clientes.”',
    role: 'Loja parceira em São Paulo'
  },
  {
    content: '“Em poucos minutos, a IA organiza tudo. O retorno em produtividade foi imediato.”',
    role: 'Revendedor Apple em Minas Gerais'
  },
  {
    content: '“O painel mostra exatamente o que precisa de atenção. Hoje gerimos fornecedores sem planilhas.”',
    role: 'Operação no Rio de Janeiro'
  }
]

const faqs = [
  {
    question: 'Os planos incluem todos os módulos?',
    answer: 'Sim. Você recebe IA para listas, painel de metas, gestão de fornecedores, notas, relatórios e suporte via WhatsApp em todos os planos.'
  },
  {
    question: 'Consigo usar no celular?',
    answer: 'Totalmente. O iGestorPhone roda no navegador, então basta ter internet para acompanhar sua operação de qualquer lugar.'
  },
  {
    question: 'Quanto tempo leva para entrar no ar?',
    answer: 'Após a assinatura, criamos seu acesso na hora e acompanhamos a migração das primeiras listas com você.'
  },
  {
    question: 'Existe contrato de fidelidade?',
    answer: 'Não. A assinatura é mensal e você cancela quando quiser. Mas a maioria dos clientes continua porque vê resultado.'
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

const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.99 }
}
const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.03 },
  tap: { scale: 0.98 }
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-[100px]" />
        <div className="absolute -left-40 top-1/4 h-64 w-64 rounded-full bg-white/[0.03] blur-[80px]" />
        <div className="absolute -right-40 bottom-1/4 h-64 w-64 rounded-full bg-white/[0.03] blur-[80px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="iGestorPhone" className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 p-1" />
            <span className="text-lg font-semibold tracking-tight text-white">iGestorPhone</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Recursos</a>
            <a href="#steps" className="transition-colors hover:text-white">Como funciona</a>
            <a href="#pricing" className="transition-colors hover:text-white">Preço</a>
            <a href="#depoimentos" className="transition-colors hover:text-white">Depoimentos</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:border-white/20 hover:bg-white/5 md:inline-flex"
            >
              Entrar
            </Link>
            <a
              href={WHATSAPP_ATENDIMENTO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Falar com especialista
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-28 pt-24">
          <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-16 px-6 md:flex-row md:items-start md:gap-12">
            <div className="w-full text-center md:w-1/2 md:text-left">
              <motion.div {...fadeUp(0)}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-white/60">
                  <Sparkles className="h-3.5 w-3.5 text-white/50" />
                  Automação para revendas Apple
                </span>
              </motion.div>
              <motion.h1
                {...fadeUp(0.1)}
                className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.25rem]"
              >
                Centralize fornecedores, listas e metas a partir de{' '}
                <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  R$ 100/mês
                </span>
              </motion.h1>
              <motion.p
                {...fadeUp(0.2)}
                className="mt-6 max-w-lg text-base leading-relaxed text-white/50 md:text-lg"
              >
                Esqueça planilhas e mensagens perdidas. IA para organizar listas,
                identificar variantes e dashboards que aceleram vendas na sua operação Apple.
              </motion.p>
              <motion.div
                {...fadeUp(0.3)}
                className="mt-10 flex flex-col gap-3 sm:flex-row"
              >
                <motion.a
                  href={WHATSAPP_ATENDIMENTO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-black"
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Quero uma demonstração <ArrowRight className="h-4 w-4" />
                </motion.a>
                <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap" transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.02] px-6 py-3.5 text-base font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                  >
                    Já sou cliente
                  </Link>
                </motion.div>
              </motion.div>
              <motion.div
                className="mt-12 grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 md:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
              >
                {heroStats.map(stat => (
                  <motion.div
                    key={stat.label}
                    variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }}
                    transition={{ duration: 0.4 }}
                    className="text-left"
                  >
                    <p className="text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-white/40">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              {...fadeUp(0.2)}
              className="relative w-full max-w-xl md:w-1/2"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-white/10 to-transparent opacity-50" />
              <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-[1px]"
                initial={{ boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
                whileHover={{ boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative rounded-[22px] bg-black/80 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={LOGO_URL} alt="iGestorPhone" className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 p-1" />
                      <div>
                        <p className="text-sm font-semibold text-white">iGestorPhone</p>
                        <p className="text-xs text-white/50">Dashboard em tempo real</p>
                      </div>
                    </div>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/70">IA ativa</span>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/50">Listas processadas hoje</p>
                      <p className="mt-2 flex items-baseline gap-2 text-xl font-semibold text-white">
                        243 <span className="text-[10px] font-medium text-white/50">+18% vs ontem</span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/50">Fornecedores monitorados</p>
                      <p className="mt-2 flex items-baseline gap-2 text-xl font-semibold text-white">
                        37 <span className="text-[10px] font-medium text-white/50">4 novos na semana</span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-white/50">Top linha do dia</p>
                          <p className="mt-1 text-sm text-white">iPhone 16 Pro • Azul • e-SIM • 256 GB</p>
                        </div>
                        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                          R$ 6.350
                        </span>
                      </div>
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-3/4 rounded-full bg-white/30" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white/90">Metas da semana</span>
                        <Rocket className="h-4 w-4 text-white/40" />
                      </div>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-white/40">Listas priorizadas</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-white/50">
                        <li>• TM • IA automática</li>
                        <li>• AFZ • Conferência manual</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white/90">Notas rápidas</span>
                        <Zap className="h-4 w-4 text-white/40" />
                      </div>
                      <ul className="mt-2 space-y-0.5 text-xs text-white/50">
                        <li>• Reprocessar listas da manhã</li>
                        <li>• Atualizar status fornecedor</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div {...fadeInView(0)} className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">Recursos</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Feito para operações Apple</h2>
              <p className="mt-4 text-white/50 sm:mx-auto sm:max-w-2xl text-sm leading-relaxed">
                Da captura da lista à decisão. Cada módulo pensado para lojistas Apple.
              </p>
            </motion.div>
            <motion.div
              className="mt-14 grid gap-4 lg:grid-cols-2"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
            >
              {highlights.map(({ title, description, icon: Icon }, index) => (
                <motion.div
                  key={title}
                  variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group relative flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors group-hover:bg-white/[0.08]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="steps" className="scroll-mt-20 border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeInView(0)} className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">Como funciona</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Três passos para transformar seu fluxo</h2>
            </motion.div>
            <motion.div
              className="mt-14 grid gap-6 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 24 } }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
                  whileHover={{ y: -3 }}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg font-bold text-white/80">
                    {index + 1}
                  </div>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">{step.description}</p>
                  <span className="mt-4 inline-block rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/60">
                    {step.highlight}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeInView(0)} className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">Preço</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Simples e transparente</h2>
              <p className="mt-4 text-sm text-white/50 sm:mx-auto sm:max-w-xl">
                Mesmos recursos em todos os planos. Quanto maior o compromisso, menor o valor mensal.
              </p>
            </motion.div>

            <motion.div
              className="mt-14 grid gap-4 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
            >
              {/* Plano Mensal */}
              <motion.div
                variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.12]"
                whileHover={{ y: -4 }}
              >
                <span className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70">
                  Mensal
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">iGestorPhone</h3>
                <p className="mt-1 text-sm text-white/50">Ideal para começar</p>
                <div className="mt-6">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">por mês</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                    R$ <span className="text-white">150</span>
                  </p>
                  <p className="mt-1 text-xs text-white/45">cobrança mensal</p>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-white/60">
                  {['Processamento ilimitado com IA', 'Metas, notas e alertas', 'Gestão de fornecedores', 'Suporte via WhatsApp'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-white/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href={WHATSAPP_ATENDIMENTO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Assinar
                  </a>
                </div>
              </motion.div>

              {/* Plano Trimestral - Destaque */}
              <motion.div
                variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative rounded-2xl border-2 border-white/20 bg-white/[0.04] p-6 transition-colors hover:border-white/30"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <span className="absolute right-4 top-4 rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                  Popular
                </span>
                <span className="inline-flex rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/90">
                  Trimestral
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">iGestorPhone</h3>
                <p className="mt-1 text-sm text-white/60">Economia de 13%</p>
                <div className="mt-6">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">equivalente a</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                    R$ <span className="text-white">130</span>
                  </p>
                  <p className="mt-1 text-xs text-white/45">por mês · cobrança trimestral</p>
                  <p className="mt-1 text-xs text-white/40 line-through">R$ 150/mês</p>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-white/60">
                  {['Processamento ilimitado com IA', 'Metas, notas e alertas', 'Gestão de fornecedores', 'Suporte via WhatsApp'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-white/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href={WHATSAPP_ATENDIMENTO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-white py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Assinar
                  </a>
                </div>
              </motion.div>

              {/* Plano Anual */}
              <motion.div
                variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.12]"
                whileHover={{ y: -4 }}
              >
                <span className="absolute right-4 top-4 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/70">
                  Melhor valor
                </span>
                <span className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/70">
                  Anual
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">iGestorPhone</h3>
                <p className="mt-1 text-sm text-white/50">Economia de 33%</p>
                <div className="mt-6">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">equivalente a</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                    R$ <span className="text-white">100</span>
                  </p>
                  <p className="mt-1 text-xs text-white/45">por mês · cobrança anual</p>
                  <p className="mt-1 text-xs text-white/40 line-through">R$ 150/mês</p>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-white/60">
                  {['Processamento ilimitado com IA', 'Metas, notas e alertas', 'Gestão de fornecedores', 'Suporte via WhatsApp'].map(item => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-white/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href={WHATSAPP_ATENDIMENTO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Assinar
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="depoimentos" className="scroll-mt-20 border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeInView(0)} className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">Depoimentos</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Quem já usa</h2>
            </motion.div>
            <motion.div
              className="mt-14 grid gap-4 md:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
            >
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.role}
                  variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:border-white/[0.1]"
                  whileHover={{ y: -2 }}
                >
                  <p className="text-sm leading-relaxed text-white/70">"{testimonial.content.replace(/^"|"$/g, '')}"</p>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-white/40">
                    {testimonial.role}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-3xl px-6">
            <motion.div {...fadeInView(0)} className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Perguntas frequentes</h2>
            </motion.div>
            <motion.div
              className="mt-14 space-y-3"
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={{ visible: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
            >
              {faqs.map((faq) => (
                <motion.details
                  key={faq.question}
                  variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 12 } }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/[0.1] [&[open]]:border-white/[0.12]"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{faq.answer}</p>
                </motion.details>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.section
          className="border-t border-white/[0.06] py-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 px-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pronto para começar?</h2>
              <p className="mt-2 max-w-md text-sm text-white/50">
                Demonstração personalizada. Veja a IA em ação e escolha o plano ideal para sua equipe.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.a
                href={WHATSAPP_ATENDIMENTO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black"
                variants={buttonHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <MessageCircle className="h-4 w-4" />
                Falar com especialista
              </motion.a>
              <motion.div variants={buttonHover} initial="rest" whileHover="hover" whileTap="tap" transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.02] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                >
                  Entrar no sistema
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-center text-xs text-white/40 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} iGestorPhone. Todos os direitos reservados.</p>
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center gap-4">
              <a href={WHATSAPP_ATENDIMENTO} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white/70">Atendimento: (11) 94100-7348</a>
              <a href={WHATSAPP_SAC} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white/70">SAC: (11) 92296-1688</a>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="transition-colors hover:text-white/70">Termos de uso</Link>
              <Link to="/support" className="transition-colors hover:text-white/70">Suporte</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
