const BASE = '/api'

export interface LineItem {
  id: string
  description: string
  category: string
  quantity: number
  unit_price: string
  subtotal: string
}

export interface RequestEvent {
  id: string
  event_type: string
  comment: string | null
  created_at: string
}

export type RequestStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER_APPROVAL'
  | 'PENDING_FINANCE_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELLED'

export interface DisbursementRequest {
  id: string
  title: string
  note: string | null
  status: RequestStatus
  total_amount: string
  created_at: string
  submitted_at: string | null
  line_items: LineItem[]
  events: RequestEvent[]
}

export const getRequests = (): Promise<DisbursementRequest[]> =>
  fetch(`${BASE}/requests`).then((r) => r.json())

export const getRequest = (id: string): Promise<DisbursementRequest> =>
  fetch(`${BASE}/requests/${id}`).then((r) => r.json())

export const createRequest = (body: { title: string; note?: string }) =>
  fetch(`${BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())

export const addLineItem = (id: string, body: object) =>
  fetch(`${BASE}/requests/${id}/line-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())

export const deleteLineItem = (id: string, lid: string) =>
  fetch(`${BASE}/requests/${id}/line-items/${lid}`, { method: 'DELETE' })

export const submitRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/submit`, { method: 'POST' }).then((r) => r.json())

export const cancelRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/cancel`, { method: 'POST' }).then((r) => r.json())

export const approveRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/approve`, { method: 'POST' }).then((r) => r.json())

export const rejectRequest = (id: string, comment: string) =>
  fetch(`${BASE}/requests/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  }).then((r) => r.json())

export const payRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/pay`, { method: 'POST' }).then((r) => r.json())
