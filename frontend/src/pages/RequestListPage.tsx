import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getRequests, authHeaders } from '../api/requests'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../auth/AuthContext'

export default function RequestListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ['requests'],
    queryFn: getRequests,
  })

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const isRequester = user?.roles.includes('REQUESTER') ?? false
  const isFinance = user?.roles.includes('FINANCE') ?? false

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await fetch(
        `/api/requests/export/csv?from_date=${fromDate}&to_date=${toDate}`,
        { headers: authHeaders() },
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'requests.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">กำลังโหลดรายการ...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-red-600 font-medium">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการเบิกจ่าย</h1>
          <p className="text-sm text-gray-500 mt-1">
            {requests.length > 0 ? `${requests.length} รายการ` : 'ยังไม่มีรายการ'}
          </p>
        </div>
        {isRequester && (
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            สร้างคำขอใหม่
          </Link>
        )}
      </div>

      {/* Export CSV Card (Finance only) */}
      {isFinance && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Export ข้อมูล CSV</h2>
              <p className="text-xs text-gray-500">เลือกช่วงวันที่แล้วกด Export</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">ถึงวันที่</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={exporting || !fromDate || !toDate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {exporting ? (
                <>
                  <Spinner size="sm" className="border-white border-t-transparent" />
                  <span>กำลัง Export...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Table or Empty State */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <EmptyState
            title="ยังไม่มีคำขอเบิกจ่าย"
            description={isRequester ? 'เริ่มต้นด้วยการสร้างคำขอใหม่' : undefined}
            action={
              isRequester ? (
                <Link
                  to="/requests/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  สร้างคำขอใหม่
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  หัวข้อ
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ยอดรวม
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req, idx) => (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className={`cursor-pointer hover:bg-blue-50/50 transition-colors duration-150 group ${
                    idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-150">
                      {req.title}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-800 tabular-nums">
                      {Number(req.total_amount).toLocaleString('th-TH', {
                        style: 'currency',
                        currency: 'THB',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <svg
                      className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors duration-150 inline-block"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
