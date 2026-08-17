import { Cookies } from 'quasar'

const dev = true

// de reactivat dacă mai apar probleme de tipul RESELLER_ORDER_DECLINED —
// controlează atât salvarea cookie-ului de debug de aici, cât și afișarea
// lui în Callback.vue
export const SHOW_VIVA_DEBUG = false

// ISV_merchantSourceCode / ISV_sourceCode diferă per sursă (tickets/vendor/topup) —
// vezi payload.source trimis de TicketsPage/VendorPaymentModal/TopUpPage
const bySource = {
  tickets: {
    ISV_merchantSourceCode: dev ? process.env.DEV__ISVMerchantSourceCode_Tickets : process.env.ISVMerchantSourceCode_Tickets,
    ISV_sourceCode: dev ? process.env.DEV__ISVSourceCode_Tickets : process.env.ISVSourceCode_Tickets
  },
  vendor: {
    ISV_merchantSourceCode: dev ? process.env.DEV__ISVMerchantSourceCode_Vendors : process.env.ISVMerchantSourceCode_Vendors,
    ISV_sourceCode: dev ? process.env.DEV__ISVSourceCode_Vendors : process.env.ISVSourceCode_Vendors
  },
  topup: {
    ISV_merchantSourceCode: dev ? process.env.DEV__ISVMerchantSourceCode_Topup : process.env.ISVMerchantSourceCode_Topup,
    ISV_sourceCode: dev ? process.env.DEV__ISVSourceCode_Topup : process.env.ISVSourceCode_Topup
  }
}

const config = {
  appId: 'org.chromium.webpack.abe660f465bd92ffd_v2',
  callback: 'https://dev.tadaa.ro/callback',
  ISV_amount: 0,
  ISV_clientId: dev ? process.env.DEV__ISVClientID : process.env.ISVClientID,
  ISV_clientSecret: dev ? process.env.DEV__ISVClientSecret : process.env.ISVClientSecret,
  ISV_merchantId: dev ? process.env.DEV__ISVMerchantID : process.env.ISVMerchantID,
  ISV_currencyCode: '946',
  ISV_customerTrns: 'BigLittleFestival 2026',
  // default pentru toate fluxurile (tickets/topup/vendor) — payload.paymentMethod
  // poate suprascrie per apel dacă vreun flux are nevoie de altă valoare
  paymentMethod: 'CARD_PRESENT'
}

export function buildVivaPayUrl (payload = {}) {
  const source = bySource[payload.source] || {}

  const params = {
    appId: config.appId,
    action: 'sale',
    amount: payload?.totalPrice,
    callback: config.callback,
    ISV_amount: payload?.totalPrice * config.ISV_amount / 100,
    ISV_clientId: config.ISV_clientId,
    ISV_clientSecret: config.ISV_clientSecret,
    ISV_merchantId: config.ISV_merchantId,
    ISV_merchantSourceCode: source.ISV_merchantSourceCode,
    ISV_sourceCode: source.ISV_sourceCode,
    ISV_currencyCode: config.ISV_currencyCode,
    ISV_customerTrns: config.ISV_customerTrns,
    ISV_clientTransactionId: payload.user,
    paymentMethod: payload.paymentMethod || config.paymentMethod
  }

  // debug — supraviețuiește round-trip-ul prin Viva (cookie, nu sessionStorage),
  // citit în /callback ca să se vadă ce s-a trimis vs ce s-a primit înapoi
  if (SHOW_VIVA_DEBUG) {
    Cookies.set('vivaDebugRequest', params, { path: '/', expires: 1 })
  }

  return 'vivapayclient://pay/v1?' + Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
}
