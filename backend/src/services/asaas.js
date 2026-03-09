/**
 * Serviço de integração com a API Asaas
 * Documentação: https://docs.asaas.com
 */

const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'sandbox'
  ? 'https://sandbox.asaas.com/v3'
  : 'https://api.asaas.com/v3';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

const PLANS = {
  mensal: {
    name: 'Mensal',
    planName: 'iGestorPhone Mensal',
    value: 150,
    cycle: 'MONTHLY',
    durationMonths: 1,
  },
  trimestral: {
    name: 'Trimestral',
    planName: 'iGestorPhone Trimestral',
    value: 390,
    cycle: 'QUARTERLY',
    durationMonths: 3,
  },
  anual: {
    name: 'Anual',
    planName: 'iGestorPhone Anual',
    value: 1200,
    cycle: 'YEARLY',
    durationMonths: 12,
  },
};

function getHeaders() {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada. Adicione no arquivo .env');
  }
  return {
    'Content-Type': 'application/json',
    access_token: ASAAS_API_KEY,
  };
}

/**
 * Cria ou obtém o cliente no Asaas
 * @param {Object} user - { id, name, email, cpf_cnpj, phone }
 * @param {string|null} asaasCustomerId - ID existente no Asaas (se houver)
 */
export async function getOrCreateCustomer(user, asaasCustomerId = null) {
  if (asaasCustomerId) {
    const res = await fetch(`${ASAAS_BASE_URL}/customers/${asaasCustomerId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (res.ok) return { id: asaasCustomerId };
    // Se não existir, cria novo
  }

  const cpfClean = (user.cpf_cnpj || '').replace(/\D/g, '');
  const phoneClean = (user.phone || user.mobilePhone || '').replace(/\D/g, '');

  if (!cpfClean || cpfClean.length < 11) {
    throw new Error('CPF/CNPJ é obrigatório para criar assinatura');
  }

  const body = {
    name: user.name,
    cpfCnpj: cpfClean,
    email: user.email,
    externalReference: String(user.id),
  };
  if (phoneClean) body.mobilePhone = phoneClean;

  const res = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.errors?.[0]?.description || data?.errors || JSON.stringify(data);
    throw new Error(`Asaas: ${errMsg}`);
  }

  return { id: data.id };
}

/**
 * Cria assinatura no Asaas (PIX ou cartão)
 * @param {Object} params
 * @param {string} params.customerId - ID do cliente no Asaas
 * @param {string} params.planKey - mensal | trimestral | anual
 * @param {string} params.billingType - PIX | CREDIT_CARD
 * @param {Object} [params.creditCard] - Dados do cartão (obrigatório se billingType === CREDIT_CARD)
 * @param {Object} [params.creditCardHolderInfo] - Dados do titular
 */
export async function createSubscription({ customerId, planKey, billingType, creditCard, creditCardHolderInfo }) {
  const plan = PLANS[planKey];
  if (!plan) throw new Error(`Plano inválido: ${planKey}`);

  const nextDue = new Date();
  // Primeira cobrança para hoje (disponível imediatamente; PIX pode pagar na hora)
  nextDue.setHours(23, 59, 59, 999);

  const body = {
    customer: customerId,
    billingType,
    nextDueDate: nextDue.toISOString().split('T')[0],
    value: plan.value,
    cycle: plan.cycle,
    description: plan.planName,
  };

  if (billingType === 'CREDIT_CARD') {
    if (!creditCard || !creditCardHolderInfo) {
      throw new Error('Dados do cartão são obrigatórios');
    }
    body.creditCard = creditCard;
    body.creditCardHolderInfo = creditCardHolderInfo;
  }

  const res = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.errors?.[0]?.description || data?.errors || JSON.stringify(data);
    throw new Error(`Asaas: ${errMsg}`);
  }

  return data;
}

/**
 * Obtém cobrança PIX (QR Code) de uma assinatura
 * A primeira cobrança é criada automaticamente pela assinatura
 */
export async function getSubscriptionFirstPayment(subscriptionId) {
  const fetchPayments = async () => {
    const payRes = await fetch(
      `${ASAAS_BASE_URL}/payments?subscription=${subscriptionId}&status=PENDING`,
      { headers: getHeaders() }
    );
    const payData = await payRes.json();
    return payData.data || [];
  };

  let payments = await fetchPayments();
  if (payments.length === 0) {
    await new Promise(r => setTimeout(r, 2000));
    payments = await fetchPayments();
  }
  if (payments.length === 0) {
    throw new Error('Aguardando cobrança PIX. Tente novamente em alguns segundos.');
  }
  return payments[0];
}

/**
 * Obtém QR Code PIX de uma cobrança
 */
export async function getPixQrCode(paymentId) {
  const res = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Falha ao obter QR Code PIX');
  return res.json();
}

export { PLANS };
