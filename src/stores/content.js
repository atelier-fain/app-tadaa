import { defineStore, acceptHMRUpdate } from 'pinia'
import axios from 'axios'
import { ep } from 'stores/ep.js'

// get_data talks to a different app/domain on the same backend than the
// rest of this project's endpoints (login, checkTicket...), so it gets its
// own Authorization token here instead of reusing `api` from boot/axios.js.
const headers = {
  'Content-Type': 'application/json',
  'Authorization': "Bearer FG.-,thVup'y1XkyEH*QWf:E5bjfR#[#QR[,S+}bsq#YlUyL*-Q]Uj(.gd|Z[Xd7"
}

const dev_headers = {
  'Content-Type': 'application/json',
  'Authorization': "Bearer FG.-,thVup'y1XkyEH*QWf:E5bjfR#[#QR[,S+}bsq#YlUyL*-Q]Uj(.gd|Z[Xd7",
  'DEV-TOKEN': 'JflYIp5gX7cezVhx6wYHIR1XJkilQ5sx57xZH4GmlIV8j9hW8Mo4airUwt8urTqT',
  "DOMAIN": 'app.tadaa.ro'

}

const bileteApi = axios.create({
  baseURL: process.env.NODE_ENV !== 'production' ? '/v2/' : 'https://api.tadaa.ro/',
  headers: process.env.NODE_ENV !== 'production' ? dev_headers : headers
})

export const useContentStore = defineStore('content', {
  state: () => ({
    loading: true,
    content: {
      events: []
    },
  }),

  actions: {
    // One-time cleanup for a checkout bug: every existing customer's stale
    // checkout cookie gets cleared on their next load. The marker cookie
    // guards it so this only ever runs once per browser.


    async set_offer_categories () {
      let category = {
        title: 'Oferte 2 + 1 gratis',
        tickets: [],
        _id: 'offer_event'
      }
      this.content.events.forEach(obj => {
        category.title = obj?.offers_label
        const volume_discounts_key = Object.keys(obj.volume_discounts).reverse()
        volume_discounts_key?.length && volume_discounts_key.forEach(k => {
          obj.volume_discounts[k].forEach(v => {
            category.tickets.push({
              _id: `${k}_min${v?.min}`,
              name: `${v?.title}`,
              caption: `${v?.min} x ${v?.ticket?.name}`,
              price: ((v?.ticket?.price * 1) * (v?.min * 1)) * (1 - ((v?.discount * 1) / 100)),
              ticket_id: k,
              compare_at_price: v?.ticket?.compare_at_price * 1,
              ticket_price: v?.ticket?.price * 1,
              qty: v?.min * 1,
              type: v?.bundle ? 'bundle' : 'offer',
              custom_label: v?.custom_label
            })
          })
        })
        category.tickets.length && obj.ticket_categories.unshift(category)
      })
    },

    async get_data ({ router }) {
      try {
        const { data } = await bileteApi.post(ep.getEvents)
        this.content = data
        await this.set_offer_categories()
      } catch (e) {
        router.push('/404')
      } finally {
        this.loading = false
      }
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useContentStore, import.meta.hot))
}
