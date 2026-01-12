import { STATUS_COLORS, STATUS_LABELS, STATUS_PD_LABELS } from '../../utils/constants'

const colorClasses = {
  primary: 'bg-primary-100 text-primary-800',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  gray: 'bg-slate-100 text-slate-700',
}

export function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`badge ${colorClasses[color] || colorClasses.gray} ${className}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status, type = 'paket' }) {
  const labels = type === 'pd' ? STATUS_PD_LABELS : STATUS_LABELS
  const color = STATUS_COLORS[status] || 'gray'
  const label = labels[status] || status

  return <Badge color={color}>{label}</Badge>
}

export default Badge
