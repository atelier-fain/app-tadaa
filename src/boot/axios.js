import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { api } from 'src/services/api.js'

let STORAGE
let hostname

export default defineBoot(({ app, ssrContext }) => {
  hostname =
    process.env.SERVER
      ? ssrContext.req.headers.host
      : window.location.hostname

  STORAGE =
    process.env.NODE_ENV === 'production'
      ? 'https://cockpit.gmg.grapeminds.ro'
      : '/storage'

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, STORAGE, hostname }
