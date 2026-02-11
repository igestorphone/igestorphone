/**
 * Tipos do calendário (evento + itens). Backend retorna snake_case; use mapApiEventToEvent() para converter.
 */

export type CalendarEventStatus = 'agendado' | 'comprou' | 'nao_comprou' | 'reagendado'

export interface TradeInDevice {
  model: string
  storage: string
  condicao?: 'novo' | 'seminovo' | null
  obs?: string | null
}

export interface CalendarEventItem {
  id: number | null
  event_id?: number
  iphoneModel: string
  storage: string
  color?: string | null
  imeiEnd: string
  valorAVista: number
  valorComJuros: number
  formaPagamento: string
  valorTroca?: number | null
  manutencaoDescontada?: number | null
  tradeInModel?: string | null
  tradeInStorage?: string | null
  tradeInDevices?: TradeInDevice[]
  parcelas?: number | null
  valorSinal?: number | null
  condicao?: 'novo' | 'seminovo' | null
  origemProduto?: 'estoque' | 'fornecedor' | null
  notes?: string | null
}

export interface CalendarSaleEvent {
  id: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm
  clientName?: string
  status: CalendarEventStatus
  notes?: string
  items: CalendarEventItem[]
  createdAt: string // ISO
  updatedAt?: string
  // Legado (primeiro item): para compat e exibição resumida
  iphoneModel: string
  storage: string
  imeiEnd: string
  valorAVista: number
  valorComJuros: number
  formaPagamento: string
}

function mapItem(row: any): CalendarEventItem {
  const trocaArr = row.troca_aparelhos ?? row.tradeInDevices
  const tradeInDevices: TradeInDevice[] = Array.isArray(trocaArr)
    ? trocaArr.map((t: any) => ({
        model: t.model ?? t.modelo ?? '',
        storage: t.storage ?? t.armazenamento ?? '',
        condicao: (t.condicao === 'novo' || t.condicao === 'seminovo') ? t.condicao : undefined,
        obs: t.obs ?? undefined,
      }))
    : row.modelo_troca || row.armazenamento_troca
      ? [{ model: row.modelo_troca ?? '', storage: row.armazenamento_troca ?? '' }]
      : []
  return {
    id: row.id != null ? Number(row.id) : null,
    event_id: row.event_id != null ? Number(row.event_id) : undefined,
    iphoneModel: row.iphone_model ?? row.iphoneModel ?? '',
    storage: row.storage ?? '',
    color: row.color ?? row.color ?? null,
    imeiEnd: row.imei_end ?? row.imeiEnd ?? '',
    valorAVista: Number(row.valor_a_vista ?? row.valorAVista) || 0,
    valorComJuros: Number(row.valor_com_juros ?? row.valorComJuros) || 0,
    formaPagamento: row.forma_pagamento ?? row.formaPagamento ?? 'PIX',
    valorTroca: row.valor_troca != null ? Number(row.valor_troca) : row.valorTroca ?? null,
    manutencaoDescontada: row.manutencao_descontada != null ? Number(row.manutencao_descontada) : row.manutencaoDescontada ?? null,
    tradeInModel: row.modelo_troca ?? row.tradeInModel ?? (tradeInDevices[0]?.model || null),
    tradeInStorage: row.armazenamento_troca ?? row.tradeInStorage ?? (tradeInDevices[0]?.storage || null),
    tradeInDevices,
    parcelas: row.parcelas != null ? Number(row.parcelas) : row.parcelas ?? null,
    valorSinal: row.valor_sinal != null ? Number(row.valor_sinal) : row.valorSinal ?? null,
    condicao: (row.condicao === 'novo' || row.condicao === 'seminovo') ? row.condicao : undefined,
    origemProduto: (row.origem_produto === 'estoque' || row.origem_produto === 'fornecedor') ? row.origem_produto : undefined,
    notes: row.notes ?? undefined,
  }
}

/** Converte evento da API (com items[]) para o tipo do front. */
export function mapApiEventToEvent(row: any): CalendarSaleEvent {
  const items: CalendarEventItem[] = Array.isArray(row.items)
    ? row.items.map((i: any) => mapItem(i))
    : [mapItem({
        iphone_model: row.iphone_model,
        storage: row.storage,
        color: row.color,
        imei_end: row.imei_end,
        valor_a_vista: row.valor_a_vista,
        valor_com_juros: row.valor_com_juros,
        forma_pagamento: row.forma_pagamento,
        valor_troca: row.valor_troca,
        manutencao_descontada: row.manutencao_descontada,
        modelo_troca: row.modelo_troca,
        armazenamento_troca: row.armazenamento_troca,
        troca_aparelhos: row.troca_aparelhos,
        parcelas: row.parcelas,
        valor_sinal: row.valor_sinal,
        condicao: row.condicao,
        origem_produto: row.origem_produto,
        notes: row.notes,
      })]

  const first = items[0]
  const dateStr = row.date == null ? '' : (typeof row.date === 'string' ? row.date : (row.date as Date).toISOString?.().slice(0, 10) ?? '')
  return {
    id: String(row.id),
    date: dateStr.slice(0, 10) || '',
    time: row.time ?? undefined,
    clientName: row.client_name ?? undefined,
    status: (row.status && ['agendado', 'comprou', 'nao_comprou', 'reagendado'].includes(row.status))
      ? row.status
      : 'agendado',
    notes: row.notes ?? undefined,
    items,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at,
    iphoneModel: first?.iphoneModel ?? row.iphone_model ?? '',
    storage: first?.storage ?? row.storage ?? '',
    imeiEnd: first?.imeiEnd ?? row.imei_end ?? '',
      valorAVista: first?.valorAVista ?? (Number(row.valor_a_vista) || 0),
      valorComJuros: first?.valorComJuros ?? (Number(row.valor_com_juros) || 0),
    formaPagamento: first?.formaPagamento ?? row.forma_pagamento ?? 'PIX',
  }
}

