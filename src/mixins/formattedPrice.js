export default function _formattedPrice (price) {
  const fixed = (price / 100).toFixed(2)
  const [intreg, zecimale] = fixed.split('.')
  return `${intreg}<sup>${zecimale}</sup> lei`
}
