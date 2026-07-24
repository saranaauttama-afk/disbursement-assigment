import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRequest } from '../api/requests'
import Spinner from '../components/Spinner'

const TITLE_MAX = 120
const NOTE_MAX = 500

export default function CreateRequestPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      navigate(`/requests/${data.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate({ title: title.trim(), note: note.trim() || undefined })
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <button
            onClick={() => navigate('/')}
            className="hover:text-indigo-600 transition-colors duration-200"
          >
            รายการเบิกจ่าย
          </button>
          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-slate-800 font-medium">สร้างคำขอใหม่</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">สร้างคำขอเบิกจ่ายใหม่</h1>
          <p className="text-sm text-slate-500 mt-1">กรอกข้อมูลเพื่อสร้างคำขอ จากนั้นเพิ่มรายการค่าใช้จ่าย</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700">ข้อมูลคำขอ</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                  หัวข้อ <span className="text-rose-500">*</span>
                </label>
                <span className={`text-xs ${title.length > TITLE_MAX * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={TITLE_MAX}
                placeholder="ระบุหัวข้อคำขอเบิกจ่าย"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-slate-400 mt-1.5">ชื่อที่ชัดเจนจะช่วยให้ผู้อนุมัติเข้าใจง่ายขึ้น</p>
            </div>

            {/* Note field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="note" className="block text-sm font-medium text-slate-700">
                  หมายเหตุ
                </label>
                <span className={`text-xs ${note.length > NOTE_MAX * 0.9 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {note.length}/{NOTE_MAX}
                </span>
              </div>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={NOTE_MAX}
                placeholder="รายละเอียดเพิ่มเติม เช่น วัตถุประสงค์ หรือข้อมูลอ้างอิง (ถ้ามี)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all duration-200"
              />
            </div>

            {/* Error */}
            {mutation.isError && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-rose-600">เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending || !title.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                {mutation.isPending ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    <span>กำลังสร้าง...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>สร้างคำขอ</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-white text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
