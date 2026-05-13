import nodemailer from 'nodemailer';

const DEFAULT_FROM = 'contato@igestorphone.com.br';
const DEFAULT_ADMIN_NOTIFY = 'igestorphone@gmail.com';

let cachedTransport = null;

export function isMailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (cachedTransport) return cachedTransport;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransport;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * E-mail de boas-vindas ao usuário + aviso ao admin (todos com From principal).
 * Não lança: erros são logados (cadastro já foi persistido).
 */
export async function sendRegistrationEmails(payload) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[mail] SMTP não configurado (SMTP_HOST, SMTP_USER, SMTP_PASS); e-mails de cadastro ignorados.');
    return;
  }

  const fromAddr = (process.env.MAIL_FROM || DEFAULT_FROM).trim();
  const fromName = (process.env.MAIL_FROM_NAME || 'iGestorPhone').trim();
  const from = `"${fromName}" <${fromAddr}>`;
  const adminTo = (process.env.ADMIN_NOTIFY_EMAIL || DEFAULT_ADMIN_NOTIFY).trim();

  const {
    userName,
    userEmail,
    userId,
    nomeLoja,
    whatsapp,
    endereco,
    cnpj,
    registrationKind,
    ip,
    userAgent,
  } = payload;

  const kindLabel =
    registrationKind === 'user_registered_public'
      ? 'Cadastro público (site)'
      : registrationKind === 'user_registered_via_token'
        ? 'Cadastro por link de convite'
        : String(registrationKind || '—');

  const welcomeSubject = 'Bem-vindo ao iGestorPhone — cadastro recebido';
  const welcomeText = `Olá, ${userName}!

Recebemos seu cadastro no iGestorPhone. Sua conta está aguardando aprovação de um administrador.

Assim que for aprovada, você poderá acessar o sistema com o e-mail e a senha que cadastrou.

Dúvidas? Fale conosco: ${fromAddr}

— Equipe iGestorPhone`;

  const welcomeHtml = `<p>Olá, <strong>${escapeHtml(userName)}</strong>,</p>
<p>Recebemos seu cadastro no <strong>iGestorPhone</strong>. Sua conta está <strong>aguardando aprovação</strong> de um administrador.</p>
<p>Assim que for aprovada, você poderá acessar com o e-mail e a senha que cadastrou.</p>
<p>Dúvidas? <a href="mailto:${escapeHtml(fromAddr)}">${escapeHtml(fromAddr)}</a></p>
<p>— Equipe iGestorPhone</p>`;

  const detailLines = [
    `Tipo: ${kindLabel}`,
    userId != null ? `ID no sistema: ${userId}` : null,
    `Nome: ${userName}`,
    `E-mail: ${userEmail}`,
    nomeLoja ? `Nome da loja: ${nomeLoja}` : null,
    whatsapp ? `WhatsApp: ${whatsapp}` : null,
    endereco ? `Endereço: ${endereco}` : null,
    cnpj ? `CNPJ: ${cnpj}` : null,
    ip ? `IP: ${ip}` : null,
    userAgent ? `User-Agent: ${userAgent}` : null,
  ].filter(Boolean);

  const adminSubject = `[iGestorPhone] Novo cadastro: ${userName}`;
  const adminText = ['Um novo usuário se cadastrou no iGestorPhone.', '', ...detailLines, '', '---', 'Mensagem automática.'].join('\n');
  const adminHtml = `<p><strong>Novo cadastro</strong> no iGestorPhone.</p><ul>${detailLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('')}</ul>`;

  const welcomeMail = {
    from,
    to: userEmail,
    replyTo: fromAddr,
    subject: welcomeSubject,
    text: welcomeText,
    html: welcomeHtml,
  };

  const adminMail = {
    from,
    to: adminTo,
    replyTo: fromAddr,
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
  };

  const [welcomeResult, adminResult] = await Promise.allSettled([
    transport.sendMail(welcomeMail),
    transport.sendMail(adminMail),
  ]);

  if (welcomeResult.status === 'rejected') {
    console.error('[mail] Falha ao enviar boas-vindas:', welcomeResult.reason?.message || welcomeResult.reason);
  }
  if (adminResult.status === 'rejected') {
    console.error('[mail] Falha ao enviar aviso ao admin:', adminResult.reason?.message || adminResult.reason);
  }
}

/**
 * Usuário criado pelo admin no painel (POST /users): boas-vindas + aviso interno (mesmo From).
 */
