import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConfig, updateConfig, type ConfigItem } from '../api/config'
import Spinner from '../components/Spinner'

const CONFIG_LABELS: Record<string, { label: string; description: string; unit?: string }> = {
  finance_approval_threshold_thb: {
    label: 'ขีดจำกัดการอนุมัติการเงิน',
    description: 'ยอดคำขอที่ต้องผ่านการอนุมัติจากฝ่ายการเงิน',
    unit: 'บาท',
  },
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

  const configMeta = CONFIG_LABELS[item.key]
  const label = configMeta?.label ?? item.key
  const description = configMeta?.description
  const unit = configMeta?.unit

  const isDirty = value !== item.value

  return (
    <div className="px-6 py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
          <p className="text-xs font-mono text-gray-400 mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded">
            {item.key}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setSaved(false) }}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-40 text-right tabular-nums"
            />
            {unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                {unit}
              </span>
            )}
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isDirty}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              saved
                ? 'bg-green-50 text-green-700 border border-green-200'
                : isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md disabled:opacity-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {mutation.isPending ? (
              <>
                <Spinner size="sm" className={mutation.isPending ? 'border-white border-t-transparent' : ''} />
                <span>กำลังบันทึก...</span>
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                บันทึกแล้ว
              </>
            ) : (
              'บันทึก'
            )}
          </button>
        </div>
      </div>
      {mutation.isError && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          เกิดข้อผิดพลาด กรุณาลองใหม่
        </div>
      )}
    </div>
  )
}

export default function AdminConfigPage() {
  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-sm text-gray-500 mt-1">จัดการค่าพารามิเตอร์ต่างๆ ของระบบเบิกจ่าย</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">กำลังโหลดการตั้งค่า...</p>
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

      {/* Config List */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">พารามิเตอร์ระบบ</h2>
            <p className="text-xs text-gray-500 mt-0.5">การเปลี่ยนแปลงจะมีผลทันที</p>
          </div>

          {configs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">ไม่มีการตั้งค่า</p>
            </div>
          ) : (
            <div>
              {configs.map(item => (
                <ConfigRow key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
