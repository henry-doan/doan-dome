const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const dateOnly = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const timeOnly = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "Just now", "12 minutes ago", "Yesterday", "Today, 9:40 AM", "Mar 3, 2026". */
export const formatWhen = (timestamp, now = Date.now()) => {
  const diff = now - timestamp
  if (diff < MINUTE) return 'Just now'
  if (diff < HOUR) return relative.format(-Math.round(diff / MINUTE), 'minute')
  const date = new Date(timestamp)
  const today = new Date(now)
  if (date.toDateString() === today.toDateString()) return `Today, ${timeOnly.format(date)}`
  if (diff < 2 * DAY && new Date(now - DAY).toDateString() === date.toDateString()) {
    return `Yesterday, ${timeOnly.format(date)}`
  }
  if (diff < 7 * DAY) return relative.format(-Math.round(diff / DAY), 'day')
  return dateOnly.format(date)
}

export const greetingFor = (date = new Date()) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export { MINUTE, HOUR, DAY }
