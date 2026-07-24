import type { RequestStatus } from '../api/requests'

interface StatusBadgeProps {
  status: RequestStatus
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  DRAFT: { label: 'ร่าง', className: 'bg-gray-100 text-gray-700' },
  PENDING_MANAGER_APPROVAL: {
    label: 'รออนุมัติหัวหน้า',
    className: 'bg-yellow-100 text-yellow-800',
  },
  PENDING_FINANCE_APPROVAL: {
    label: 'รออนุมัติการเงิน',
    className: 'bg-yellow-100 text-yellow-800',
  },
  APPROVED: { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'ปฏิเสธ', className: 'bg-red-100 text-red-700' },
  PAID: { label: 'จ่ายแล้ว', className: 'bg-blue-100 text-blue-800' },
  CANCELLED: { label: 'ยกเลิก', className: 'bg-slate-100 text-slate-600' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
