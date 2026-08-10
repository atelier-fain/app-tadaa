import { defineStore } from 'pinia'
import { api } from 'boot/axios.js'
import { ep } from 'stores/ep.js'
import { useDataStore } from 'stores/data.js'

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    // ----- date mock -----
    // profil vendor — populat de fetchVendor() la intrarea pe VendorPage
    // (POST /v2/app/vendor/get/, vezi docs/vendor-api-requirements.md #1).
    // value_only: true = vendor fără meniu/produse, ia doar plăți cu sumă
    // custom (fără tab-uri In progress/Completed/Closed).
    // online_orders: true = butonul de Settings apare pe /vendor.
    vendor: null,
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
    // cartItems: [{ name, qty, extras: [{name, price}], lineTotal }]
    addOrder (cartItems) {
      const nextNum = this.orders.length
        ? Math.max(...this.orders.map(o => parseInt(o.id.replace('#ita', ''), 10))) + 1
        : 401

      const order = {
        id: `#ita${String(nextNum).padStart(4, '0')}`,
        status: 'lucru',
        items: cartItems.map(item => ({ qty: item.qty, name: item.name })),
        extra: cartItems.flatMap(item => item.extras.map(e => e.name)).join(', ') || null,
        total: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
      }

      this.orders.unshift(order)
      return order
    },

    // TODO: no backend endpoint exists yet for reporting a completed vendor order payment.
    // Wire this up to a real POST (e.g. ep.reportOrderPayment) once it's available.
    reportOrderPayment (order, paymentMethod) {
      console.log('Order payment confirmed (backend call pending):', { order, paymentMethod })
    },

    // POST /v2/app/vendor/get/ — profil vendor curent (identificat din token).
    async fetchVendor () {
      const dataStore = useDataStore()
      const { data } = await api.post(ep.vendorGet, { token: dataStore.token })
      this.vendor = data
      return data
    }
  }
})
