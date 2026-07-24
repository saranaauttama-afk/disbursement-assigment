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
import Spinner from '../components/Spinner'
import { useAuth } from '../auth/AuthContext'

const CATEGORIES = ['TRAVEL', 'EQUIPMENT', 'ENTERTAINMENT', 'MISC'] as const

const CATEGORY_LABELS: Record<string, string> = {
  TRAVEL: 'เดินทาง',
  EQUIPMENT: 'อุปกรณ์',
  ENTERTAINMENT: 'บันเทิง',
  MISC: 'อื่นๆ',
}

const EVENT_TYPE_LABELS: Record<string, { label: string; colorClass: string; dotClass: string }> = {
  CREATED: { label: 'สร้างคำขอ', colorClass: 'text-gray-700', dotClass: 'bg-gray-400' },
  SUBMITTED: { label: 'ส่งคำขอ', colorClass: 'text-blue-700', dotClass: 'bg-blue-500' },
  APPROVED: { label: 'อนุมัติ', colorClass: 'text-green-700', dotClass: 'bg-green-500' },
  REJECTED: { label: 'ปฏิเสธ', colorClass: 'text-red-700', dotClass: 'bg-red-500' },
  PAID: { label: 'บันทึกจ่าย', colorClass: 'text-blue-700', dotClass: 'bg-blue-600' },
  CANCELLED: { label: 'ยกเลิก', colorClass: 'text-slate-700', dotClass: 'bg-slate-400' },
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
  const { user } = useAuth()
  const [form, setForm] = useState<LineItemForm>(emptyForm)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

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
      setShowAddForm(false)
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
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  if (isError || !request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm text-red-600 font-medium">ไม่พบข้อมูลคำขอ</p>
      </div>
    )
  }

  const isDraft = request.status === 'DRAFT'
  const isPendingManager = request.status === 'PENDING_MANAGER_APPROVAL'
  const isPendingFinance = request.status === 'PENDING_FINANCE_APPROVAL'
  const isApproved = request.status === 'APPROVED'

  const isRequester = user?.roles.includes('REQUESTER') ?? false
  const isManager = user?.roles.includes('MANAGER') ?? false
  const isFinance = user?.roles.includes('FINANCE') ?? false
  const isOwnRequest = user?.id === request.requester_id

  const canSubmitCancel = isDraft && isRequester && isOwnRequest
  const canManagerApproveReject = isPendingManager && isManager
  const canFinanceApproveReject = isPendingFinance && isFinance
  const canPay = isApproved && isFinance

  const showApproveReject = canManagerApproveReject || canFinanceApproveReject

  const anyPending =
    submitMutation.isPending ||
    cancelMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    payMutation.isPending

  const hasActions = canSubmitCancel || showApproveReject || canPay

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => navigate('/')}
          className="hover:text-blue-600 transition-colors duration-200"
        >
          รายการเบิกจ่าย
        </button>
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-gray-800 font-medium truncate max-w-xs">{request.title}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <StatusBadge status={request.status as RequestStatus} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">{request.title}</h1>
            {request.note && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{request.note}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              สร้างเมื่อ{' '}
              {new Date(request.created_at).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ยอดรวมทั้งหมด</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              {Number(request.total_amount).toLocaleString('th-TH', {
                style: 'currency',
                currency: 'THB',
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {hasActions && (
          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-gray-100">
            {canSubmitCancel && (
              <>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={anyPending || request.line_items.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {submitMutation.isPending ? (
                    <Spinner size="sm" className="border-white border-t-transparent" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                  ส่งคำขอ
                </button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={anyPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
                >
                  {cancelMutation.isPending && <Spinner size="sm" />}
                  ยกเลิกคำขอ
                </button>
              </>
            )}

            {showApproveReject && (
              <>
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={anyPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {approveMutation.isPending ? (
                    <Spinner size="sm" className="border-white border-t-transparent" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  อนุมัติ
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={anyPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 text-sm font-semibold rounded-xl border border-red-300 hover:bg-red-50 disabled:opacity-50 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  ปฏิเสธ
                </button>
              </>
            )}

            {canPay && (
              <button
                onClick={() => payMutation.mutate()}
                disabled={anyPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {payMutation.isPending ? (
                  <Spinner size="sm" className="border-white border-t-transparent" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                )}
                บันทึกการจ่าย
              </button>
            )}
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">รายการค่าใช้จ่าย</h2>
            <p className="text-xs text-gray-500 mt-0.5">{request.line_items.length} รายการ</p>
          </div>
          {isDraft && (
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              {showAddForm ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  ซ่อนฟอร์ม
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  เพิ่มรายการ
                </>
              )}
            </button>
          )}
        </div>

        {request.line_items.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">ยังไม่มีรายการค่าใช้จ่าย</p>
            {isDraft && <p className="text-xs text-gray-400 mt-1">คลิก "เพิ่มรายการ" เพื่อเพิ่มรายการแรก</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    จำนวน
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ราคา/หน่วย
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    รวม
                  </th>
                  {isDraft && <th className="px-6 py-3 w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {request.line_items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right tabular-nums">
                      {Number(item.unit_price).toLocaleString('th-TH', {
                        style: 'currency',
                        currency: 'THB',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right tabular-nums">
                      {Number(item.subtotal).toLocaleString('th-TH', {
                        style: 'currency',
                        currency: 'THB',
                      })}
                    </td>
                    {isDraft && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteLineItemMutation.mutate(item.id)}
                          disabled={deleteLineItemMutation.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          aria-label="ลบรายการ"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {/* Subtotal row */}
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={isDraft ? 4 : 4} className="px-6 py-3 text-sm font-semibold text-gray-700 text-right">
                    ยอดรวมทั้งหมด
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">
                    {Number(request.total_amount).toLocaleString('th-TH', {
                      style: 'currency',
                      currency: 'THB',
                    })}
                  </td>
                  {isDraft && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Add Line Item Form (DRAFT only, expandable) */}
        {isDraft && showAddForm && (
          <div className="border-t border-gray-200 bg-blue-50/30 px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">เพิ่มรายการใหม่</h3>
            <form onSubmit={handleAddLineItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">รายละเอียด *</label>
                  <input
                    type="text"
                    placeholder="เช่น ค่าตั๋วเครื่องบิน กรุงเทพ-เชียงใหม่"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">ประเภท</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">จำนวน *</label>
                  <input
                    type="number"
                    placeholder="1"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">ราคาต่อหน่วย (บาท) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  />
                </div>
              </div>

              {addLineItemMutation.isError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs text-red-600">เกิดข้อผิดพลาดในการเพิ่มรายการ</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addLineItemMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                >
                  {addLineItemMutation.isPending ? (
                    <Spinner size="sm" className="border-white border-t-transparent" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                  {addLineItemMutation.isPending ? 'กำลังเพิ่ม...' : 'เพิ่มรายการ'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setForm(emptyForm) }}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Event Log - Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">ประวัติการดำเนินการ</h2>
          <p className="text-xs text-gray-500 mt-0.5">{request.events.length} เหตุการณ์</p>
        </div>

        {request.events.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">ยังไม่มีประวัติการดำเนินการ</p>
          </div>
        ) : (
          <div className="px-6 py-5">
            <ol className="relative border-l-2 border-gray-200 space-y-6 ml-3">
              {request.events.map((evt) => {
                const evtConfig = EVENT_TYPE_LABELS[evt.event_type] ?? {
                  label: evt.event_type,
                  colorClass: 'text-gray-700',
                  dotClass: 'bg-gray-400',
                }
                return (
                  <li key={evt.id} className="ml-5">
                    {/* Dot */}
                    <span
                      className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${evtConfig.dotClass}`}
                    />
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className={`text-sm font-semibold ${evtConfig.colorClass}`}>
                          {evtConfig.label}
                        </p>
                        {evt.comment && (
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            "{evt.comment}"
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {new Date(evt.created_at).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">ปฏิเสธคำขอ</h3>
                <p className="text-xs text-gray-500 mt-0.5">กรุณาระบุเหตุผลในการปฏิเสธ</p>
              </div>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เหตุผล <span className="text-red-500">*</span>
                </label>
                <textarea
                  autoFocus
                  rows={4}
                  placeholder="ระบุเหตุผลในการปฏิเสธ..."
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {rejectMutation.isError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-600">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={rejectMutation.isPending || !rejectComment.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {rejectMutation.isPending ? (
                    <Spinner size="sm" className="border-white border-t-transparent" />
                  ) : null}
                  {rejectMutation.isPending ? 'กำลังส่ง...' : 'ยืนยันการปฏิเสธ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectComment('')
                  }}
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200"
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
