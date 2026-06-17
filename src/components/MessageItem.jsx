import { formatTime } from '../utils/formatters'
import { renderStatus } from './MessageStatus'

export function MessageItem({ message, isMine }) {
  const statusInfo = renderStatus(message)

  return (
    <div className={`flex w-full mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        data-message-id={message.messageId}
        className={`message-item relative max-w-[85%] sm:max-w-[75%] px-3.5 py-2 shadow-sm ${
          isMine 
            ? 'bg-violet-500 text-white rounded-2xl rounded-tr-sm' 
            : 'bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm border border-violet-500/10'
        }`}
      >
        <p className="text-[15px] leading-relaxed break-words">{message.content}</p>
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] font-medium opacity-80">
          <span>{formatTime(message.sentAtUtc)}</span>
          {isMine ? (
            <span className={statusInfo.className} title={statusInfo.title}>
              {statusInfo.symbol}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
