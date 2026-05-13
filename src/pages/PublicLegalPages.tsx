import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronLeft, FileText, Shield, Lock, Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { CONTACT_EMAIL } from '@/constants/contact'

const PRODUCT = 'iGestorPhone'
/** Data única de revisão dos documentos legais (termos, privacidade e LGPD). */
const LEGAL_PAGES_LAST_UPDATED = '13 de maio de 2026'

function LegalShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useAppStore()
  const isDark = theme === 'dark'

  const tabCls = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      isActive
        ? isDark
          ? 'bg-white text-gray-900'
          : 'bg-gray-900 text-white'
        : isDark
          ? 'text-white/70 hover:bg-white/10'
          : 'text-gray-600 hover:bg-gray-200/80'
    }`

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-zinc-950 text-white' : 'bg-[#f3f4f6] text-gray-900'}`}>
      <header
        className={`shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 border-b ${
          isDark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white/90'
        }`}
      >
        <Link
          to="/"
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${isDark ? 'text-white/85 hover:text-white' : 'text-gray-800 hover:text-gray-950'}`}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={`text-sm font-medium px-3 py-1.5 rounded-lg ${isDark ? 'text-white/80 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Entrar
          </Link>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
              isDark ? 'border-white/15 bg-white/5 text-amber-200' : 'border-gray-200 bg-white text-gray-800'
            }`}
            aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
          <nav
            className={`flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl mb-8 ${
              isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'
            }`}
            aria-label="Documentos legais"
          >
            <NavLink to="/terms" className={tabCls} end>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Termos de uso
              </span>
            </NavLink>
            <NavLink to="/privacy" className={tabCls}>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                Privacidade
              </span>
            </NavLink>
            <NavLink to="/lgpd" className={tabCls}>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                LGPD
              </span>
            </NavLink>
          </nav>

          <article
            className={`rounded-2xl p-6 sm:p-8 shadow-sm border leading-relaxed space-y-8 ${
              isDark ? 'bg-zinc-900/90 border-white/10 text-white/90' : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            {children}
          </article>

          <p className={`text-center text-xs mt-8 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} {PRODUCT}. Documentos informativos; em caso de dúvida, entre em contato.
          </p>
        </div>
      </div>
    </div>
  )
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-xl sm:text-2xl font-bold text-current border-b border-current/15 pb-2">{children}</h2>
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] sm:text-base opacity-95">{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2 text-[15px] sm:text-base opacity-95">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

function TermsBody() {
  return (
    <>
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Termos de uso</h1>
        <p className="text-sm opacity-70">Última atualização: {LEGAL_PAGES_LAST_UPDATED}</p>
      </header>

      <section className="space-y-3">
        <H2>1. Definição do serviço</H2>
        <P>
          O <strong>{PRODUCT}</strong> é uma plataforma online que atua exclusivamente como um <strong>agregador de informações</strong>, reunindo e disponibilizando listas de fornecedores de aparelhos eletrônicos localizados em <strong>São Paulo — SP</strong>.
        </P>
        <P>
          O sistema serve unicamente para disponibilizar informações sobre aparelhos, valores e dados de contato de fornecedores. O <strong>{PRODUCT}</strong> <strong>não intermedia, participa ou realiza nenhuma venda</strong>.
        </P>
        <P>
          Todo e qualquer processo de compra, negociação, pagamento e entrega é realizado <strong>diretamente entre o usuário e o fornecedor</strong>, sem qualquer participação ou intervenção do <strong>{PRODUCT}</strong>.
        </P>
      </section>

      <section className="space-y-3">
        <H2>2. Isenção de responsabilidade</H2>
        <P>O {PRODUCT} não se responsabiliza por:</P>
        <Ul
          items={[
            'Negociações realizadas entre usuários e fornecedores;',
            'Pagamentos, transferências ou transações financeiras de qualquer natureza;',
            'Entregas, prazos ou logística de produtos adquiridos;',
            'Qualidade, autenticidade, procedência ou estado dos produtos anunciados;',
            'Garantias oferecidas ou não pelos fornecedores;',
            'Eventuais prejuízos, danos ou perdas decorrentes de transações entre usuários e fornecedores;',
            'Informações incorretas, desatualizadas ou imprecisas fornecidas pelos fornecedores.',
          ]}
        />
        <P>
          As informações disponibilizadas na plataforma são de caráter meramente informativo. O usuário deve realizar a própria verificação antes de qualquer decisão de compra.
        </P>
      </section>

      <section className="space-y-3">
        <H2>3. Responsabilidades do usuário</H2>
        <P>Ao utilizar o {PRODUCT}, o usuário compromete-se a:</P>
        <Ul
          items={[
            'Fornecer informações verdadeiras e atualizadas no cadastro;',
            'Manter a confidencialidade das credenciais de acesso (e-mail e senha);',
            'Utilizar a plataforma apenas para fins legítimos e de acordo com a legislação vigente;',
            'Não compartilhar o acesso com terceiros;',
            'Não utilizar mecanismos automatizados para acessar ou coletar dados da plataforma sem autorização;',
            'Não reproduzir, copiar ou distribuir as informações da plataforma sem autorização.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>4. Uso adequado da plataforma</H2>
        <P>
          O {PRODUCT} deve ser utilizado exclusivamente para consulta de informações sobre fornecedores e produtos. É expressamente proibido:
        </P>
        <Ul
          items={[
            'Utilizar a plataforma para fins ilegais ou fraudulentos;',
            'Tentar acessar áreas restritas do sistema sem autorização;',
            'Realizar engenharia reversa ou tentar comprometer a segurança do sistema;',
            'Utilizar os dados dos fornecedores para envio de spam ou comunicações não solicitadas;',
            'Revender ou comercializar o acesso à plataforma.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>5. Cancelamento e suspensão de conta</H2>
        <P>O {PRODUCT} reserva-se o direito de suspender ou cancelar a conta de qualquer usuário que:</P>
        <Ul
          items={[
            'Viole estes Termos de Uso;',
            'Utilize a plataforma de forma abusiva ou fraudulenta;',
            'Compartilhe o acesso com terceiros de forma não autorizada;',
            'Não realize o pagamento da assinatura dentro do prazo estipulado.',
          ]}
        />
        <P>
          Em caso de cancelamento, o usuário perderá o acesso à plataforma e aos dados disponibilizados. O {PRODUCT} não é obrigado a devolver valores já pagos em caso de violação dos termos, quando aplicável à política comercial vigente.
        </P>
      </section>

      <section className="space-y-3">
        <H2>6. Propriedade intelectual</H2>
        <P>
          Todo o conteúdo da plataforma, incluindo, mas não se limitando a textos, imagens, logotipos, design, código-fonte e funcionalidades, é de propriedade exclusiva do {PRODUCT} e está protegido pelas leis de propriedade intelectual.
        </P>
      </section>

      <section className="space-y-3">
        <H2>7. Alterações nos termos</H2>
        <P>
          O {PRODUCT} pode alterar estes Termos de Uso a qualquer momento. As alterações entram em vigor após a publicação na plataforma. O uso continuado após alterações constitui aceite dos novos termos, salvo disposição legal em contrário.
        </P>
        <P>Recomendamos revisar periodicamente esta página.</P>
      </section>

      <section className="space-y-3">
        <H2>8. Foro e legislação aplicável</H2>
        <P>
          Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito o <strong>foro da Comarca de São Paulo — SP</strong> para dirimir controvérsias decorrentes destes termos, com renúncia a qualquer outro, por mais privilegiado que seja.
        </P>
      </section>

      <section className="space-y-3">
        <H2>9. Contato</H2>
        <P>
          Para dúvidas sobre estes Termos de Uso:{' '}
          <a className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </P>
      </section>
    </>
  )
}

function PrivacyBody() {
  return (
    <>
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Política de privacidade</h1>
        <p className="text-sm opacity-70">Última atualização: {LEGAL_PAGES_LAST_UPDATED}</p>
      </header>

      <section className="space-y-3">
        <H2>1. Introdução</H2>
        <P>
          O <strong>{PRODUCT}</strong> valoriza a privacidade dos usuários. Esta Política descreve como coletamos, utilizamos, armazenamos e protegemos informações pessoais.
        </P>
        <P>
          Reforçamos que o {PRODUCT} é uma plataforma que reúne e disponibiliza informações sobre fornecedores. <strong>Não intermediamos vendas</strong>; o processo de compra ocorre diretamente entre o usuário e o fornecedor.
        </P>
      </section>

      <section className="space-y-3">
        <H2>2. Dados coletados</H2>
        <P>Podemos coletar, entre outros:</P>
        <Ul
          items={[
            'Nome completo — identificação do usuário;',
            'E-mail — autenticação, comunicação e recuperação de senha;',
            'Número de telefone/WhatsApp — comunicação e notificações do sistema, quando informados;',
            'Dados de acesso — endereço IP, horários de login e dispositivos, para segurança.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>3. Como os dados são utilizados</H2>
        <P>Os dados pessoais são utilizados para:</P>
        <Ul
          items={[
            'Criação e gestão da conta;',
            'Autenticação e segurança do acesso;',
            'Notificações relevantes sobre o sistema (ex.: atualizações, avisos operacionais);',
            'Comunicação sobre assinatura e pagamentos;',
            'Melhoria da plataforma e da experiência do usuário;',
            'Cumprimento de obrigações legais.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>4. Compartilhamento de dados</H2>
        <P>
          O {PRODUCT} <strong>não vende nem aluga</strong> dados pessoais a terceiros para fins comerciais de marketing.
        </P>
        <P>Podem ocorrer compartilhamentos apenas quando:</P>
        <Ul
          items={[
            'Exigido por lei, ordem judicial ou autoridade competente;',
            'Com prestadores essenciais ao funcionamento (ex.: hospedagem, envio de e-mail), sob obrigações de confidencialidade e minimização de dados.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>5. Cookies e tecnologias similares</H2>
        <P>Utilizamos, entre outras:</P>
        <Ul
          items={[
            'Cookies ou tokens de sessão — para manter o login enquanto você usa a plataforma;',
            'Autenticação baseada em token (ex.: JWT) — segurança da sessão;',
            'Armazenamento local (localStorage) — preferências como tema, quando aplicável.',
          ]}
        />
        <P>Não utilizamos cookies de publicidade de terceiros para rastreamento comercial.</P>
      </section>

      <section className="space-y-3">
        <H2>6. Armazenamento e segurança</H2>
        <P>Buscamos proteger as informações com medidas técnicas e organizacionais, incluindo:</P>
        <Ul
          items={[
            'Comunicação via HTTPS;',
            'Senhas armazenadas com hash (ex.: bcrypt);',
            'Controle de acesso por perfil (RBAC), quando aplicável;',
            'Monitoramento e boas práticas de infraestrutura.',
          ]}
        />
        <P>Nenhum sistema é 100% invulnerável; em caso de incidente, adotaremos as medidas previstas em lei.</P>
      </section>

      <section className="space-y-3">
        <H2>7. Direitos do usuário</H2>
        <P>Você pode, conforme a LGPD e esta política:</P>
        <Ul
          items={[
            'Acessar os dados;',
            'Corrigir dados incompletos ou desatualizados;',
            'Solicitar exclusão de dados, observadas retenções legais;',
            'Revogar consentimentos, quando aplicável;',
            'Solicitar informações sobre o tratamento.',
          ]}
        />
        <P>Para exercício de direitos, utilize o contato abaixo ou a área de perfil/configurações quando disponível.</P>
      </section>

      <section className="space-y-3">
        <H2>8. Retenção de dados</H2>
        <P>
          Os dados serão mantidos enquanto a conta estiver ativa ou conforme necessário para cumprimento legal. Após exclusão da conta, poderão ser removidos em até <strong>30 dias</strong>, salvo obrigação legal de retenção.
        </P>
      </section>

      <section className="space-y-3">
        <H2>9. Alterações nesta política</H2>
        <P>
          Esta Política pode ser atualizada. Alterações relevantes poderão ser comunicadas por e-mail ou aviso na plataforma, quando possível.
        </P>
      </section>

      <section className="space-y-3">
        <H2>10. Contato</H2>
        <P>
          Dúvidas sobre privacidade:{' '}
          <a className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </P>
      </section>
    </>
  )
}

function LgpdBody() {
  return (
    <>
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">LGPD — Lei Geral de Proteção de Dados</h1>
        <p className="text-sm opacity-70">Última atualização: {LEGAL_PAGES_LAST_UPDATED}</p>
      </header>

      <section className="space-y-3">
        <P>
          Esta página resume como o <strong>{PRODUCT}</strong> busca cumprir a <strong>Lei nº 13.709/2018 (LGPD)</strong> e como você pode exercer direitos como titular de dados.
        </P>
        <P>
          O {PRODUCT} reúne e disponibiliza listas de fornecedores de aparelhos eletrônicos em São Paulo. <strong>Não intermediamos vendas</strong>. O processo de compra ocorre entre usuário e fornecedor.
        </P>
        <P>
          Os dados pessoais coletados são utilizados para o funcionamento da plataforma e não são compartilhados com fornecedores para fins comerciais de marketing.
        </P>
      </section>

      <section className="space-y-3">
        <H2>1. Base legal para tratamento de dados</H2>
        <P>O tratamento pode se fundamentar, entre outras, nas bases do art. 7º da LGPD:</P>
        <Ul
          items={[
            'Consentimento (inciso I) — ao cadastrar-se e utilizar o serviço nas condições informadas;',
            'Execução de contrato ou procedimentos preliminares (inciso V) — para prestação do acesso à plataforma;',
            'Legítimo interesse (inciso IX) — segurança, prevenção a fraudes e melhoria do serviço, observado o equilíbrio com seus direitos.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>2. Finalidade do tratamento</H2>
        <div className="overflow-x-auto rounded-xl border border-current/10">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className={`border-b border-current/15 ${'opacity-90'}`}>
                <th className="p-3 font-semibold">Dado</th>
                <th className="p-3 font-semibold">Finalidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/10">
              <tr>
                <td className="p-3">Nome</td>
                <td className="p-3">Identificação e personalização do serviço</td>
              </tr>
              <tr>
                <td className="p-3">E-mail</td>
                <td className="p-3">Autenticação, comunicação e recuperação de senha</td>
              </tr>
              <tr>
                <td className="p-3">Telefone/WhatsApp</td>
                <td className="p-3">Notificações e comunicação, quando informado</td>
              </tr>
              <tr>
                <td className="p-3">IP / dispositivo</td>
                <td className="p-3">Segurança, controle de acesso e prevenção a fraudes</td>
              </tr>
              <tr>
                <td className="p-3">Dados de navegação</td>
                <td className="p-3">Melhoria de desempenho e experiência</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <H2>3. Direitos do titular</H2>
        <P>Conforme arts. 18 a 22 da LGPD, entre outros, você pode solicitar:</P>
        <Ul
          items={[
            'Confirmação de tratamento e acesso aos dados;',
            'Correção de dados incompletos, inexatos ou desatualizados;',
            'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;',
            'Portabilidade, nas hipóteses legais;',
            'Eliminação dos dados tratados com base no consentimento, quando aplicável;',
            'Informação sobre compartilhamentos;',
            'Revogação do consentimento, quando essa for a base utilizada.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>4. Como exercer os direitos</H2>
        <P>
          Envie um e-mail para{' '}
          <a className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}?subject=Solicita%C3%A7%C3%A3o%20LGPD`}>
            {CONTACT_EMAIL}
          </a>{' '}
          com o assunto <strong>&quot;Solicitação LGPD&quot;</strong>, informando nome completo, e-mail de cadastro e o pedido. Quando houver área de perfil/configurações, também poderá haver opções de atualização ou exclusão ali.
        </P>
        <P>Responderemos no prazo legal, em geral até <strong>15 dias úteis</strong>, salvo prorrogações previstas na legislação.</P>
      </section>

      <section className="space-y-3">
        <H2>5. Encarregado (DPO)</H2>
        <P>
          O canal do encarregado pelo tratamento de dados pessoais é o mesmo e-mail:{' '}
          <a className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </P>
      </section>

      <section className="space-y-3">
        <H2>6. Segurança dos dados</H2>
        <P>Adotamos medidas técnicas e administrativas compatíveis com o risco, tais como:</P>
        <Ul
          items={[
            'Criptografia em trânsito (HTTPS/TLS);',
            'Senhas com hash (ex.: bcrypt);',
            'Controle de acesso por função (administrador, usuário);',
            'Boas práticas de infraestrutura e backups.',
          ]}
        />
      </section>

      <section className="space-y-3">
        <H2>7. Incidentes de segurança</H2>
        <P>
          Em caso de incidente que possa acarretar risco ou dano relevante aos titulares, comunicaremos a ANPD e os titulares afetados, nos termos do art. 48 da LGPD, quando aplicável.
        </P>
      </section>

      <section className="space-y-3">
        <H2>8. Transferência internacional</H2>
        <P>
          Dados podem ser hospedados em provedores de nuvem, inclusive fora do Brasil, desde que observados os requisitos do art. 33 da LGPD e cláusulas contratuais adequadas.
        </P>
      </section>

      <section className="space-y-3">
        <H2>9. Autoridade Nacional de Proteção de Dados (ANPD)</H2>
        <P>
          Você pode apresentar reclamação à ANPD:{' '}
          <a
            className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2 break-all"
            href="https://www.gov.br/anpd/pt-br"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.gov.br/anpd
          </a>
          .
        </P>
      </section>
    </>
  )
}

export function TermsPublicPage() {
  return (
    <LegalShell>
      <TermsBody />
    </LegalShell>
  )
}

export function PrivacyPublicPage() {
  return (
    <LegalShell>
      <PrivacyBody />
    </LegalShell>
  )
}

export function LgpdPublicPage() {
  return (
    <LegalShell>
      <LgpdBody />
    </LegalShell>
  )
}
