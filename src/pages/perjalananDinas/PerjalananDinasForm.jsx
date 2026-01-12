import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import {
  TextField,
  TextareaField,
  SelectField,
  DateField,
  FormField,
} from '../../components/common/FormField'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { perjalananDinasSchema } from '../../utils/validators'
import { TINGKAT_BIAYA, SUMBER_DANA } from '../../utils/constants'
import { getPerjalananDinasDetail, createPerjalananDinas, updatePerjalananDinas } from '../../api/perjalananDinas'
import toast from 'react-hot-toast'

export default function PerjalananDinasForm() {
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
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(perjalananDinasSchema),
    defaultValues: {
      nomorSuratTugas: '',
      tanggalSuratTugas: '',
      tujuanDinas: '',
      kotaTujuan: '',
      tanggalBerangkat: '',
      tanggalKembali: '',
      tingkatBiaya: '',
      sumberDana: '',
      mak: '',
      keterangan: '',
    },
  })

  useEffect(() => {
    if (isEdit) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPerjalananDinasDetail(id)

      if (result.success) {
        const data = result.data
        // Map backend field names to frontend field names
        reset({
          nomorSuratTugas: data.nomorSuratTugas || data.nomorST || '',
          tanggalSuratTugas: data.tanggalSuratTugas || data.tanggalST || '',
          tujuanDinas: data.tujuanDinas || data.maksudTujuan || data.tujuan || '',
          kotaTujuan: data.kotaTujuan || '',
          tanggalBerangkat: data.tanggalBerangkat || '',
          tanggalKembali: data.tanggalKembali || '',
          tingkatBiaya: data.tingkatBiaya || '',
          sumberDana: data.sumberDana || data.instansiPembebanan || '',
          mak: data.mak || data.akun || '',
          keterangan: data.keterangan || '',
        })
      } else {
        setError(result.error || 'Gagal memuat data')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)

    // Map frontend field names to backend field names
    const payload = {
      ...data,
      // Backend uses different field names
      nomorST: data.nomorSuratTugas,
      tanggalST: data.tanggalSuratTugas,
      maksudTujuan: data.tujuanDinas,
      tujuan: data.tujuanDinas,
      akun: data.mak,
      instansiPembebanan: data.sumberDana,
    }

    try {
      const result = isEdit
        ? await updatePerjalananDinas(id, payload)
        : await createPerjalananDinas(payload)

      if (result.success) {
        toast.success(isEdit ? 'Perjalanan dinas berhasil diperbarui' : 'Perjalanan dinas berhasil dibuat')
        navigate(isEdit ? `/perjalanan-dinas/${id}` : `/perjalanan-dinas/${result.data?.id || ''}`)
      } else {
        toast.error(result.error || 'Gagal menyimpan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat data..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to={isEdit ? `/perjalanan-dinas/${id}` : '/perjalanan-dinas'}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {isEdit ? 'Kembali ke Detail' : 'Kembali ke Daftar'}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Perjalanan Dinas' : 'Buat Perjalanan Dinas Baru'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? 'Perbarui informasi perjalanan dinas' : 'Isi informasi perjalanan dinas'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perjalanan Dinas</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Surat Tugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField
                label="Nomor Surat Tugas"
                placeholder="Nomor surat tugas"
                error={errors.nomorSuratTugas?.message}
                {...register('nomorSuratTugas')}
              />

              <Controller
                name="tanggalSuratTugas"
                control={control}
                render={({ field }) => (
                  <DateField
                    label="Tanggal Surat Tugas"
                    error={errors.tanggalSuratTugas?.message}
                    value={field.value}
                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                  />
                )}
              />
            </div>

            {/* Tujuan */}
            <TextField
              label="Tujuan/Maksud Dinas"
              placeholder="Contoh: Menghadiri rapat koordinasi"
              error={errors.tujuanDinas?.message}
              required
              {...register('tujuanDinas')}
            />

            <TextField
              label="Kota/Tempat Tujuan"
              placeholder="Contoh: Jakarta, Bandung"
              error={errors.kotaTujuan?.message}
              required
              {...register('kotaTujuan')}
            />

            {/* Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="tanggalBerangkat"
                control={control}
                render={({ field }) => (
                  <DateField
                    label="Tanggal Berangkat"
                    error={errors.tanggalBerangkat?.message}
                    required
                    value={field.value}
                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                  />
                )}
              />

              <Controller
                name="tanggalKembali"
                control={control}
                render={({ field }) => (
                  <DateField
                    label="Tanggal Kembali"
                    error={errors.tanggalKembali?.message}
                    required
                    value={field.value}
                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                  />
                )}
              />
            </div>

            {/* Biaya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="tingkatBiaya"
                control={control}
                render={({ field }) => (
                  <SelectField
                    label="Tingkat Biaya"
                    options={TINGKAT_BIAYA}
                    error={errors.tingkatBiaya?.message}
                    required
                    {...field}
                  />
                )}
              />

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
            </div>

            {/* MAK */}
            <TextField
              label="MAK (Mata Anggaran Kegiatan)"
              placeholder="Kode anggaran"
              error={errors.mak?.message}
              {...register('mak')}
            />

            {/* Keterangan */}
            <TextareaField
              label="Keterangan"
              placeholder="Keterangan tambahan..."
              rows={3}
              error={errors.keterangan?.message}
              {...register('keterangan')}
            />
          </CardBody>

          <CardFooter className="flex justify-end gap-3">
            <Link to={isEdit ? `/perjalanan-dinas/${id}` : '/perjalanan-dinas'}>
              <Button variant="secondary" type="button">
                Batal
              </Button>
            </Link>
            <Button type="submit" loading={submitting} icon={Save}>
              {isEdit ? 'Simpan Perubahan' : 'Buat Perjalanan Dinas'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
