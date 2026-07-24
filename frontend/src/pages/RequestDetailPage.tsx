import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRequest,
  addLineItem,
  deleteLineItem,
  submitRequest,
  cancelRequest,
  approveRequest,
  rejectRequest,
  payRequest,
  type RequestStatus,
} from '../api/requests'
import StatusBadge from '../components/StatusBadge'

const CATEGORIES = ['TRAVEL', 'EQUIPMENT', 'ENTERTAINMENT', 'MISC'] as const

const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: 'เดินทาง',
  EQUIPMENT: 'อุปกรณ์',
  ENTERTAINMENT: 'บันเทิง',
  MISC: 'อื่นๆ',
}

interface LineItemForm {
  description: string
  category: string
  quantity: string
  unit_price: string
}

const emptyForm: LineItemForm = {
  description: '',
  category: 'TRAVEL',
  quantity: '1',
  unit_price: '',
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<LineItemForm>(emptyForm)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState('')

  const { data: request, isLoading, isError } = useQuery({
    queryKey: ['requests', id],
    queryFn: () => getRequest(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['requests', id] })
    queryClient.invalidateQueries({ queryKey: ['requests'] })
  }

  const addLineItemMutation = useMutation({
    mutationFn: (body: object) => addLineItem(id!, body),
    onSuccess: () => {
      invalidate()
      setForm(emptyForm)
    },
  })

  const deleteLineItemMutation = useMutation({
    mutationFn: (lid: string) => deleteLineItem(id!, lid),
    onSuccess: invalidate,
  })

  const submitMutation = useMutation({
    mutationFn: () => submitRequest(id!),
    onSuccess: invalidate,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelRequest(id!),
    onSuccess: invalidate,
  })

  const approveMutation = useMutation({
    mutationFn: () => approveRequest(id!),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: (comment: string) => rejectRequest(id!, comment),
    onSuccess: () => {
      invalidate()
      setShowRejectModal(false)
      setRejectComment('')
    },
  })

  const payMutation = useMutation({
    mutationFn: () => payRequest(id!),
    onSuccess: invalidate,
  })

  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault()
    addLineItemMutation.mutate({
      description: form.description.trim(),
      category: form.category,
      quantity: Number(form.quantity),
      unit_price: form.unit_price,
    })
  }

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectComment.trim()) return
    rejectMutation.mutate(rejectComment.trim())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  if (isError || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">ไม่พบข้อมูลคำขอ</p>
      </div>
    )
  }

  const isDraft = request.status === 'DRAFT'
  const isPending =
    request.status === 'PENDING_MANAGER_APPROVAL' ||
    request.status === 'PENDING_FINANCE_APPROVAL'
  const isApproved = request.status === 'APPROVED'

  const anyPending =
    submitMutation.isPending ||
    cancelMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    payMutation.isPending

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 hover:underline mb-2 block"
          >
            ← กลับรายการ
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          {request.note && <p className="text-sm text-gray-600">{request.note}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={request.status as RequestStatus} />
          <span className="text-xl font-bold text-gray-900">
            {Number(request.total_amount).toLocaleString('th-TH', {
              style: 'currency',
              currency: 'THB',
            })}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={anyPending || request.line_items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ส่งคำขอ
            </button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={anyPending}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
            >
              ยกเลิก
            </button>
          </>
        )}

        {isPending && (
          <>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={anyPending}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              อนุมัติ
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={anyPending}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              ปฏิเสธ
            </button>
          </>
        )}

        {isApproved && (
          <button
            onClick={() => payMutation.mutate()}
            disabled={anyPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            บันทึกจ่าย
          </button>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">รายการค่าใช้จ่าย</h2>
        </div>

        {request.line_items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            ยังไม่มีรายการ กรุณาเพิ่มรายการค่าใช้จ่าย
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  รายละเอียด
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ประเภท
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  จำนวน
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  ราคา/หน่วย
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  รวม
                </th>
                {isDraft && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {request.line_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">
                    {Number(item.unit_price).toLocaleString('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono font-medium">
                    {Number(item.subtotal).toLocaleString('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    })}
                  </td>
                  {isDraft && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteLineItemMutation.mutate(item.id)}
                        disabled={deleteLineItemMutation.isPending}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add Line Item Form (DRAFT only) */}
        {isDraft && (
          <form
            onSubmit={handleAddLineItem}
            className="px-4 py-4 border-t border-gray-200 bg-gray-50 space-y-3"
          >
            <p className="text-xs font-medium text-gray-600 uppercase">เพิ่มรายการ</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="รายละเอียด *"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="จำนวน *"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="ราคาต่อหน่วย (บาท) *"
                min="0"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
                required
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={addLineItemMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {addLineItemMutation.isPending ? 'กำลังเพิ่ม...' : '+ เพิ่มรายการ'}
            </button>
            {addLineItemMutation.isError && (
              <p className="text-xs text-red-600">เกิดข้อผิดพลาดในการเพิ่มรายการ</p>
            )}
          </form>
        )}
      </div>

      {/* Event Log */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">ประวัติการดำเนินการ</h2>
        </div>
        {request.events.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">ยังไม่มีประวัติ</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  เหตุการณ์
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ความคิดเห็น
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วันที่/เวลา
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {request.events.map((evt) => (
                <tr key={evt.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {evt.event_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {evt.comment ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(evt.created_at).toLocaleString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ระบุเหตุผลการปฏิเสธ</h3>
            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                autoFocus
                rows={4}
                placeholder="เหตุผล (จำเป็น)"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {rejectMutation.isError && (
                <p className="text-xs text-red-600">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={rejectMutation.isPending || !rejectComment.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {rejectMutation.isPending ? 'กำลังส่ง...' : 'ยืนยันการปฏิเสธ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectComment('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
