import { ConfirmDialog } from './Modal'

/**
 * Prompt dialog for unsaved changes
 */
export function UnsavedChangesPrompt({
  open,
  onConfirm,
  onCancel,
  message = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?'
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Perubahan Belum Disimpan"
      message={message}
      type="warning"
      confirmText="Ya, Tinggalkan"
      cancelText="Kembali"
    />
  )
}

export default UnsavedChangesPrompt
