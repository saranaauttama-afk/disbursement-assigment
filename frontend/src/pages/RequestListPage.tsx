import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getRequests } from '../api/requests'
import StatusBadge from '../components/StatusBadge'

export default function RequestListPage() {
  const navigate = useNavigate()
  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ['requests'],
    queryFn: getRequests,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">รายการเบิกจ่าย</h1>
        <Link
          to="/requests/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + สร้างคำขอใหม่
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">ยังไม่มีคำขอเบิกจ่าย</p>
          <p className="text-sm mt-1">คลิก "สร้างคำขอใหม่" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หัวข้อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ยอดรวม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {req.title}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right font-mono">
                    {Number(req.total_amount).toLocaleString('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString('th-TH')}
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
