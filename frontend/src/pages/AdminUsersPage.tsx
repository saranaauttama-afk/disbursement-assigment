import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser } from '../api/users'
import Spinner from '../components/Spinner'

const ALL_ROLES = ['REQUESTER', 'MANAGER', 'FINANCE', 'ADMIN'] as const

const ROLE_LABELS: Record<string, string> = {
  REQUESTER: 'ผู้เบิกจ่าย',
  MANAGER: 'หัวหน้า',
  FINANCE: 'การเงิน',
  ADMIN: 'ผู้ดูแลระบบ',
}

const ROLE_BADGE_CLASSES: Record<string, string> = {
  REQUESTER: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  MANAGER: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  FINANCE: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  ADMIN: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
]

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-sm text-gray-500 mt-1">
            {!isLoading && !isError ? `${users.length} บัญชีผู้ใช้` : 'กำลังโหลด...'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(prev => !prev); setFormError('') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              ยกเลิก
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              เพิ่มผู้ใช้
            </>
          )}
        </button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">เพิ่มผู้ใช้ใหม่</h2>
            <p className="text-xs text-gray-500 mt-0.5">กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีผู้ใช้ใหม่</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Manager ID
                  <span className="text-gray-400 font-normal ml-1">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={form.manager_id}
                  onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}
                  placeholder="UUID ของหัวหน้า"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                บทบาท <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ALL_ROLES.map(role => (
                  <label
                    key={role}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      form.roles.includes(role)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className={`text-sm font-medium ${form.roles.includes(role) ? 'text-blue-700' : 'text-gray-700'}`}>
                      {ROLE_LABELS[role]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
              >
                {createMutation.isPending ? (
                  <Spinner size="sm" className="border-white border-t-transparent" />
                ) : null}
                {createMutation.isPending ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">กำลังโหลดรายชื่อผู้ใช้...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ผู้ใช้
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">ไม่มีข้อมูลผู้ใช้</p>
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm`}
                        >
                          {getInitials(u.name)}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map(role => (
                          <span
                            key={role}
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE_CLASSES[role] ?? 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}
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
