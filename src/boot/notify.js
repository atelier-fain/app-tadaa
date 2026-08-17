import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'

// Notify.create nu are din fabricație o opțiune "click oriunde pe ea ca
// s-o închizi" — doar butoanele din `actions` fac asta implicit. Injectăm
// un handler de click pe `attrs` (spread direct pe elementul rădăcină al
// notificării, vezi sursa Quasar), care apelează funcția de dismiss
// întoarsă de create(). Împachetat o singură dată aici, ca să funcționeze
// pentru toate apelurile Notify.create din aplicație, fără să atingem
// fiecare call site.
export default boot(() => {
  const originalCreate = Notify.create.bind(Notify)

  Notify.create = (opts) => {
    const config = typeof opts === 'string' ? { message: opts } : { ...opts }
    const userOnClick = config.attrs?.onClick
    let dismiss

    config.attrs = {
      ...config.attrs,
      onClick: (e) => {
        userOnClick?.(e)
        dismiss?.()
      }
    }

    dismiss = originalCreate(config)
    return dismiss
  }
})
