import { defineStore } from 'pinia'
import { ep } from 'stores/ep.js'
import { useDataStore } from 'stores/data.js'

// Statusul comenzii folosește peste tot (state, UI, request-uri către
// backend) direct vocabularul backend-ului — opened/ready/closed — fără
// niciun strat de traducere intern, ca aplicația să rămână scalabilă dacă
// mai apar statusuri noi.
export const ORDER_STATUS = { OPENED: 'opened', READY: 'ready', CLOSED: 'closed' }

// mapează o comandă așa cum vine din POST /v2/app/vendor/get/ (câmp `orders`)
// pe forma consumată de UI — doar comenzile cu type: "online" au `products`
// (restul sunt tranzacții de POS fără listă de produse, gen plată cu cardul
// direct la terminal, fără coș din app)
function mapOrder (raw, prefix) {
  const products = raw.products || []

  return {
    id: `#${prefix}${String(raw.nominal_order_id).padStart(4, '0')}`,
    _id: raw._id, // id-ul real din backend — necesar pentru change_status (vezi updateOrderStatus)
    status: raw.status || ORDER_STATUS.OPENED,
    items: products.map(p => ({ qty: Number(p.qty), name: p.name })),
    extra: products.flatMap(p => (p.extras || []).map(e => e.name)).join(', ') || null,
    total: Number(raw.subtotal) / 100,
  }
}

