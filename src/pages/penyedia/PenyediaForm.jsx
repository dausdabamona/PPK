import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { ModalBody, ModalFooter } from '../../components/common/Modal'
import {
  TextField,
  TextareaField,
  Checkbox,
  FormField,
  Input,
} from '../../components/common/FormField'
import { penyediaSchema } from '../../utils/validators'
import { createPenyedia, updatePenyedia } from '../../api/penyedia'
import toast from 'react-hot-toast'

export default function PenyediaForm({ penyedia, onSuccess, onCancel }) {
  const isEdit = Boolean(penyedia?.id)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(penyediaSchema),
    defaultValues: {
      nama: penyedia?.nama || '',
      alamat: penyedia?.alamat || '',
      npwp: penyedia?.npwp || '',
      telepon: penyedia?.telepon || '',
      email: penyedia?.email || '',
      namaBank: penyedia?.namaBank || '',
      noRekening: penyedia?.noRekening || '',
      atasNamaRekening: penyedia?.atasNamaRekening || '',
      isPKP: penyedia?.isPKP || false,
      kualifikasi: penyedia?.kualifikasi || '',
    },
  })

  const onSubmit = async (data) => {
    setSubmitting(true)

    try {
      const result = isEdit
        ? await updatePenyedia(penyedia.id, data)
        : await createPenyedia(data)

      if (result.success) {
        toast.success(isEdit ? 'Penyedia berhasil diperbarui' : 'Penyedia berhasil ditambahkan')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Gagal menyimpan penyedia')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ModalBody className="space-y-6">
        {/* Nama Penyedia */}
        <TextField
          label="Nama Penyedia"
          placeholder="Nama perusahaan atau individu"
          error={errors.nama?.message}
          required
          {...register('nama')}
        />

        {/* Alamat */}
        <TextareaField
          label="Alamat"
          placeholder="Alamat lengkap"
          rows={2}
          error={errors.alamat?.message}
          {...register('alamat')}
        />

        {/* NPWP */}
        <TextField
          label="NPWP"
          placeholder="00.000.000.0-000.000"
          error={errors.npwp?.message}
          {...register('npwp')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Telepon */}
          <TextField
            label="Telepon"
            placeholder="081234567890"
            error={errors.telepon?.message}
            {...register('telepon')}
          />

          {/* Email */}
          <TextField
            label="Email"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Bank info */}
        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-900 mb-4">Informasi Rekening Bank</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Nama Bank"
              placeholder="Contoh: BCA, BNI, Mandiri"
              error={errors.namaBank?.message}
              {...register('namaBank')}
            />

            <TextField
              label="Nomor Rekening"
              placeholder="1234567890"
              error={errors.noRekening?.message}
              {...register('noRekening')}
            />
          </div>

          <TextField
            label="Atas Nama Rekening"
            placeholder="Nama pemilik rekening"
            error={errors.atasNamaRekening?.message}
            className="mt-4"
            {...register('atasNamaRekening')}
          />
        </div>

        {/* Status & Kualifikasi */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Controller
                name="isPKP"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="Pengusaha Kena Pajak (PKP)"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <p className="mt-1 text-xs text-slate-500">
                Centang jika penyedia merupakan PKP yang terdaftar
              </p>
            </div>

            <TextField
              label="Kualifikasi"
              placeholder="Contoh: Kecil, Menengah, Besar"
              error={errors.kualifikasi?.message}
              {...register('kualifikasi')}
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" loading={submitting} icon={Save}>
          {isEdit ? 'Simpan Perubahan' : 'Tambah Penyedia'}
        </Button>
      </ModalFooter>
    </form>
  )
}
