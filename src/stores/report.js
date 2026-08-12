import { defineStore, acceptHMRUpdate } from 'pinia'
import { ep } from 'stores/ep.js'
import { useDataStore } from 'stores/data.js'

// Răspunsul e fie un obiect cheiat pe zi (ex. "6 August": { cash, card }),
// fie un array de obiecte cu propriul câmp `date` — PHP serializează un
// array asociativ cu chei neîntrerupte 0,1,2... ca JSON array, nu ca obiect,
// deci Object.entries pe el ar da indexul ca "dată" în loc de valoarea reală.
// Preferăm mereu v.date dacă există pe rând; altfel cădem pe cheia din obiect.
// mapRow(v) extrage câmpurile specifice fiecărui tip de raport (tickets/vendor
// au cash+card, access are doar scans).
function toRows (data, mapRow) {
  const entries = Array.isArray(data)
    ? data.map((v, i) => [i, v])
    : Object.entries(data || {})

  return entries.map(([key, v]) => ({
    date: v?.date ?? key,
    ...mapRow(v)
  }))
}

const mapPayment = (v) => ({
  cash: Number(v?.cash) || 0,
  card: Number(v?.card) || 0,
  total: (Number(v?.cash) || 0) + (Number(v?.card) || 0)
})

// vendor/report/ nu are cash — are online/card/prepaid (vezi ep.reportVendor)
const mapVendor = (v) => {
  const online = Number(v?.online) || 0
  const card = Number(v?.card) || 0
  const prepaid = Number(v?.prepaid) || 0
  return { online, card, prepaid, total: online + card + prepaid }
}

const mapAccess = (v) => ({
  scans: Number(v?.scans) || 0
})

export const useReportStore = defineStore('report', {
  state: () => ({
    tickets: [],
    vendor: [],
    access: [],
    topUp: [],
    loading: { tickets: false, vendor: false, access: false, topUp: false }
  }),

  actions: {
    async fetchTicketsReport () {
      this.loading.tickets = true
      try {
        const dataStore = useDataStore()
        const { data } = await dataStore._post(ep.reportTickets)
        this.tickets = toRows(data, mapPayment)
      } finally {
        this.loading.tickets = false
      }
    },

    async fetchVendorReport () {
      this.loading.vendor = true
      try {
        const dataStore = useDataStore()
        const { data } = await dataStore._post(ep.reportVendor)
        this.vendor = toRows(data, mapVendor)
      } finally {
        this.loading.vendor = false
      }
    },

    async fetchAccessReport () {
      this.loading.access = true
      try {
        const dataStore = useDataStore()
        const { data } = await dataStore._post(ep.reportAccess)
        this.access = toRows(data, mapAccess)
      } finally {
        this.loading.access = false
      }
    },

    async fetchTopUpReport () {
      this.loading.topUp = true
      try {
        const dataStore = useDataStore()
        const { data } = await dataStore._post(ep.reportTopUp)
        this.topUp = toRows(data, mapPayment)
      } finally {
        this.loading.topUp = false
      }
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportStore, import.meta.hot))
}
