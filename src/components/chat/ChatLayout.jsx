import React from 'react'

export function ChatLayout({ sidebar, chatArea, isChatActive }) {
  return (
    <section className="relative flex h-[calc(100dvh-5rem)] w-full overflow-hidden rounded-[2rem] border border-violet-500/20 bg-slate-900/80 shadow-[0_25px_120px_-40px_rgba(124,58,237,0.4)]">
      
      {/* Sidebar Section */}
      <aside 
        className={`absolute inset-y-0 left-0 z-10 w-full flex-col border-r border-violet-500/10 bg-slate-950/70 transition-transform duration-300 lg:static lg:flex lg:w-[360px] lg:translate-x-0 ${
          isChatActive ? '-translate-x-full' : 'translate-x-0 flex'
        }`}
      >
        {sidebar}
      </aside>

      {/* Chat Area Section */}
      <div 
        className={`absolute inset-y-0 left-0 flex w-full flex-1 flex-col bg-slate-950/60 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isChatActive ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {chatArea}
      </div>
      
    </section>
  )
}
