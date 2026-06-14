const conversations = [
  { id: 1, name: 'Design Team', unread: 3, preview: 'New mockups are ready.' },
  { id: 2, name: 'Product', unread: 0, preview: 'Roadmap review starts at 2 PM.' },
  { id: 3, name: 'Marketing', unread: 1, preview: 'Campaign assets were shared.' },
]

const messages = [
  { id: 1, author: 'Design Team', text: 'The new chat layout is looking sharp.', time: '09:41' },
  { id: 2, author: 'You', text: 'Perfect. I will wire the remaining state next.', time: '09:43' },
  { id: 3, author: 'Design Team', text: 'Sounds good. Let’s keep the experience lightweight.', time: '09:45' },
]

function HomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/30">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Workspace</p>
            <h2 className="text-xl font-semibold text-white">Conversations</h2>
          </div>
          <button className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-medium text-cyan-300">
            New
          </button>
        </div>

        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-800/80 px-3 py-3 text-left transition hover:bg-slate-800"
            >
              <div>
                <p className="font-medium text-white">{conversation.name}</p>
                <p className="mt-1 text-sm text-slate-400">{conversation.preview}</p>
              </div>
              {conversation.unread > 0 ? (
                <span className="rounded-full bg-cyan-500 px-2 py-1 text-xs font-semibold text-slate-950">
                  {conversation.unread}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-h-[560px] flex-col rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/30">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-sm text-slate-400">Active room</p>
            <h3 className="text-lg font-semibold text-white">Design Team</h3>
          </div>
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            Online
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-auto px-6 py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.author === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${message.author === 'You' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                <p className="text-sm font-medium">{message.author}</p>
                <p className="mt-1 text-sm">{message.text}</p>
                <p className={`mt-2 text-[11px] ${message.author === 'You' ? 'text-slate-800/80' : 'text-slate-400'}`}>
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 px-6 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3">
            <input
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none"
              placeholder="Type a message"
            />
            <button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage
