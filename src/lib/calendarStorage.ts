/**
 * Tipo do evento de venda no calendário (usado no frontend).
 * Backend retorna snake_case; use mapApiEventToEvent() para converter.
 */

export interface CalendarSaleEvent {
  id: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm
  clientName?: string
  iphoneModel: string
  storage: string
  imeiEnd: string
  valorAVista: number
  valorComJuros: number
  formaPagamento: string
  notes?: string
  createdAt: string // ISO
}

/** Converte evento da API (snake_case) para o tipo do front (camelCase). */
export function mapApiEventToEvent(row: any): CalendarSaleEvent {
  return {
    id: String(row.id),
    date: row.date,
    time: row.time ?? undefined,
    clientName: row.client_name ?? undefined,
    iphoneModel: row.iphone_model ?? '',
    storage: row.storage ?? '',
    imeiEnd: row.imei_end ?? '',
    valorAVista: Number(row.valor_a_vista) || 0,
    valorComJuros: Number(row.valor_com_juros) || 0,
    formaPagamento: row.forma_pagamento ?? 'PIX',
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
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
