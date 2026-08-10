import { defineStore } from 'pinia'
import { ep } from 'stores/ep.js'
import { useDataStore } from 'stores/data.js'

// status real din backend (opened/ready/closed) → status folosit de UI
// (lucru/finalizat/inchis, vezi tab-urile din VendorPage.vue)
const STATUS_MAP = { opened: 'lucru', ready: 'finalizat', closed: 'inchis' }

// mapează o comandă așa cum vine din POST /v2/app/vendor/get/ (câmp `orders`)
// pe forma consumată de UI — doar comenzile cu type: "online" au `products`
// (restul sunt tranzacții de POS fără listă de produse, gen plată cu cardul
// direct la terminal, fără coș din app)
function mapOrder (raw, prefix) {
  const products = raw.products || []

  return {
    id: `#${prefix}${String(raw.nominal_order_id).padStart(4, '0')}`,
    status: STATUS_MAP[raw.status] || 'lucru',
    items: products.map(p => ({ qty: Number(p.qty), name: p.name })),
    extra: products.flatMap(p => (p.extras || []).map(e => e.name)).join(', ') || null,
    total: Number(raw.subtotal) / 100,
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

    // ----- date mock -----
    products: [
      {
        id: 'p1', name: 'Pizza Margherita', category: 'Pizza', price: 39,
        extraGroups: [
          { title: 'Extra topping', max: 3, options: [
            { name: 'Extra carne', price: 5 },
            { name: 'Extra brânză', price: 5 },
            { name: 'Extra legume', price: 5 },
          ] },
          { title: 'Sosuri', max: 3, options: [
            { name: 'Dulce', price: 5 },
            { name: 'Picant', price: 5 },
          ] },
        ]
      },
      {
        id: 'p2', name: 'Pizza Quattro Formagi', category: 'Pizza', price: 45,
        extraGroups: [
          { title: 'Extra topping', max: 3, options: [
            { name: 'Extra carne', price: 5 },
            { name: 'Extra brânză', price: 5 },
            { name: 'Extra legume', price: 5 },
          ] },
        ]
      },
      {
        id: 'p3', name: 'Pizza Diavola', category: 'Pizza', price: 38,
        extraGroups: [
          { title: 'Extra topping', max: 3, options: [
            { name: 'Extra carne', price: 5 },
            { name: 'Extra brânză', price: 5 },
            { name: 'Extra legume', price: 5 },
          ] },
          { title: 'Sosuri', max: 3, options: [
            { name: 'Dulce', price: 5 },
            { name: 'Picant', price: 5 },
          ] },
        ]
      },
      {
        id: 'p4', name: 'Pizza Prosciutto Funghi', category: 'Pizza', price: 43,
        extraGroups: [
          { title: 'Sosuri', max: 3, options: [
            { name: 'Dulce', price: 5 },
            { name: 'Picant', price: 5 },
          ] },
        ]
      },
      { id: 'd1', name: 'Tiramisu', category: 'Deserturi', price: 18 },
      { id: 'd2', name: 'Panna Cotta', category: 'Deserturi', price: 16 },
      { id: 'b1', name: 'Apă plată 0.5L', category: 'Băuturi', price: 6 },
      { id: 'b2', name: 'Coca-Cola 0.33L', category: 'Băuturi', price: 8 },
    ],

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
      return data
    },

    // Apelat din Callback.vue după succesul plății (Card sau Card Festival),
    // atât pentru value_only: true (cart cu un singur item "Custom amount"),
    // cât și pentru value_only: false (cart cu produse din meniu) — aceeași
    // formă de cart în ambele cazuri, deci un singur punct de salvare.
    // cartItems: [{ name, qty, extras: [{name, price}], lineTotal }]
    async saveOrder (cartItems, paymentMethod) {
      const prefix = this.vendor?.prefix || 'ita'
      const nextNum = this.orders.length
        ? Math.max(...this.orders.map(o => parseInt(o.id.replace(`#${prefix}`, ''), 10))) + 1
        : 401

      const order = {
        id: `#${prefix}${String(nextNum).padStart(4, '0')}`,
        status: 'lucru',
        items: cartItems.map(item => ({ qty: item.qty, name: item.name })),
        extra: cartItems.flatMap(item => item.extras.map(e => e.name)).join(', ') || null,
        total: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
      }
      this.orders.unshift(order)

      const payload = { id: order.id, items: cartItems, total: order.total, paymentMethod }
      console.log('[vendor/orders] payload:', payload)

      const dataStore = useDataStore()
      try {
        const { data } = await dataStore._post(ep.vendorOrderCreate, payload)
        console.log('[vendor/orders] response:', data)
      } catch (e) {
        console.error('[vendor/orders] error:', e?.response?.data || e)
      }

      return order
    }
  }
})
