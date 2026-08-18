export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0'
  const num = Number(amount)
  if (isNaN(num)) return '₹0'
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
