import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import {
  TextField,
  TextareaField,
  SelectField,
  Input,
  Select,
  FormField,
} from '../../components/common/FormField'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { paketSchema } from '../../utils/validators'
import { JENIS_PENGADAAN, METODE_PENGADAAN, SUMBER_DANA } from '../../utils/constants'
import { getPaketDetail, createPaket, updatePaket } from '../../api/paket'
import toast from 'react-hot-toast'

export default function PaketForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paketSchema),
    defaultValues: {
      namaPaket: '',
      jenisPengadaan: '',
      metodePengadaan: '',
      sumberDana: '',
      tahunAnggaran: new Date().getFullYear(),
      mak: '',
      lokasi: '',
      keterangan: '',
    },
  })

  const fetchPaket = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const result = await getPaketDetail(id)

      if (result.success) {
        reset({
          namaPaket: result.data.namaPaket || '',
          jenisPengadaan: result.data.jenisPengadaan || '',
          metodePengadaan: result.data.metodePengadaan || '',
          sumberDana: result.data.sumberDana || '',
          tahunAnggaran: result.data.tahunAnggaran || new Date().getFullYear(),
          mak: result.data.mak || '',
          lokasi: result.data.lokasi || '',
          keterangan: result.data.keterangan || '',
        })
      } else {
        setError(result.error || 'Gagal memuat data paket')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }, [id, reset])

  useEffect(() => {
    if (isEdit) {
      fetchPaket()
    }
  }, [isEdit, fetchPaket])

  const onSubmit = async (data) => {
    setSubmitting(true)

    try {
      const result = isEdit
        ? await updatePaket(id, data)
        : await createPaket(data)

      if (result.success) {
        toast.success(isEdit ? 'Paket berhasil diperbarui' : 'Paket berhasil dibuat')
        navigate(isEdit ? `/paket/${id}` : `/paket/${result.data?.id || ''}`)
      } else {
        toast.error(result.error || 'Gagal menyimpan paket')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat data paket..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPaket} />
  }

  // Generate year options (current year -2 to +2)
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    yearOptions.push({ value: year, label: year.toString() })
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to={isEdit ? `/paket/${id}` : '/paket'}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {isEdit ? 'Kembali ke Detail' : 'Kembali ke Daftar'}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Paket Pengadaan' : 'Buat Paket Pengadaan Baru'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? 'Perbarui informasi paket pengadaan'
            : 'Isi informasi dasar untuk membuat paket pengadaan baru'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Paket</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Nama Paket */}
            <TextField
              label="Nama Paket"
              placeholder="Contoh: Pengadaan ATK Tahun 2024"
              error={errors.namaPaket?.message}
              required
              {...register('namaPaket')}
            />

            {/* Grid for type selections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jenis Pengadaan */}
              <Controller
                name="jenisPengadaan"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Jenis Pengadaan"
                    options={JENIS_PENGADAAN}
                    error={errors.jenisPengadaan?.message}
                    required
                    {...field}
                  />
                )}
              />

              {/* Metode Pengadaan */}
              <Controller
                name="metodePengadaan"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Metode Pengadaan"
                    options={METODE_PENGADAAN}
                    error={errors.metodePengadaan?.message}
                    required
                    {...field}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sumber Dana */}
              <Controller
                name="sumberDana"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Sumber Dana"
                    options={SUMBER_DANA}
                    error={errors.sumberDana?.message}
                    required
                    {...field}
                  />
                )}
              />

              {/* Tahun Anggaran */}
              <Controller
                name="tahunAnggaran"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Tahun Anggaran"
                    error={errors.tahunAnggaran?.message}
                    required
                  >
                    <Select
                      options={yearOptions}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      error={errors.tahunAnggaran?.message}
                    />
                  </FormField>
                )}
              />
            </div>

            {/* MAK */}
            <TextField
              label="MAK (Mata Anggaran Kegiatan)"
              placeholder="Contoh: 524111"
              error={errors.mak?.message}
              helpText="Kode anggaran untuk paket ini"
              {...register('mak')}
            />

            {/* Lokasi */}
            <TextField
              label="Lokasi"
              placeholder="Contoh: Jakarta"
              error={errors.lokasi?.message}
              {...register('lokasi')}
            />

            {/* Keterangan */}
            <TextareaField
              label="Keterangan"
              placeholder="Keterangan tambahan tentang paket ini..."
              rows={4}
              error={errors.keterangan?.message}
              {...register('keterangan')}
            />
          </CardBody>

          <CardFooter className="flex justify-end gap-3">
            <Link to={isEdit ? `/paket/${id}` : '/paket'}>
              <Button variant="secondary" type="button">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              loading={submitting}
              icon={Save}
            >
              {isEdit ? 'Simpan Perubahan' : 'Buat Paket'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
