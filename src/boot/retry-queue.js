import { defineBoot } from '#q-app/wrappers'
import { initRetryQueue } from 'src/services/retryQueue.js'

// pornește coada de retry pentru update-uri DB eșuate (vezi
// src/services/retryQueue.js) o singură dată, la lansarea aplicației — nu
// doar pe /callback, ca reîncercările să continue în fundal indiferent pe ce
// pagină ajunge userul între timp
export default defineBoot(({ store }) => {
  if (process.env.SERVER) return

  initRetryQueue(store)
})
