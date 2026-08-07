import { defineStore } from 'pinia'

export const useVendorStore = defineStore('vendor', {
  state: () => ({
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

    // TODO: no backend endpoint exists yet for debiting a prepaid Card Festival balance
    // for a purchase. ep.chargePrepaidCard (/v2/app/prepaid/charge/) is the TopUp endpoint
    // — it CREDITS the card, it must not be reused here to pay for an order. Wire this up
    // to a real debit endpoint once it's available; per the backend team, that call is
    // expected to respond with the card's new balance, same as charge_prepaid_card does —
    // this stub already mirrors that response shape so the swap-in is a one-line change.
    debitFestivalCard (cardId, amount, currentBalance) {
      const balance = currentBalance - amount
      console.log('Festival card debit confirmed (backend call pending):', { cardId, amount, balance })
      return { balance }
    },

    // TODO: no backend endpoint exists yet for reporting a completed vendor order payment.
    // Wire this up to a real POST (e.g. ep.reportOrderPayment) once it's available.
    reportOrderPayment (order, paymentMethod) {
      console.log('Order payment confirmed (backend call pending):', { order, paymentMethod })
    }
  }
})
