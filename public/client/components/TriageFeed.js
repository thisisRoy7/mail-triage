import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDate, getBadgeClass, getBadgeLabel } from '../utils/formatters.js';

export default function TriageFeed({ emails, selectedId, onSelectEmail, onRefresh }) {
  return React.createElement('section', {
    className: 'h-full flex flex-col glass-panel rounded-3xl p-3 min-h-0 overflow-hidden'
  },
    // Header
    React.createElement('div', {
      className: 'px-3 py-2 flex items-center justify-between shrink-0 mb-1'
    },
      React.createElement('span', { className: 'text-[11px] font-semibold tracking-wider text-zinc-500 uppercase' }, 'Queue'),
      React.createElement('button', {
        onClick: onRefresh,
        title: 'Refresh Inbox',
        className: 'p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all'
      },
        React.createElement(RefreshCw, { className: 'w-3.5 h-3.5' })
      )
    ),

    // High-Density Card Stack
    React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-1.5 pr-1' },
      emails.length === 0
        ? React.createElement('div', {
            className: 'p-8 text-center text-xs text-zinc-500 rounded-2xl border border-dashed border-zinc-800/80'
          }, 'Inbox zero')
        : emails.map((mail) => {
            const isSelected = selectedId === mail.id;
            const isPending = mail.status === 'PENDING';
            const cleanSender = mail.sender.replace(/["'<].*?[>"]/g, '').trim() || mail.sender;

            return React.createElement('div', {
              key: mail.id,
              onClick: () => onSelectEmail(mail.id),
              className: `px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-150 border text-left flex flex-col justify-center ${
                isSelected
                  ? 'bg-zinc-800/80 border-indigo-500/50 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500/20'
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5'
              }`
            },
              // Top Row: Sender + Timestamp + Badge
              React.createElement('div', { className: 'flex items-center justify-between gap-2 leading-none mb-1' },
                React.createElement('div', { className: 'flex items-center gap-2 min-w-0' },
                  React.createElement('span', {
                    className: `w-1.5 h-1.5 rounded-full shrink-0 ${
                      mail.urgency === 'HIGH' ? 'bg-rose-400' :
                      mail.urgency === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`
                  }),
                  React.createElement('span', { className: 'text-xs font-semibold text-zinc-200 truncate' }, cleanSender)
                ),
                React.createElement('span', { className: 'text-[10px] text-zinc-500 shrink-0 font-medium' },
                  formatDate(mail.date)
                )
              ),

              // Bottom Row: Subject & Snippet Inline (Gmail style)
              React.createElement('div', { className: 'flex items-center text-xs gap-1.5 truncate leading-tight' },
                React.createElement('span', { className: 'text-zinc-300 font-medium truncate shrink-0 max-w-[55%]' }, mail.subject),
                React.createElement('span', { className: 'text-zinc-600 shrink-0' }, '—'),
                React.createElement('span', { className: 'text-zinc-500 truncate text-[11px]' },
                  isPending ? 'Synthesizing overview...' : (mail.tldr || mail.body)
                )
              )
            );
          })
    )
  );
}