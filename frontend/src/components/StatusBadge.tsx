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
    dotClass: 'bg-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  },
  PENDING_MANAGER_APPROVAL: {
    label: 'รออนุมัติหัวหน้า',
    dotClass: 'bg-yellow-400',
    badgeClass: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200',
  },
  PENDING_FINANCE_APPROVAL: {
    label: 'รออนุมัติการเงิน',
    dotClass: 'bg-yellow-400',
    badgeClass: 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-200',
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    dotClass: 'bg-green-400',
    badgeClass: 'bg-green-50 text-green-800 ring-1 ring-green-200',
  },
  REJECTED: {
    label: 'ปฏิเสธ',
    dotClass: 'bg-red-400',
    badgeClass: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
  PAID: {
    label: 'จ่ายแล้ว',
    dotClass: 'bg-blue-400',
    badgeClass: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
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
