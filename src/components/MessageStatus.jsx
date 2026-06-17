import { formatTime } from '../utils/formatters'

export const MessageStatus = {
  Sent: 1,
  Seen: 3,
}

export const normalizeStatus = (status) => {
  if (status === MessageStatus.Sent || status === 1 || String(status).toLowerCase() === 'sent') {
    return MessageStatus.Sent
  }

  if (status === MessageStatus.Seen || status === 3 || String(status).toLowerCase() === 'seen') {
    return MessageStatus.Seen
  }

  return MessageStatus.Sent
}

export const renderStatus = (message) => {
  switch (message.status) {
    case MessageStatus.Sent:
      return {
        symbol: '✓',
        className: 'text-black-500',
        title: `Sent ${formatTime(message.sentAtUtc)}`,
      }
    case MessageStatus.Seen:
      return {
        symbol: '✓✓',
        className: 'text-black-400',
        title: `Seen ${formatTime(message.seenAtUtc)}`,
      }
    default:
      return {
        symbol: '',
        className: 'text-slate-500',
        title: '',
      }
  }
}
