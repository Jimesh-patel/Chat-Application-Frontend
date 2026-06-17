import { formatTime } from '../utils/formatters'
import { renderStatus } from './MessageStatus'

export function MessageItem({ message, isMine }) {
  const statusInfo = renderStatus(message)

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        data-message-id={message.messageId}
        className={`message-item max-w-[82%] rounded-[1.25rem] px-4 py-3 shadow-lg ${
          isMine ? 'bg-sky-400 text-slate-950' : 'bg-slate-900/90 text-slate-100'
        }`}
      >
        <p className="mt-1 text-sm leading-6">{message.content}</p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className={isMine ? 'text-slate-800/80' : 'text-slate-400'}>{formatTime(message.sentAtUtc)}</span>
          {isMine ? (
            <span className={`ml-3 ${statusInfo.className}`} title={statusInfo.title}>
              {statusInfo.symbol}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
