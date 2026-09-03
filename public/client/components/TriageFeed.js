import React from 'react';
import { formatDate, getBadgeClass, getBadgeLabel } from '../utils/formatters.js';

export default function TriageFeed({ emails, selectedId, onSelectEmail, onRefresh }) {
  return React.createElement('section', {
    className: 'w-[390px] flex flex-col shrink-0 overflow-hidden'
  },
    // Header Bar
    React.createElement('div', {
      className: 'px-3 py-2 flex items-center justify-between shrink-0 mb-2'
    },
      React.createElement('span', { className: 'text-xs font-bold uppercase tracking-wider text-zinc-400' }, 'Triage Queue'),
      React.createElement('button', {
        onClick: onRefresh,
        className: 'p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all border border-zinc-800/80 shadow-sm active:scale-95'
      },
        React.createElement('svg', { className: 'w-3.5 h-3.5', fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
          React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99' })
        )
      )
    ),

    // Card Stack
    React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-2 pr-1' },
      emails.length === 0
        ? React.createElement('div', {
            className: 'p-8 text-center text-xs text-zinc-500 rounded-2xl border border-dashed border-zinc-800'
          }, 'No emails found in this workspace')
        : emails.map((mail) => {
            const isSelected = selectedId === mail.id;
            const isPending = mail.status === 'PENDING';

            return React.createElement('div', {
              key: mail.id,
              onClick: () => onSelectEmail(mail.id),
              className: `group p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? 'bg-zinc-900 border-indigo-500/60 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30 -translate-y-0.5'
                  : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/80'
              }`
            },
              React.createElement('div', { className: 'flex items-center justify-between gap-2 mb-1.5' },
                React.createElement('span', { className: 'text-xs font-semibold text-zinc-200 truncate max-w-[200px]' }, mail.sender),
                React.createElement('span', { className: 'text-[11px] text-zinc-500 font-medium' }, formatDate(mail.date))
              ),
              React.createElement('div', { className: 'text-xs font-semibold text-zinc-100 truncate mb-1.5' }, mail.subject),
              React.createElement('p', { className: 'text-xs text-zinc-400 line-clamp-2 leading-relaxed' },
                isPending
                  ? React.createElement('span', { className: 'italic text-indigo-400 font-medium' }, 'Synthesizing overview...')
                  : (mail.tldr || 'No summary available.')
              ),
              React.createElement('div', { className: 'mt-3 flex items-center justify-between pt-2.5 border-t border-zinc-800/50' },
                React.createElement('span', {
                  className: `text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeClass(mail.urgency)}`
                }, isPending ? 'Processing' : getBadgeLabel(mail.urgency)),
                React.createElement('span', { className: 'text-[10px] text-zinc-500 font-semibold uppercase tracking-wider' }, mail.category || 'General')
              )
            );
          })
    )
  );
}