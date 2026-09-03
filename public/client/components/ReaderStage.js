import React from 'react';
import { getBadgeClass, getBadgeLabel } from '../utils/formatters.js';

export default function ReaderStage({ email, onOpenDrawer }) {
  if (!email) {
    return React.createElement('main', {
      className: 'flex-1 rounded-3xl bg-zinc-900/20 border border-zinc-800/40 flex items-center justify-center text-xs font-medium text-zinc-500'
    }, 'Select an email from the triage queue to inspect details');
  }

  const isPending = email.status === 'PENDING';

  return React.createElement('main', {
    className: 'flex-1 flex flex-col gap-3 overflow-hidden'
  },
    // Top Action Card
    React.createElement('div', {
      className: 'p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between shrink-0 shadow-sm'
    },
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('span', {
          className: `px-2.5 py-1 rounded-xl text-xs font-semibold border ${getBadgeClass(email.urgency)}`
        }, isPending ? 'Processing Queue' : getBadgeLabel(email.urgency)),
        React.createElement('span', { className: 'text-xs text-zinc-400 font-medium' }, email.category || 'General Communication')
      ),
      React.createElement('button', {
        onClick: onOpenDrawer,
        className: 'px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs shadow-sm hover:shadow transition-all duration-200 active:scale-95 flex items-center gap-2'
      },
        React.createElement('svg', { className: 'w-4 h-4 text-zinc-800', fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
          React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10' })
        ),
        React.createElement('span', null, 'Open Draft Canvas')
      )
    ),

    // Scrollable Bento Workspace
    React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-3 pr-1' },
      // Bento 1: Executive AI Synthesis Brief
      React.createElement('div', {
        className: 'p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 border border-indigo-500/25 shadow-sm space-y-2'
      },
        React.createElement('div', { className: 'flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider' },
          React.createElement('svg', { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
          ),
          React.createElement('span', null, 'Executive Briefing')
        ),
        React.createElement('p', { className: 'text-sm leading-relaxed text-zinc-200 font-medium' },
          isPending ? 'Analyzing email context and drafting summary...' : (email.tldr || 'No summary recorded.')
        )
      ),

      // Bento 2: Full Message Canvas
      React.createElement('div', {
        className: 'p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 shadow-sm space-y-4'
      },
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('h1', { className: 'text-base font-bold text-zinc-100 tracking-tight' }, email.subject),
          React.createElement('div', { className: 'flex items-center gap-2 text-xs text-zinc-400 font-medium' },
            React.createElement('span', { className: 'text-zinc-200' }, email.sender),
            React.createElement('span', { className: 'text-zinc-600' }, '•'),
            React.createElement('span', null, new Date(email.date).toLocaleString())
          )
        ),
        React.createElement('div', {
          className: 'pt-4 border-t border-zinc-800/60 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap selection:bg-indigo-500/30'
        }, email.body)
      )
    )
  );
}