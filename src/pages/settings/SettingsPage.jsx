import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Building2, User, Folder } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { TextField, TextareaField } from '../../components/common/FormField'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { configSchema } from '../../utils/validators'
import { getConfig, updateConfig } from '../../api/config'
import { useStore } from '../../store'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { setConfig } = useStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      namaSatker: '',
      namaPPK: '',
      nipPPK: '',
      namaKPA: '',
      nipKPA: '',
      alamatSatker: '',
    },
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getConfig()

      if (result.success) {
        const data = result.data || {}
        reset({
          namaSatker: data.namaSatker || '',
          namaPPK: data.namaPPK || '',
          nipPPK: data.nipPPK || '',
          namaKPA: data.namaKPA || '',
          nipKPA: data.nipKPA || '',
          alamatSatker: data.alamatSatker || '',
        })
        setConfig(data)
      } else {
        // Allow editing even if fetch fails - might be first setup
        console.warn('Config fetch failed:', result.error)
      }
    } catch (err) {
      console.error('Config fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSubmitting(true)

    try {
      const result = await updateConfig(data)

      if (result.success) {
        toast.success('Konfigurasi berhasil disimpan')
        setConfig(data)
      } else {
        toast.error(result.error || 'Gagal menyimpan konfigurasi')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat konfigurasi..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Konfigurasi satuan kerja dan pejabat
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Satker Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" />
              <CardTitle>Informasi Satuan Kerja</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <TextField
              label="Nama Satuan Kerja"
              placeholder="Nama lengkap satuan kerja"
              error={errors.namaSatker?.message}
              required
              {...register('namaSatker')}
            />

            <TextareaField
              label="Alamat Satuan Kerja"
              placeholder="Alamat lengkap"
              rows={2}
              error={errors.alamatSatker?.message}
              {...register('alamatSatker')}
            />
          </CardBody>
        </Card>

        {/* PPK Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" />
              <CardTitle>Pejabat Pembuat Komitmen (PPK)</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Nama PPK"
                placeholder="Nama lengkap PPK"
                error={errors.namaPPK?.message}
                required
                {...register('namaPPK')}
              />

              <TextField
                label="NIP PPK"
                placeholder="NIP PPK"
                error={errors.nipPPK?.message}
                {...register('nipPPK')}
              />
            </div>
          </CardBody>
        </Card>

        {/* KPA Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" />
              <CardTitle>Kuasa Pengguna Anggaran (KPA)</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Nama KPA"
                placeholder="Nama lengkap KPA"
                error={errors.namaKPA?.message}
                {...register('namaKPA')}
              />

              <TextField
                label="NIP KPA"
                placeholder="NIP KPA"
                error={errors.nipKPA?.message}
                {...register('nipKPA')}
              />
            </div>
          </CardBody>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button type="submit" loading={submitting} icon={Save}>
            Simpan Konfigurasi
          </Button>
        </div>
      </form>
    </div>
  )
}
