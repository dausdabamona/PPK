import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Main application store
export const useStore = create(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: true,
      sidebarCollapsed: false,

      // User preferences
      darkMode: false,

      // Config cache
      config: null,
      configLoaded: false,

      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      setConfig: (config) => set({ config, configLoaded: true }),
      clearConfig: () => set({ config: null, configLoaded: false }),
    }),
    {
      name: 'ppk-os-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
      }),
    }
  )
)

// Paket list state (not persisted)
export const usePaketStore = create((set) => ({
  paketList: [],
  paketLoading: false,
  paketError: null,
  selectedPaket: null,
  filters: {
    status: '',
    jenisPengadaan: '',
    metodePengadaan: '',
    search: '',
    tahun: new Date().getFullYear(),
  },

  setPaketList: (paketList) => set({ paketList }),
  setPaketLoading: (loading) => set({ paketLoading: loading }),
  setPaketError: (error) => set({ paketError: error }),
  setSelectedPaket: (paket) => set({ selectedPaket: paket }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({
    filters: {
      status: '',
      jenisPengadaan: '',
      metodePengadaan: '',
      search: '',
      tahun: new Date().getFullYear(),
    }
  }),
}))

// Penyedia list state
export const usePenyediaStore = create((set) => ({
  penyediaList: [],
  penyediaLoading: false,
  penyediaError: null,
  searchQuery: '',

  setPenyediaList: (penyediaList) => set({ penyediaList }),
  setPenyediaLoading: (loading) => set({ penyediaLoading: loading }),
  setPenyediaError: (error) => set({ penyediaError: error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

// Perjalanan Dinas state
export const usePerjalananDinasStore = create((set) => ({
  pdList: [],
  pdLoading: false,
  pdError: null,
  filters: {
    status: '',
    search: '',
    tahun: new Date().getFullYear(),
  },

  setPdList: (pdList) => set({ pdList }),
  setPdLoading: (loading) => set({ pdLoading: loading }),
  setPdError: (error) => set({ pdError: error }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({
    filters: {
      status: '',
      search: '',
      tahun: new Date().getFullYear(),
    }
  }),
}))

export default useStore
