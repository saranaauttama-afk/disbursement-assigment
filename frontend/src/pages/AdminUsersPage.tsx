import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser } from '../api/users'

const ALL_ROLES = ['REQUESTER', 'MANAGER', 'FINANCE', 'ADMIN'] as const

const ROLE_LABELS: Record<string, string> = {
  REQUESTER: 'ผู้เบิกจ่าย',
  MANAGER: 'หัวหน้า',
  FINANCE: 'การเงิน',
  ADMIN: 'ผู้ดูแลระบบ',
}

interface NewUserForm {
  name: string
  email: string
  password: string
  roles: string[]
  manager_id: string
}

const emptyForm: NewUserForm = {
  name: '',
  email: '',
  password: '',
  roles: [],
  manager_id: '',
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewUserForm>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setForm(emptyForm)
      setFormError('')
    },
    onError: () => {
      setFormError('เกิดข้อผิดพลาดในการสร้างผู้ใช้ กรุณาลองใหม่')
    },
  })

  const toggleRole = (role: string) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter(r => r !== role)
        : [...f.roles, role],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (form.roles.length === 0) {
      setFormError('กรุณาเลือกบทบาทอย่างน้อยหนึ่งบทบาท')
      return
    }
    createMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      roles: form.roles,
      ...(form.manager_id.trim() ? { manager_id: form.manager_id.trim() } : {}),
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <button
          onClick={() => { setShowForm(prev => !prev); setFormError('') }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'ยกเลิก' : '+ เพิ่มผู้ใช้'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-800">เพิ่มผู้ใช้ใหม่</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager ID (ถ้ามี)
              </label>
              <input
                type="text"
                value={form.manager_id}
                onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}
                placeholder="UUID ของหัวหน้า"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              บทบาท <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-4">
              {ALL_ROLES.map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{ROLE_LABELS[role]}</span>
                </label>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center h-40">
          <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    ไม่มีข้อมูลผู้ใช้
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(role => (
                          <span
                            key={role}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {ROLE_LABELS[role] ?? role}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
