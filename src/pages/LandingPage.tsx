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

const WHATSAPP_URL = 'https://wa.me/5511982645501?text=Ol%C3%A1!%20Quero%20assinar%20o%20iGestorPhone.'
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
    question: 'O plano de R$ 79,99 inclui todos os módulos?',
    answer: 'Sim. Você recebe IA para listas, painel de metas, gestão de fornecedores, notas, relatórios e suporte via WhatsApp.'
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay }
})

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-blue-900/30 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center space-x-3">
            <img src={LOGO_URL} alt="iGestorPhone" className="h-9 w-9 rounded-full border border-white/20 bg-white/10 p-1" />
            <span className="text-xl font-semibold tracking-wide">iGestorPhone</span>
          </Link>
          <nav className="hidden items-center space-x-6 text-sm font-medium text-white/70 md:flex">
            <a href="#features" className="transition hover:text-white">Recursos</a>
            <a href="#steps" className="transition hover:text-white">Como funciona</a>
            <a href="#pricing" className="transition hover:text-white">Preço</a>
            <a href="#depoimentos" className="transition hover:text-white">Depoimentos</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60 md:inline-flex"
            >
              Entrar
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Falar com especialista
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-24 pt-20">
          <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-14 px-6 md:flex-row md:items-start md:gap-10">
            <div className="w-full text-center md:w-1/2 md:text-left">
              <motion.div {...fadeUp(0)}>
                <span className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-4 w-4 text-blue-200" />
                  <span>Automação para revendas Apple</span>
                </span>
              </motion.div>
              <motion.h1
                {...fadeUp(0.1)}
                className="mt-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
              >
                Centralize fornecedores, listas e metas por{' '}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-300 bg-clip-text text-transparent">
                  R$ 79,99/mês
                </span>
              </motion.h1>
              <motion.p
                {...fadeUp(0.2)}
                className="mt-6 text-lg text-white/70"
              >
                Esqueça planilhas e mensagens perdidas. O iGestorPhone usa IA para organizar listas,
                identificar variantes e entregar dashboards que aceleram vendas na sua operação Apple.
              </motion.p>
              <motion.div
                {...fadeUp(0.3)}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
                >
                  Quero uma demonstração <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-base font-semibold text-white transition hover:border-white/50"
                >
                  Já sou cliente
                </Link>
              </motion.div>
              <motion.div
                {...fadeUp(0.4)}
                className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur md:grid-cols-3"
              >
                {heroStats.map(stat => (
                  <div key={stat.label} className="text-left">
                    <p className="text-xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              {...fadeUp(0.2)}
              className="relative w-full max-w-xl md:w-1/2"
            >
              <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-blue-500/40 via-blue-500/10 to-transparent blur-3xl" />
              <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-1 backdrop-blur">
                <div className="relative rounded-[28px] bg-slate-950/80 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={LOGO_URL} alt="iGestorPhone" className="h-10 w-10 rounded-full border border-white/10 bg-white/10 p-1" />
                      <div>
                        <p className="text-sm font-semibold text-white">iGestorPhone</p>
                        <p className="text-xs text-white/60">Dashboard em tempo real</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-100">IA ativa</span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/70">Listas processadas hoje</p>
                      <p className="mt-2 flex items-center text-2xl font-semibold text-white">
                        243 <span className="ml-2 text-xs font-medium text-emerald-300">+18% vs ontem</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-white/70">Fornecedores monitorados</p>
                      <p className="mt-2 flex items-center text-2xl font-semibold text-white">
                        37 <span className="ml-2 text-xs font-medium text-blue-200">4 novos semana</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/70">Top linha do dia</p>
                          <p className="mt-1 text-white">iPhone 16 Pro • Azul • e-SIM • 256 GB</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                          R$ 6.350
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">Metas da semana</span>
                        <Rocket className="h-4 w-4 text-emerald-200" />
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-wide text-white/40">Listas priorizadas:</p>
                      <ul className="mt-1 space-y-1 text-xs text-white/60">
                        <li>• TM • IA automática</li>
                        <li>• AFZ • Conferência manual</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/70">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">Notas rápidas</span>
                        <Zap className="h-4 w-4 text-blue-200" />
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-white/60">
                        <li>• Reprocessar listas da manhã</li>
                        <li>• Atualizar status fornecedor MEU CELULAR SP</li>
                        <li>• Checar metas de metas & notas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="bg-slate-950/60 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <motion.div {...fadeUp(0)} className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Recursos-chave</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Feito para acelerar operações Apple</h2>
              <p className="mt-4 text-white/60 sm:mx-auto sm:max-w-3xl">
                Desde a captura da lista até a tomada de decisão, cada módulo do iGestorPhone foi construído
                com lojistas Apple em mente.
              </p>
            </motion.div>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {highlights.map(({ title, description, icon: Icon }, index) => (
                <motion.div
                  key={title}
                  {...fadeUp(0.1 + index * 0.05)}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition duration-500 group-hover:scale-125" />
                  <div className="relative flex items-start space-x-4">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent p-3 text-blue-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm text-white/70">{description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp(0)} className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Como funciona</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Em três passos você transforma seu fluxo
              </h2>
            </motion.div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...fadeUp(0.1 + index * 0.05)}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur transition hover:border-white/20"
                >
                  <div className="absolute right-4 top-4 text-6xl font-black text-white/5">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm text-white/70">{step.description}</p>
                  <div className="mt-4 inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200">
                    {step.highlight}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-950 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp(0)} className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Preço transparente</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Sem planos confusos. Um valor justo.</h2>
              <p className="mt-4 text-white/60 sm:mx-auto sm:max-w-2xl">
                Você foca em vender. Nós garantimos que fornecedores, listas e indicadores estejam alinhados diariamente.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp(0.1)}
              className="relative mt-12 overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-10 shadow-2xl"
            >
              <div className="absolute -right-24 -top-24 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Plano mensal
                  </span>
                  <h3 className="mt-4 text-3xl font-semibold text-white">iGestorPhone Completo</h3>
                  <p className="mt-3 max-w-xl text-white/60">
                    Tudo incluso: processamento com IA, dashboard em tempo real, metas e notas,
                    gestão de fornecedores, histórico de listas e suporte dedicado via WhatsApp.
                  </p>
                  <ul className="mt-6 grid gap-3 text-white/70 sm:grid-cols-2">
                    {[
                      'Processamento ilimitado de listas com IA',
                      'Metas, notas e alertas em um único painel',
                      'Gestão de fornecedores com histórico completo',
                      'Backups automáticos e infraestrutura em nuvem 24/7'
                    ].map(item => (
                      <li key={item} className="flex items-start space-x-2 text-sm">
                        <Check className="mt-[3px] h-4 w-4 text-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur">
                  <p className="text-sm uppercase tracking-wide text-white/60">Investimento mensal</p>
                  <p className="mt-4 text-5xl font-bold text-white">
                    R$ <span className="text-blue-300">79</span>,99
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-white/50">Sem taxas escondidas • Cancelamento livre</p>
                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                    >
                      Assinar agora
                    </a>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50"
                    >
                      Já tenho acesso
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="depoimentos" className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp(0)} className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Depoimentos</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Operações que já transformamos</h2>
            </motion.div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.role}
                  {...fadeUp(0.1 + index * 0.05)}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left backdrop-blur transition hover:border-white/20"
                >
                  <div className="absolute -right-16 -top-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
                  <p className="relative text-sm text-white/75">{testimonial.content}</p>
                  <p className="relative mt-4 text-xs font-medium uppercase tracking-wide text-white/40">
                    {testimonial.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-950 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div {...fadeUp(0)} className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">Perguntas frequentes</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Tudo que você precisa saber antes de começar</h2>
            </motion.div>
            <div className="mt-12 space-y-4">
              {faqs.map((faq, index) => (
                <motion.details
                  key={faq.question}
                  {...fadeUp(0.05 + index * 0.03)}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:border-white/20"
                >
                  <summary className="cursor-pointer text-base font-semibold text-white outline-none transition group-open:text-blue-200">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm text-white/70">{faq.answer}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 py-16 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-3xl font-semibold">Pronto para elevar sua operação Apple?</h2>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                Agende uma demonstração personalizada, veja como a IA cuida das listas e já saia com um plano
                para sua equipe vender mais com menos esforço.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-600 transition hover:bg-white/90"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar com especialista
              </a>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Entrar no sistema
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-center text-xs text-white/50 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} iGestorPhone. Todos os direitos reservados.</p>
          <div className="flex items-center space-x-4">
            <Link to="/terms" className="hover:text-white/80">Termos de uso</Link>
            <Link to="/support" className="hover:text-white/80">Suporte</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
