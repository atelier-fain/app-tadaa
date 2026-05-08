import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

let STORAGE
let hostname

const api = axios.create({
  baseURL: process.env.DEV
    ? 'http://localhost:9100'
    : process.env.SERVER
      ? 'http://localhost:3001'
      : '',
})

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