const STORAGE_PREFIX = 'calendar_events_'

export function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

export function getEvents(userId: string): CalendarSaleEvent[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveEvents(userId: string, events: CalendarSaleEvent[]): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(events))
  } catch {
    // ignore (private mode / full)
  }
}

export function addEvent(userId: string, event: Omit<CalendarSaleEvent, 'id' | 'createdAt'>): CalendarSaleEvent {
  const events = getEvents(userId)
  const newEvent: CalendarSaleEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  events.push(newEvent)
  saveEvents(userId, events)
  return newEvent
}

export function updateEvent(userId: string, id: string, patch: Partial<CalendarSaleEvent>): CalendarSaleEvent | null {
  const events = getEvents(userId)
  const i = events.findIndex((e) => e.id === id)
  if (i === -1) return null
  events[i] = { ...events[i], ...patch }
  saveEvents(userId, events)
  return events[i]
}

export function deleteEvent(userId: string, id: string): boolean {
  const events = getEvents(userId).filter((e) => e.id !== id)
  if (events.length === getEvents(userId).length) return false
  saveEvents(userId, events)
  return true
}

export function getEventsForDate(userId: string, date: string): CalendarSaleEvent[] {
  return getEvents(userId)
    .filter((e) => e.date === date)
    .sort((a, b) => {
      const tA = a.time || '00:00'
      const tB = b.time || '00:00'
      return tA.localeCompare(tB)
    })
}

export function getEventsForMonth(userId: string, year: number, month: number): CalendarSaleEvent[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return getEvents(userId).filter((e) => e.date.startsWith(prefix))
}

/** Gera texto de resumo do pedido para copiar e enviar no grupo "novo pedido" (WhatsApp). */
export function buildResumoPedido(event: CalendarSaleEvent): string {
  const lines: string[] = []
  lines.push(`📅 ${event.date}${event.time ? ` ${event.time}` : ''}`)
  if (event.clientName) lines.push(`Cliente: ${event.clientName}`)
  lines.push('')
  for (let i = 0; i < event.items.length; i++) {
    const it = event.items[i]
    const origemLabel = it.origemProduto === 'estoque' ? 'Estoque' : it.origemProduto === 'fornecedor' ? 'Comprar no fornecedor' : null
    lines.push(`iPhone ${it.iphoneModel} ${it.storage}${it.color ? ` - ${it.color}` : ''}${it.condicao ? ` (${it.condicao})` : ''}${origemLabel ? ` [${origemLabel}]` : ''}`)
    lines.push(`IMEI ...${it.imeiEnd}`)
    lines.push(`À vista: R$ ${it.valorAVista.toFixed(2).replace('.', ',')} | Parcelado: R$ ${it.valorComJuros.toFixed(2).replace('.', ',')}`)
    const trocaList = it.tradeInDevices?.length ? it.tradeInDevices : (it.tradeInModel || it.tradeInStorage ? [{ model: it.tradeInModel ?? '', storage: it.tradeInStorage ?? '' }] : [])
    if (trocaList.length) {
      trocaList.forEach((d) => {
        if (d.model || d.storage) {
          lines.push(`iPhone na troca: ${[d.model, d.storage].filter(Boolean).join(' ')}${d.condicao ? ` (${d.condicao})` : ''}`)
          if (d.obs?.trim()) lines.push(`  Obs. troca: ${d.obs.trim()}`)
        }
      })
    }
    if (it.parcelas != null) lines.push(`Parcelas: ${it.parcelas}x`)
    if (it.valorSinal != null) lines.push(`Sinal: R$ ${it.valorSinal.toFixed(2).replace('.', ',')}`)
    if (it.valorTroca != null || it.manutencaoDescontada != null) {
      const parts = []
      if (it.valorTroca != null) parts.push(`Troca: R$ ${it.valorTroca.toFixed(2).replace('.', ',')}`)
      if (it.manutencaoDescontada != null) parts.push(`Manutenção descont.: R$ ${it.manutencaoDescontada.toFixed(2).replace('.', ',')}`)
      lines.push(parts.join(' | '))
    }
    lines.push(`Pagamento: ${it.formaPagamento}`)
    if (it.notes) lines.push(`Obs: ${it.notes}`)
    if (i < event.items.length - 1) lines.push('---')
  }
  if (event.notes) lines.push('', `Obs. geral: ${event.notes}`)
  return lines.join('\n')
}
