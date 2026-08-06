import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { Cookies, Notify } from 'quasar'
import routes from './routes'
import {pageTransition} from "src/mixins/promiseTransitions.js";
import { useDataStore } from 'stores/data.js'

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

  Router.beforeEach((to) => {
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
      if (to.name !== 'login') return { name: 'login' }
      return
    }

    if (to.name === 'login') return

    if (to.meta.permission) {
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
          }
        })
        .catch(() => {
          if (Router.currentRoute.value.name !== to.name) return

          Router.replace({ name: 'login' })
        })
    }
  })

  return Router
})
