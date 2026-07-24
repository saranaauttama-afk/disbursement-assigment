import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markRead } from '../api/notifications'
import { useAuth } from '../auth/AuthContext'

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000,
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.roles.includes('ADMIN') ?? false

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-2.5 mr-6 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow duration-200">
                <svg
                  className="w-4.5 h-4.5 text-white"
                  style={{ width: '18px', height: '18px' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                  />
                </svg>
              </div>
              <span className="text-base font-bold gradient-text">ระบบเบิกจ่าย</span>
            </Link>

            {isAdmin && (
              <div className="flex items-center gap-1">
                <Link
                  to="/admin/users"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/admin/users')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                  }`}
                >
                  จัดการผู้ใช้
                </Link>
                <Link
                  to="/admin/config"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/admin/config')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                  }`}
                >
                  ตั้งค่า
                </Link>
              </div>
            )}
          </div>

          {/* Right: User info + Bell + Logout */}
          <div className="flex items-center gap-3">
            {/* User avatar + info */}
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  <div className="flex gap-1 mt-0.5">
                    {user.roles.map(role => (
                      <span
                        key={role}
                        className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-indigo-500/30 flex-shrink-0">
                  {getInitials(user.name)}
                </div>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-slate-500 hover:bg-gray-100 focus:outline-none transition-all duration-200"
                aria-label="การแจ้งเตือน"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-full animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200/60 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">การแจ้งเตือน</p>
                      {unreadCount > 0 && (
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                          {unreadCount} ใหม่
                        </span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                        <p className="text-sm text-gray-500">ไม่มีการแจ้งเตือน</p>
                      </div>
                    ) : (
                      <ul>
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                              n.is_read ? 'opacity-60' : 'bg-indigo-50/60'
                            }`}
                            onClick={() => {
                              if (!n.is_read) {
                                markReadMutation.mutate(n.id)
                              }
                            }}
                          >
                            {!n.is_read && (
                              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mb-1" />
                            )}
                            <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.created_at).toLocaleString('th-TH')}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600 transition-colors duration-200 px-3 py-2 rounded-xl hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
