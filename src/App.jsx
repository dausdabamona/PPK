import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout'
import { LoadingPage } from './components/common/Loading'
import { ErrorBoundary } from './components/common/ErrorState'

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Paket pages
const PaketList = lazy(() => import('./pages/paket/PaketList'))
const PaketDetail = lazy(() => import('./pages/paket/PaketDetail'))
const PaketForm = lazy(() => import('./pages/paket/PaketForm'))
const PaketItemsPage = lazy(() => import('./pages/paket/PaketItemsPage'))
const PaketSurveyPage = lazy(() => import('./pages/paket/PaketSurveyPage'))
const PaketHPSPage = lazy(() => import('./pages/paket/PaketHPSPage'))
const PaketDokumenPage = lazy(() => import('./pages/paket/PaketDokumenPage'))
const PaketCompliancePage = lazy(() => import('./pages/paket/PaketCompliancePage'))
const PaketLampiranPage = lazy(() => import('./pages/paket/PaketLampiranPage'))

// Penyedia pages
const PenyediaList = lazy(() => import('./pages/penyedia/PenyediaList'))

// Perjalanan Dinas pages
const PerjalananDinasList = lazy(() => import('./pages/perjalananDinas/PerjalananDinasList'))
const PerjalananDinasDetail = lazy(() => import('./pages/perjalananDinas/PerjalananDinasDetail'))
const PerjalananDinasForm = lazy(() => import('./pages/perjalananDinas/PerjalananDinasForm'))

// Settings pages
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const NumberingPage = lazy(() => import('./pages/settings/NumberingPage'))
const ApiSettingsPage = lazy(() => import('./pages/settings/ApiSettingsPage'))

// Page wrapper with suspense
function PageLoader({ children }) {
  return (
    <Suspense fallback={<LoadingPage message="Memuat halaman..." />}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

// 404 Page
function NotFound() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-200">404</h1>
        <p className="mt-4 text-xl font-semibold text-slate-900">Halaman tidak ditemukan</p>
        <p className="mt-2 text-slate-500">Halaman yang Anda cari tidak tersedia.</p>
        <a
          href="/"
          className="mt-6 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Dashboard */}
        <Route
          index
          element={
            <PageLoader>
              <Dashboard />
            </PageLoader>
          }
        />

        {/* Paket Routes */}
        <Route path="paket">
          <Route
            index
            element={
              <PageLoader>
                <PaketList />
              </PageLoader>
            }
          />
          <Route
            path="create"
            element={
              <PageLoader>
                <PaketForm />
              </PageLoader>
            }
          />
          <Route
            path=":id"
            element={
              <PageLoader>
                <PaketDetail />
              </PageLoader>
            }
          />
          <Route
            path=":id/edit"
            element={
              <PageLoader>
                <PaketForm />
              </PageLoader>
            }
          />
          {/* Sub-routes for paket detail sections */}
          <Route
            path=":id/items"
            element={
              <PageLoader>
                <PaketItemsPage />
              </PageLoader>
            }
          />
          <Route
            path=":id/survey"
            element={
              <PageLoader>
                <PaketSurveyPage />
              </PageLoader>
            }
          />
          <Route
            path=":id/dokumen"
            element={
              <PageLoader>
                <PaketDokumenPage />
              </PageLoader>
            }
          />
          <Route
            path=":id/hps"
            element={
              <PageLoader>
                <PaketHPSPage />
              </PageLoader>
            }
          />
          <Route
            path=":id/compliance"
            element={
              <PageLoader>
                <PaketCompliancePage />
              </PageLoader>
            }
          />
          <Route
            path=":id/lampiran"
            element={
              <PageLoader>
                <PaketLampiranPage />
              </PageLoader>
            }
          />
        </Route>

        {/* Penyedia Routes */}
        <Route path="penyedia">
          <Route
            index
            element={
              <PageLoader>
                <PenyediaList />
              </PageLoader>
            }
          />
        </Route>

        {/* Perjalanan Dinas Routes */}
        <Route path="perjalanan-dinas">
          <Route
            index
            element={
              <PageLoader>
                <PerjalananDinasList />
              </PageLoader>
            }
          />
          <Route
            path="create"
            element={
              <PageLoader>
                <PerjalananDinasForm />
              </PageLoader>
            }
          />
          <Route
            path=":id"
            element={
              <PageLoader>
                <PerjalananDinasDetail />
              </PageLoader>
            }
          />
          <Route
            path=":id/edit"
            element={
              <PageLoader>
                <PerjalananDinasForm />
              </PageLoader>
            }
          />
        </Route>

        {/* Dokumen Routes - redirect to paket for now */}
        <Route path="dokumen" element={<Navigate to="/paket" replace />} />

        {/* Settings Routes */}
        <Route path="settings">
          <Route
            index
            element={
              <PageLoader>
                <SettingsPage />
              </PageLoader>
            }
          />
          <Route
            path="numbering"
            element={
              <PageLoader>
                <NumberingPage />
              </PageLoader>
            }
          />
          <Route
            path="api"
            element={
              <PageLoader>
                <ApiSettingsPage />
              </PageLoader>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
