import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfig, updateConfig, type ConfigItem } from '../api/config'

const CONFIG_LABELS: Record<string, string> = {
  finance_approval_threshold_thb: 'ขีดจำกัดการอนุมัติ (THB)',
}

function ConfigRow({ item }: { item: ConfigItem }) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(item.value)
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () => updateConfig(item.key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const label = CONFIG_LABELS[item.key] ?? item.key

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-6 py-4 text-sm font-medium text-gray-700 w-64">{label}</td>
      <td className="px-6 py-4">
        <input
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึก'}
        </button>
        {mutation.isError && (
          <p className="text-xs text-red-600 mt-1">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
        )}
      </td>
    </tr>
  )
}

export default function AdminConfigPage() {
  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ตั้งค่าระบบ</h1>

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
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การตั้งค่า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ค่า
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    ไม่มีการตั้งค่า
                  </td>
                </tr>
              ) : (
                configs.map(item => (
                  <ConfigRow key={item.key} item={item} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
