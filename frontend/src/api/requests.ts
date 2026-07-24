const BASE = '/api'

export function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse(res: Response): Promise<Response> {
  if (res.status === 401) {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  return res
}

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
  requester_id: string
  line_items: LineItem[]
  events: RequestEvent[]
}

export const getRequests = (): Promise<DisbursementRequest[]> =>
  fetch(`${BASE}/requests`, { headers: authHeaders() })
    .then(handleResponse)
    .then((r) => r.json())

export const getRequest = (id: string): Promise<DisbursementRequest> =>
  fetch(`${BASE}/requests/${id}`, { headers: authHeaders() })
    .then(handleResponse)
    .then((r) => r.json())

export const createRequest = (body: { title: string; note?: string }) =>
  fetch(`${BASE}/requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
    .then(handleResponse)
    .then((r) => r.json())

export const addLineItem = (id: string, body: object) =>
  fetch(`${BASE}/requests/${id}/line-items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
    .then(handleResponse)
    .then((r) => r.json())

export const deleteLineItem = (id: string, lid: string) =>
  fetch(`${BASE}/requests/${id}/line-items/${lid}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse)

export const submitRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/submit`, { method: 'POST', headers: authHeaders() })
    .then(handleResponse)
    .then((r) => r.json())

export const cancelRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/cancel`, { method: 'POST', headers: authHeaders() })
    .then(handleResponse)
    .then((r) => r.json())

export const approveRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/approve`, { method: 'POST', headers: authHeaders() })
    .then(handleResponse)
    .then((r) => r.json())

export const rejectRequest = (id: string, comment: string) =>
  fetch(`${BASE}/requests/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ comment }),
  })
    .then(handleResponse)
    .then((r) => r.json())

export const payRequest = (id: string) =>
  fetch(`${BASE}/requests/${id}/pay`, { method: 'POST', headers: authHeaders() })
    .then(handleResponse)
    .then((r) => r.json())
