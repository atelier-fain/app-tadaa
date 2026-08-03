import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { Cookies } from 'quasar'
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

  Router.beforeEach(async (to) => {
    const token = Cookies.get('token')

    if (!token) {
      if (to.name !== 'login') return { name: 'login' }
      return
    }

    if (to.name === 'login') return

    if (to.meta.permission) {
      const dataStore = useDataStore(store)

      let user
      try {
        user = await dataStore.check_token()
      } catch (e) {
        return { name: 'login' }
      }

      if (!user?.[to.meta.permission]) {
        return { name: 'dashboard' }
      }
    }
  })

  return Router
})
