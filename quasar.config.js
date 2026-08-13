import { defineConfig } from '#q-app/wrappers'

export default defineConfig(() => {
  return {
    boot: [
      'axios',
      'image-helper',
      'wake-lock'
    ],
    css: [
      'app.scss'
    ],
    extras: [
      'material-icons',
    ],
    build: {
      // fix la 'dist/spa' indiferent de mod — build-ul de producție rulează
      // acum cu -m pwa (vezi package.json), care implicit ar scoate output-ul
      // în dist/pwa; deploy-ul existent (IDE, FTP) e configurat pe dist/spa,
      // deci ținem folderul neschimbat ca să nu se rupă silențios.
      distDir: 'dist/spa',
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
        '/v2/': {
          target: 'https://api.tadaa.ro/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/v2/, '')
        },
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
      workboxMode: 'InjectManifest',
      // Quasar's default injectPwaMetaTags points several tags (apple-touch-icon
      // variants, ms-icon, safari-pinned-tab.svg) at icons/* files that don't
      // exist in this project — index.html already declares our own real
      // apple-touch-icon. Keep only the tags that don't reference a missing file.
      injectPwaMetaTags: ({ pwaManifest }) => (
        `<meta name="theme-color" content="${pwaManifest.theme_color}">`
        + '<meta name="mobile-web-app-capable" content="yes">'
      )
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
