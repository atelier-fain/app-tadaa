import { defineStore, acceptHMRUpdate } from 'pinia'
import {api} from "boot/axios.js";
import {ep} from "stores/ep.js";
import { Cookies } from 'quasar'
import {nextTick} from "vue";

export const useDataStore = defineStore('data', {
  state: () => ({
    isFetching: null,
    vendor: null
  }),

  getters: {

  },

  actions: {
    async check_ticket (scannedValue) {
      try {
        const { data } = await api.post('/php/check_ticket.php', { code: scannedValue })
        return data

      } catch (e) {

      }
    },

    async pay_cash (payload, onSuccess) {
      this.isFetching = 'pay_cash'
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log(payload)
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
        await new Promise(resolve => setTimeout(resolve, 1000))
        const response = {
          "checkout_url": "https://www.vivapayments.com/web/checkout?ref=6576785459559594",
          "discount_100": false,
          "_id": "1a1a82343235306344000386"
        }

        await nextTick(() => {
          console.log('redirect to', ' ', 'VIVA PAY URL')
          // window.open(response?.checkout_url, '_self')
        })


      } catch (e) {

      }
      finally {
        this.isFetching = null
      }
    },

    async checkUser () {
      const token = Cookies.get('token')
      // const { data } = await api.post(ep.checkUser, { token })
      const data = {
        vendor: 'Acme Corp'
      }
      this.vendor = data.vendor
    },

    logout () {
      Cookies.remove('token', { path: '/' })
      this.vendor = null
      this.router.push({ name: 'login' })
    },

    async login ({user, password}) {
      this.isFetching = 'login'
      try {
        // const { data } = api.post(ep.login, {
        //    user,
        //    password
        // })
        await new Promise(resolve => setTimeout(resolve, 1000))
        const data = {
          token: 'mock-token-abc123',
          vendor: 'Acme Corp',
          user
        }
        Cookies.set('token', data.token, { path: '/' })
        this.vendor = data.vendor
        this.router.push({name: 'dashboard'})
      } catch (e) {

      } finally {
        this.isFetching = null
      }
    }

  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot))
}
