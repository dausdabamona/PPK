import { forwardRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { id } from 'date-fns/locale'
import { Calendar, ChevronDown } from 'lucide-react'
import 'react-datepicker/dist/react-datepicker.css'
import { formatRupiah, parseRupiah } from '../../utils/formatters'

// Register Indonesian locale for DatePicker
registerLocale('id', id)

// Base FormField wrapper
export function FormField({ label, error, helpText, required, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helpText && !error && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  )
}

// Text Input
export const Input = forwardRef(function Input(
  { error, className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  )
})

// Textarea
export const Textarea = forwardRef(function Textarea(
  { error, className = '', rows = 3, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
      {...props}
    />
  )
})

// Select
export const Select = forwardRef(function Select(
  { error, options = [], placeholder = 'Pilih...', className = '', ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={`input appearance-none pr-10 ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  )
})

// Checkbox
export const Checkbox = forwardRef(function Checkbox(
  { label, error, className = '', ...props },
  ref
) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        {...props}
      />
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  )
})

// Money Input (Rupiah)
export const MoneyInput = forwardRef(function MoneyInput(
  { value, onChange, error, className = '', ...props },
  ref
) {
  const handleChange = (e) => {
    const rawValue = parseRupiah(e.target.value)
    onChange?.(rawValue)
  }

  const displayValue = value ? formatRupiah(value, false) : ''

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
        Rp
      </span>
      <input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={`input pl-10 ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
    </div>
  )
})

// Date Input
export function DateInput({
  value,
  onChange,
  error,
  placeholder = 'Pilih tanggal',
  className = '',
  ...props
}) {
  return (
    <div className="relative">
      <DatePicker
        selected={value ? new Date(value) : null}
        onChange={(date) => onChange?.(date)}
        dateFormat="dd MMMM yyyy"
        locale="id"
        placeholderText={placeholder}
        className={`input pr-10 ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  )
}

// Search Input
export const SearchInput = forwardRef(function SearchInput(
  { onClear, className = '', ...props },
  ref
) {
  return (
    <div className="relative">
      <input
        ref={ref}
        type="search"
        className={`input pl-10 ${className}`}
        {...props}
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
})

// Form Field with Input
export function TextField({
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}) {
  return (
    <FormField
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <Input error={error} {...props} />
    </FormField>
  )
}

// Form Field with Textarea
export function TextareaField({
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}) {
  return (
    <FormField
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <Textarea error={error} {...props} />
    </FormField>
  )
}

// Form Field with Select
export function SelectField({
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}) {
  return (
    <FormField
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <Select error={error} {...props} />
    </FormField>
  )
}

// Form Field with Money Input
export function MoneyField({
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}) {
  return (
    <FormField
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <MoneyInput error={error} {...props} />
    </FormField>
  )
}

// Form Field with Date Input
export function DateField({
  label,
  error,
  helpText,
  required,
  className = '',
  ...props
}) {
  return (
    <FormField
      label={label}
      error={error}
      helpText={helpText}
      required={required}
      className={className}
    >
      <DateInput error={error} {...props} />
    </FormField>
  )
}

export default FormField
