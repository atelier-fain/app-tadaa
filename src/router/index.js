import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { Cookies, Notify } from 'quasar'
import routes from './routes'
import {pageTransition} from "src/mixins/promiseTransitions.js";
import { useDataStore } from 'stores/data.js'
import { useVendorStore } from 'stores/vendor.js'

// rutele modulului Vendor — navigarea între ele nu trebuie să re-declanșeze
// fetchVendor() (vezi guard-ul de mai jos)
const vendorModuleRoutes = ['vendor', 'vendor-settings', 'vendor-new-order']

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = new createRouter({
    scrollBehavior: async (to, from, savedPosition) => {
      await pageTransition();
      return {left: 0, top: 0};
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Viva Payments redirects back with a real page load to /modules/tickets/callback/?...
  // Since the app uses hash routing, that path is never seen by the router (only the
  // part after '#' is). Catch it once, on the very first navigation, and hand the
  // query params over to the 'tickets-callback' route.
  let handledExternalCallback = false

  // Once check_token confirms the user holds a given permission, skip
  // re-checking it on subsequent navigations within the same permission
  // group (e.g. vendor -> vendor-new-order -> vendor) — it was already
  // verified this session and re-hitting the endpoint on every hop is wasteful.
  let verifiedPermission = null

  Router.beforeEach((to, from) => {
    if (!handledExternalCallback) {
      handledExternalCallback = true
      if (!process.env.SERVER && window.location.pathname.includes('/callback')) {
        return {
          name: 'tickets-callback',
          query: Object.fromEntries(new URLSearchParams(window.location.search))
        }
      }
    }

    const token = Cookies.get('token')

    if (!token) {
      verifiedPermission = null
      if (to.name !== 'login') return { name: 'login' }
      return
    }

    if (to.name === 'login') return
  })

  // Efecte secundare (verificare permisiune + fetch de date) puse în
  // afterEach, nu beforeEach — navigarea rămâne instantă, pagina se
  // afișează imediat (cu loading state-ul ei propriu) fără să aștepte
  // niciun răspuns de la server; redirect-urile de mai jos (dashboard/login)
  // se întâmplă oricum async, la fel ca înainte.
  Router.afterEach((to, from) => {
    if (to.meta.permission && to.meta.permission !== verifiedPermission) {
      const dataStore = useDataStore(store)

      dataStore.check_token()
        .then((user) => {
          if (Router.currentRoute.value.name !== to.name) return

          if (!user?.[to.meta.permission]) {
            Notify.create({
              type: 'negative',
              message: "You don't have permission to access this module",
              position: 'top',
            })
            Router.replace({ name: 'dashboard' })
            return
          }

          verifiedPermission = to.meta.permission
        })
        .catch(() => {
          if (Router.currentRoute.value.name !== to.name) return

          Router.replace({ name: 'login' })
        })
    }

    // fetchVendor() doar la intrarea pe VendorPage din afara modulului Vendor
    // (alt modul sau navigare externă) — trecerea între vendor/vendor-new-order/
    // vendor-settings nu trebuie să reia apelul (vezi VendorPage.vue).
    if (to.name === 'vendor' && !vendorModuleRoutes.includes(from.name)) {
      useVendorStore(store).fetchVendor()
        .catch((e) => console.error('[vendor/get] error:', e?.response?.data || e))
    }
  })

  return Router
})
