export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = String(d.getDate()).padStart(2, '0')
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function maskAccountNumber(num) {
  if (!num) return '**** **** **** ****'
  const str = String(num)
  if (str.length <= 4) return str.padStart(16, '*')
  const last4 = str.slice(-4)
  return `**** **** ${last4}`
}

export function getInitials(name) {
  if (!name) return ''
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
