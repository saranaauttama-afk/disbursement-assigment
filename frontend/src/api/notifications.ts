const BASE = '/api'

export interface Notification {
  id: string
  message: string
  is_read: boolean
  created_at: string
  request_id: string
}

export const getNotifications = (): Promise<Notification[]> =>
  fetch(`${BASE}/notifications`).then((r) => r.json())

export const markRead = (id: string) =>
  fetch(`${BASE}/notifications/${id}/read`, { method: 'PATCH' }).then((r) => r.json())
