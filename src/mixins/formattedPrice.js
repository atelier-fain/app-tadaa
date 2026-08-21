export default function _formattedPrice (price) {
  const fixed = (price / 100).toFixed(2)
  const [intreg, zecimale] = fixed.split('.')
  return `${intreg}<sup>${zecimale}</sup> lei`
}

// convertește o valoare în lei (float) în bani întregi (ex: 16.99 -> 1699),
// pentru payload-uri/query-uri către backend/Viva. Nu folosi direct `value *
// 100` — virgula mobilă poate da 1698.9999999999998 pentru 16.99.
export function toCents (value) {
  return Math.round(value * 100)
}
