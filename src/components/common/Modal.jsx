import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { Button } from './Button'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
  className = '',
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${sizes[size]} transform rounded-xl bg-white shadow-xl transition-all ${className}`}
              >
                {/* Header */}
                {(title || showClose) && (
                  <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-slate-500">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export function ModalBody({ children, className = '' }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}

// Confirm Dialog
const confirmIcons = {
  warning: { icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-100' },
  danger: { icon: AlertCircle, color: 'text-error-600', bg: 'bg-error-100' },
  success: { icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-100' },
  info: { icon: Info, color: 'text-primary-600', bg: 'bg-primary-100' },
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'warning',
  loading = false,
}) {
  const { icon: Icon, color, bg } = confirmIcons[type] || confirmIcons.warning

  return (
    <Modal open={open} onClose={onClose} size="sm" showClose={false}>
      <ModalBody>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${bg}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={type === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// Alert Dialog (single button)
export function AlertDialog({
  open,
  onClose,
  title,
  message,
  buttonText = 'OK',
  type = 'info',
}) {
  const { icon: Icon, color, bg } = confirmIcons[type] || confirmIcons.info

  return (
    <Modal open={open} onClose={onClose} size="sm" showClose={false}>
      <ModalBody>
        <div className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </div>
      </ModalBody>
      <ModalFooter className="justify-center">
        <Button onClick={onClose}>{buttonText}</Button>
      </ModalFooter>
    </Modal>
  )
}

export default Modal
