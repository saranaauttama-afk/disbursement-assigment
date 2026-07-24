import type { RequestStatus } from '../api/requests'

interface StatusBadgeProps {
  status: RequestStatus
}

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  DRAFT: {
    label: 'ร่าง',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  },
  PENDING_MANAGER_APPROVAL: {
    label: 'รออนุมัติหัวหน้า',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  PENDING_FINANCE_APPROVAL: {
    label: 'รออนุมัติการเงิน',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    dotClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  REJECTED: {
    label: 'ปฏิเสธ',
    dotClass: 'bg-rose-400',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  },
  PAID: {
    label: 'จ่ายแล้ว',
    dotClass: 'bg-indigo-400',
    badgeClass: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
      {config.label}
    </span>
  )
}