export async function sendAdminCreatedUserEmails(payload) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[mail] SMTP não configurado (SMTP_HOST, SMTP_USER, SMTP_PASS); e-mails ignorados.');
    return;
  }

  const fromAddr = (process.env.MAIL_FROM || DEFAULT_FROM).trim();
  const fromName = (process.env.MAIL_FROM_NAME || 'iGestorPhone').trim();
  const from = `"${fromName}" <${fromAddr}>`;
  const adminTo = (process.env.ADMIN_NOTIFY_EMAIL || DEFAULT_ADMIN_NOTIFY).trim();

  const {
    userId,
    userName,
    userEmail,
    tipo,
    telefone,
    endereco,
    cidade,
    estado,
    cep,
    cpf,
    rg,
    isActive,
    adminId,
    adminName,
    adminEmail,
    ip,
    userAgent,
  } = payload;

  const welcomeSubject = 'Bem-vindo ao iGestorPhone — sua conta foi criada';
  const welcomeText = `Olá, ${userName}!

Sua conta no iGestorPhone foi criada pela nossa equipe (painel administrativo).

Você já pode acessar o sistema com este e-mail e a senha definidos no cadastro.

Dúvidas? ${fromAddr}

— Equipe iGestorPhone`;

  const welcomeHtml = `<p>Olá, <strong>${escapeHtml(userName)}</strong>,</p>
<p>Sua conta no <strong>iGestorPhone</strong> foi criada pela nossa equipe (painel administrativo).</p>
<p>Você já pode <strong>acessar o sistema</strong> com este e-mail e a senha definidos no cadastro.</p>
<p>Dúvidas? <a href="mailto:${escapeHtml(fromAddr)}">${escapeHtml(fromAddr)}</a></p>
<p>— Equipe iGestorPhone</p>`;

  const enderecoLinha = [endereco, cidade, estado, cep].filter((x) => x != null && String(x).trim() !== '').join(' — ');

  const detailLines = [
    'Origem: conta criada pelo painel administrativo',
    userId != null ? `ID novo usuário: ${userId}` : null,
    `Nome: ${userName}`,
    `E-mail: ${userEmail}`,
    tipo ? `Perfil (tipo): ${tipo}` : null,
    `Conta: ${isActive === false ? 'inativa' : 'ativa'}`,
    telefone ? `Telefone: ${telefone}` : null,
    enderecoLinha ? `Local: ${enderecoLinha}` : null,
    cpf ? `CPF: ${cpf}` : null,
    rg ? `RG: ${rg}` : null,
    adminId != null
      ? `Criado por: ${adminName || '—'} <${adminEmail || '—'}> (admin id ${adminId})`
      : null,
    ip ? `IP: ${ip}` : null,
    userAgent ? `User-Agent: ${userAgent}` : null,
  ].filter(Boolean);

  const adminSubject = `[iGestorPhone] Usuário criado pelo admin: ${userName}`;
  const adminText = ['Um administrador criou um novo usuário no iGestorPhone.', '', ...detailLines, '', '---', 'Mensagem automática.'].join('\n');
  const adminHtml = `<p><strong>Novo usuário</strong> criado pelo painel.</p><ul>${detailLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('')}</ul>`;

  const welcomeMail = {
    from,
    to: userEmail,
    replyTo: fromAddr,
    subject: welcomeSubject,
    text: welcomeText,
    html: welcomeHtml,
  };

  const adminMail = {
    from,
    to: adminTo,
    replyTo: fromAddr,
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
  };

  const [welcomeResult, adminResult] = await Promise.allSettled([
    transport.sendMail(welcomeMail),
    transport.sendMail(adminMail),
  ]);

  if (welcomeResult.status === 'rejected') {
    console.error('[mail] Falha boas-vindas (admin criou usuário):', welcomeResult.reason?.message || welcomeResult.reason);
  }
  if (adminResult.status === 'rejected') {
    console.error('[mail] Falha aviso admin (criação pelo painel):', adminResult.reason?.message || adminResult.reason);
  }
}

/** Link único para redefinir senha (expira em 1h no fluxo que chama). */
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[mail] SMTP não configurado; e-mail de recuperação de senha não enviado.');
    return;
  }

  const fromAddr = (process.env.MAIL_FROM || DEFAULT_FROM).trim();
  const fromName = (process.env.MAIL_FROM_NAME || 'iGestorPhone').trim();
  const from = `"${fromName}" <${fromAddr}>`;

  const subject = 'Redefinir sua senha — iGestorPhone';
  const text = `Olá, ${name || 'usuário'}!

Recebemos um pedido para redefinir a senha da sua conta no iGestorPhone.

Abra o link abaixo (válido por tempo limitado). Se você não pediu, ignore este e-mail.

${resetUrl}

Dúvidas: ${fromAddr}

— Equipe iGestorPhone`;

  const html = `<p>Olá, <strong>${escapeHtml(name || 'usuário')}</strong>,</p>
<p>Recebemos um pedido para <strong>redefinir a senha</strong> da sua conta no iGestorPhone.</p>
<p><a href="${escapeHtml(resetUrl)}">Clique aqui para redefinir sua senha</a></p>
<p style="font-size:12px;color:#666">Se o link não abrir, copie e cole no navegador:<br/>${escapeHtml(resetUrl)}</p>
<p>Se você <strong>não</strong> pediu isso, pode ignorar este e-mail.</p>
<p>— Equipe iGestorPhone</p>`;

  await transport.sendMail({
    from,
    to,
    replyTo: fromAddr,
    subject,
    text,
    html,
  });
}
