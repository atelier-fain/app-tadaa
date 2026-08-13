import { startVendorPolling, stopVendorPolling } from 'src/services/vendorPolling.js'

// Switch feature: dacă polling-ul de comenzi noi trebuie oprit rapid (ex.
// încarcă prea mult serverul), se dă POLLING_ENABLED pe false aici — un
// singur loc, fără să atingi router-ul sau vendorPolling.js.
const POLLING_ENABLED = true

// router/index.js e singurul apelant — decide CÂND (intrare/ieșire din
// modulul /vendor), nu și DACĂ (switch-ul de mai sus); asta rămâne izolat
// aici. Gate-ul pe online_orders e verificat AICI, nu doar la router, ca să
// fie garantat indiferent cine cheamă funcția.
export function connectVendorLiveUpdates (onlineOrders) {
  if (!onlineOrders) return
  if (POLLING_ENABLED) startVendorPolling()
}

export function disconnectVendorLiveUpdates () {
  stopVendorPolling()
}
