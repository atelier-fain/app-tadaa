import { defineStore, acceptHMRUpdate } from 'pinia'
import {api} from "boot/axios.js";
import {ep} from "stores/ep.js";
import { Cookies } from 'quasar'
import {nextTick} from "vue";
import {buildVivaPayUrl} from "stores/viva-pay.js";

export const useDataStore = defineStore('data', {
  state: () => ({
    isFetching: null,
    vendor: null,
    token: Cookies.get('token') || null,
    user: Cookies.get('user') || null,
    pendingOrder: Cookies.get('pendingOrder') || null,
  }),

  getters: {

  },

  actions: {
    _post (endpoint, body = {}) {
      return api.post(endpoint, {
        ...body,
        token: this.token })
    },

    async check_token () {
      const { data } = await this._post(ep.checkToken)
      this.user = data.user
      Cookies.set('user', data.user, { path: '/', expires: 5 })
      return data.user
    },

    async check_ticket (scannedValue) {
      try {
        const { data } = await this._post(ep.checkTicket, {
          code: scannedValue
        })
        return data

      } catch (e) {
        return e
      }
    },

    async pay_cash (payload, onSuccess = null) {
      this.isFetching = 'pay_cash'
      try {
        if (payload.source === 'tickets') {
          const transactionId = crypto.randomUUID()
          this.pendingOrder = {
            source: payload.source,
            tickets: payload.tickets || [],
            transactionId,
            shortOrderCode: transactionId.slice(0, 8).toUpperCase()
          }
          Cookies.set('pendingOrder', this.pendingOrder, { path: '/', expires: 1 })

          await this.buy_tickets('cash')
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        if (onSuccess) {
          onSuccess()
        } else {
          this.router.push({ name: 'tickets' })
        }
      } catch (e) {

      }
      finally {
        this.isFetching = null
      }
    },

    async pay_card (payload) {
      this.isFetching = 'pay_card'
      try {
        // payload.source is only set on the initial call from TicketsPage/TopUpPage; a
        // retry from Callback.vue omits it and reuses the pendingOrder from the failed attempt.
        if (payload.source) {
          const transactionId = crypto.randomUUID()
          this.pendingOrder = {
            source: payload.source,
            tickets: payload.tickets || [],
            transactionId,
            shortOrderCode: transactionId.slice(0, 8).toUpperCase()
          }
          Cookies.set('pendingOrder', this.pendingOrder, { path: '/', expires: 1 })
        }

        const vivaUrl = buildVivaPayUrl(payload)
        window.location.href = vivaUrl;

        await nextTick(() => {
          window.open(vivaUrl, '_self')
        })


      } catch (e) {

      }
      finally {
        this.isFetching = null
      }
    },

    async buy_tickets (method = 'card') {
      if (!this.pendingOrder) return

      const { tickets, transactionId, shortOrderCode } = this.pendingOrder

      try {
        const { data } = await this._post(ep.buyTickets, {
          tickets,
          method,
          transactionId,
          shortOrderCode
        })

        this.pendingOrder = null
        Cookies.remove('pendingOrder', { path: '/' })

        return data
      } catch (e) {
        console.error('buy_tickets failed', e)
      }
    },

    logout () {
      Cookies.remove('token', { path: '/' })
      this.vendor = null
      this.router.push({ name: 'login' })
    },

    async login ({user, password}) {
      this.isFetching = 'login'
      try {
        const { data } = await api.post(ep.login, {
           user,
           password
        })

        if (!data?.token) {
          throw new Error(data?.error || 'Autentificare eșuată: răspuns invalid de la server')
        }

        this.token = data.token
        this.user = data.user

        Cookies.set('token', data.token, { path: '/', expires: 5 })
        Cookies.set('user', data.user, { path: '/', expires: 5 })

        this.router.push({name: 'dashboard'})

      } catch (e) {
        throw e
      } finally {
        await nextTick(() => {
          this.isFetching = null
        })
      }
    }

  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot))
}
