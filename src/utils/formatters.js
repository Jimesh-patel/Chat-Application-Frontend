export const formatDisplayName = (user) => user?.displayName || user?.username || user?.email || 'Unknown user'

export const formatTime = (value) => {
  if (!value) {
    return ''
  }

  try {
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}
