import { defineConfig } from '#q-app/wrappers'

export default defineConfig(() => {
  return {
    boot: [
      'axios',
      'image-helper'
    ],
    css: [
      'app.scss'
    ],
    extras: [
      'material-icons',
    ],
    build: {
      env: {
        BUILD_VERSION: Date.now()
      },
      target: {
        browser: [ 'es2022', 'firefox115', 'chrome115', 'safari14' ],
        node: 'node20'
      },
      vueRouterMode: 'history',
    },
    devServer: {
      open: true,
      proxy: {
        '/storage/': {
          target: 'https://cockpit.gmg.grapeminds.ro/storage/uploads',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/storage/, '')
        },
      }
    },
    framework: {
      config: {},
      plugins: ['Notify']
    },
    // animations: 'all', // --- includes all animations
    animations: ['fadeIn', 'fadeOut', 'swing'],
    ssr: {
      prodPort: 3000,
      middlewares: [
        'render'
      ],
      pwa: false
    },
    pwa: {
      workboxMode: 'InjectManifest'
    },
    cordova: {
    },
    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      preloadScripts: [ 'electron-preload' ],
      inspectPort: 5858,
      bundler: 'packager',
      packager: {
      },
      builder: {
        appId: 'dev-tadaa'
      }
    },
    bex: {
      extraScripts: []
    }
  }
})