// mapează un produs așa cum vine din POST /v2/app/vendor/get/ (câmp `products`,
// formă CMS cu field/value pentru fiecare grup de extra-uri) pe forma
// consumată de UI (VendorNewOrder.vue) — preț în lei (backend trimite bani),
// extraGroups: [{ title, max, required, options: [{ name, price }] }].
// `required` vine din accept_no_selection: dacă backend-ul NU acceptă lipsa
// selecției, grupul e obligatoriu (minim 1 opțiune) — vezi VendorNewOrder.vue.
// `priceRaw`/`plu` se păstrează neatinse (nu doar convertite/afișate) —
// la crearea comenzii (saveOrder) se trimit înapoi la backend exact cum au
// venit, nu valoarea în lei folosită pentru display. `plu` e id-ul din
// casa de marcat.
function mapProduct (raw) {
  return {
    id: raw._id,
    name: raw.title,
    category: raw.category?.display || 'Altele',
    price: Number(raw.price) / 100,
    priceRaw: raw.price,
    plu: raw.plu,
    // active/duration — editate din VendorSettings.vue (on-off + timp de
    // preparare), salvate prin updateProductSettings() la /vendor/settings/
    active: raw.active,
    duration: Number(raw.duration) || 0,
    extraGroups: (raw.extras || []).map(e => ({
      title: e.value.title,
      max: Number(e.value.selections) || 1,
      required: !e.value.accept_no_selection,
      options: (e.value.items || []).map(i => ({
        name: i.value.title.trim(),
        price: Number(i.value.price) / 100,
        priceRaw: i.value.price,
        plu: i.value.plu,
      })),
    })),
  }
}

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    // profil vendor — populat de fetchVendor() la intrarea pe VendorPage
    // (POST /v2/app/vendor/get/, vezi docs/vendor-api-requirements.md #1).
    // value_only: true = vendor fără meniu/produse, ia doar plăți cu sumă
    // custom (fără tab-uri In progress/Completed/Closed).
    // online_orders: true = butonul de Settings apare pe /vendor.
    vendor: null,

    // populat de fetchVendor() din câmpul `products` al POST /v2/app/vendor/get/
    // (vezi mapProduct) — gol până vine răspunsul, VendorNewOrder.vue arată
    // skeleton cât timp vendor === null.
    products: [],

    orders: [],
  }),

  getters: {
    categories: (state) => [...new Set(state.products.map(p => p.category))],
  },

  actions: {
    // POST /v2/app/vendor/get/ — profil vendor curent (identificat din token),
    // vine împreună cu array-ul de orders al vendor-ului.
    async fetchVendor () {
      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorGet)
      this.vendor = data
      if (data.orders) {
        this.orders = data.orders.map(o => mapOrder(o, data.prefix || 'ita'))
      }
      if (data.products) {
        this.products = data.products.map(mapProduct)
      }
      return data
    },

    // Apelat din Callback.vue după succesul plății (Card sau Card Festival),
    // atât pentru value_only: true (cart cu un singur item "Custom amount",
    // fără productId/priceRaw/plu — nu vine dintr-un produs real de meniu),
    // cât și pentru value_only: false (cart cu produse din meniu, populat
    // din VendorNewOrder.vue cu productId/priceRaw/plu) — aceeași formă
    // de cart în ambele cazuri, deci un singur punct de salvare.
    // cartItems: [{ name, productId?, plu?, priceRaw?, extras: [{name, price, priceRaw?, plu?}], lineTotal }]
    async saveOrder (cartItems, paymentMethod, transactionId, shortOrderCode) {
      const prefix = this.vendor?.prefix || 'ita'
      const nextNum = this.orders.length
        ? Math.max(...this.orders.map(o => parseInt(o.id.replace(`#${prefix}`, ''), 10))) + 1
        : 401

      const order = {
        id: `#${prefix}${String(nextNum).padStart(4, '0')}`,
        status: ORDER_STATUS.OPENED,
        // fără qty — fiecare linie din cart e 1 bucată (vezi VendorNewOrder.vue,
        // "Add" creează mereu o linie nouă, nu incrementează o cantitate)
        items: cartItems.map(item => ({ name: item.name })),
        extra: cartItems.flatMap(item => item.extras.map(e => e.name)).join(', ') || null,
        total: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
      }
      this.orders.unshift(order)

      // preț brut per item/extra — cel primit de la backend prin vendor/get
      // (item.priceRaw/e.priceRaw, vezi mapProduct), nu valoarea în lei
      // folosită pentru display; "Custom amount" (value_only) n-are
      // priceRaw fiindcă nu vine dintr-un produs real, deci cade pe
      // lineTotal-ul introdus manual convertit în bani.
      const rawPrice = (value, fallbackLei) => value ?? String(Math.round(fallbackLei * 100))

      const products = cartItems.map(item => ({
        price: rawPrice(item.priceRaw, item.lineTotal),
        product: item.productId || null,
        name: item.name,
        plu: item.plu ?? null,
        extras: item.extras.map(e => ({
          name: e.name,
          price: rawPrice(e.priceRaw, e.price),
          plu: e.plu ?? null,
        })),
      }))

      const payload = {
        order: {
          // type reflectă metoda de plată — paymentMethod e deja "card" (Card/Viva)
          // sau "prepaid" (Card Festival, vezi VendorPaymentModal.vue), nu mai e
          // nevoie de nicio traducere intermediară
          type: paymentMethod,
          subtotal: String(products.reduce((sum, p) => sum + Number(p.price) + p.extras.reduce((s, e) => s + Number(e.price), 0), 0)),
          comments: '',
          shortOrderCode,
          transactionId,
          products,
        },
      }
      console.log('[vendor/orders] payload:', payload)

      const dataStore = useDataStore()
      try {
        const { data } = await dataStore._post(ep.vendorOrderCreate, payload)
        console.log('[vendor/orders] response:', data)

        // răspunsul e comanda reală creată în backend (aceeași formă ca
        // `orders` din vendor/get, vezi mapOrder) — actualizăm imediat comanda
        // locală optimistă cu statusul/id-ul real la primirea lui 200, nu la
        // următorul fetchVendor(): altfel în /vendor apare o clipă comanda cu
        // categorisirea optimistă greșită, până se reface lista la refetch.
        if (data?._id) {
          Object.assign(order, mapOrder(data, prefix))
        }
      } catch (e) {
        console.error('[vendor/orders] error:', e?.response?.data || e)
      }

      return order
    },

    // Apelat din VendorPage.vue după cele 5s de "waiting" pe butonul
    // Complete/Close (fără modal de confirmare, vezi onStatusBtnClick).
    // Comanda se mută din tab-ul curent (In progress/Completed) doar după ce
    // vine efectiv răspunsul 200 — nu optimist, la fel ca mutarea butonului
    // în loading. Dacă request-ul pică, aruncă mai departe (caller-ul decide
    // ce arată userului) și comanda rămâne neschimbată.
    // Endpoint confirmat: POST /v2/app/vendor/order/change_status/, body
    // { _id, status } — _id e id-ul real din backend (order._id, vezi
    // mapOrder), NU id-ul afișat gen "#ita0405". `status` e mereu una din
    // ORDER_STATUS (opened/ready/closed) — trimisă ca atare, fără traducere.
    async updateOrderStatus (orderId, status) {
      const order = this.orders.find(o => o.id === orderId)
      if (!order?._id) {
        console.error('[vendor/order/change_status] lipsește order._id (comandă creată local, neconfirmată încă de backend?):', orderId)
      }

      const payload = { _id: order?._id, status }
      console.log('[vendor/order/change_status] payload:', payload)

      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorOrderStatus, payload)
      console.log('[vendor/order/change_status] response:', data)

      if (order) order.status = status

      return order
    },

    // Apelat din VendorSettings.vue la "Save", doar cu produsele modificate
    // (on/off + timp de preparare). Endpoint confirmat: POST /v2/app/vendor/settings/,
    // body { products: [{ _id, duration, active }] }, răspuns:
    // [{ _id, duration, active, _by, _modified }].
    async updateProductSettings (products) {
      const payload = { products }
      console.log('[vendor/settings] payload:', payload)

      const dataStore = useDataStore()
      const { data } = await dataStore._post(ep.vendorSettingsUpdate, payload)
      console.log('[vendor/settings] response:', data)

      // sincronizăm valorile confirmate de backend înapoi în vendorStore.products,
      // ca o revenire pe pagină (fără refetch) să reflecte ce s-a salvat — dacă
      // răspunsul nu e array-ul așteptat (ack minimal etc.), sărim peste
      // sincronizare fără să aruncăm, ca apelantul (VendorSettings.vue) să nu
      // rateze resetarea evidenței de modificări doar din cauza formei răspunsului
      if (Array.isArray(data)) {
        const byId = new Map(data.map(p => [p._id, p]))
        this.products.forEach(p => {
          const updated = byId.get(p.id)
          if (updated) {
            p.active = updated.active
            p.duration = Number(updated.duration)
          }
        })
      }

      return data
    }
  }
})
