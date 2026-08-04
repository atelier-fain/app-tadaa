import { defineStore, acceptHMRUpdate } from 'pinia'
import {api} from "boot/axios.js";
import {ep} from "stores/ep.js";
import { Cookies } from 'quasar'
import {nextTick} from "vue";

export const useDataStore = defineStore('data', {
  state: () => ({
    isFetching: null,
    vendor: null,
    token: Cookies.get('token') || null,
    user: Cookies.get('user') || null,
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
        const ISVamount = 0;
        const vivaUrl = "vivapayclient://pay/v1" +
          "?appId=org.chromium.webpack.abe660f465bd92ffd_v2" +          // Replace with your app's package name
          "&action=sale" +                      // Action like sale, refund, activatePos
          "&amount="+ payload?.amount +                     // Amount in cents (e.g., 10000 = 100.00 RON)
          "&sourceCode=5428 " +
          "&callback=https://atelier-fain.github.io/app-tadaa/" +
          "&ISV_amount="+ ISVamount +
          "&ISV_clientId=36d0ak0fs34pp7ptont4wso291bmzydpuc8mqsd7ydf76.apps.vivapayments.com" +
          "&ISV_clientSecret=ZdJTeAoE25V7Y8F5P6T5n67Cef8yHH" +
          "&ISV_sourceCode=3654 " +
          "&ISV_currencyCode=946" +
          "&ISV_customerTrns=BigLittleFestival" +
          "&clientTransactionId="+payload?.user +
          "&paymentMethod=CardPresent";     // Custom URI scheme for result callback
        console.log(vivaUrl);
        // window.location.href = vivaUrl;

        await nextTick(() => {
          console.log('redirect to', ' ', 'VIVA PAY URL')
          window.open(vivaUrl, '_self')
        })


      } catch (e) {

      }
      finally {
        this.isFetching = null
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
