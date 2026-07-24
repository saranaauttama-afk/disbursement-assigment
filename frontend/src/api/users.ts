import { authHeaders } from './requests'

export interface UserItem { id: string; name: string; email: string; roles: string[] }

export const getUsers = (): Promise<UserItem[]> =>
  fetch('/api/users', { headers: authHeaders() }).then(r => r.json())

export const createUser = (body: { name: string; email: string; password: string; roles: string[]; manager_id?: string }) =>
  fetch('/api/users', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json())

export const updateUser = (id: string, body: { roles?: string[]; manager_id?: string }) =>
  fetch(`/api/users/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json())
