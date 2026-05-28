import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

let STORAGE
let hostname

let api

export default defineBoot(({ app, ssrContext }) => {
  api = axios.create(
    {
      baseURL: process.env.NODE_ENV !== 'production' ? "/v2/" : "https://api.tadaa.ro/",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 747424c0f4cb4f6bd645e8ea1347c50c"
      }
    })


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
