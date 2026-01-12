export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`}>
      {children}
    </p>
  )
}

// Stat Card for dashboard
export function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className = '' }) {
  return (
    <Card className={className}>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
            {trend && (
              <div className={`mt-2 flex items-center text-sm ${trendUp ? 'text-success-600' : 'text-error-600'}`}>
                <span>{trendUp ? '↑' : '↓'} {trend}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary-100 rounded-lg">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default Card
