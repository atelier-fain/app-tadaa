import { boot } from 'quasar/wrappers'

// Screen Wake Lock API — ține ecranul aprins cât timp aplicația e deschisă
// (vendorul stă cu telefonul/tableta pe tejghea, nu vrem să se blocheze
// între comenzi). Fără suport (Safari/iOS vechi) sau fără permisiune, cade
// silențios — aplicația funcționează normal, doar fără keep-awake.
let wakeLock = null

async function requestWakeLock () {
  if (!('wakeLock' in navigator)) return
  if (document.visibilityState !== 'visible') return

  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => {
      wakeLock = null
    })
  } catch (e) {
    // ex. NotAllowedError (tab în background la momentul cererii) — se
    // reîncearcă oricum la următorul visibilitychange
  }
}

export default boot(() => {
  if (process.env.SERVER) return

  requestWakeLock()

  // wake lock-ul se eliberează automat de browser la minimizare/schimbare
  // de tab — trebuie recerut explicit când userul revine în aplicație
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !wakeLock) {
      requestWakeLock()
    }
  })
})
