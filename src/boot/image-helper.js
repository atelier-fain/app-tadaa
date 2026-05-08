// src/boot/image-helper.js
import { boot } from 'quasar/wrappers'

const BUILD_VERSION = process.env.BUILD_VERSION

export default boot(({ app }) => {
  app.config.globalProperties.$img = (path) => {
    return `/imgs/${path}?v=${BUILD_VERSION}`
  }
})

export { BUILD_VERSION }
