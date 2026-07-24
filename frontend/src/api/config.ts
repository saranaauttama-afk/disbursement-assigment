import { authHeaders } from './requests'

export interface ConfigItem { key: string; value: string }

export const getConfig = (): Promise<ConfigItem[]> =>
  fetch('/api/config', { headers: authHeaders() }).then(r => r.json())

export const updateConfig = (key: string, value: string) =>
  fetch(`/api/config/${key}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ value }) }).then(r => r.json())
