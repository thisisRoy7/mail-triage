import React from 'react';

export default function Header({ workerState, onTriggerSync, onTriggerReset, actionType }) {
  const { isRunning, isIngesting, isStalled, stats } = workerState;
  const isBusy = isRunning || isIngesting;

  return React.createElement('header', {
    className: 'h-16 px-6 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-800/60 flex items-center justify-between shrink-0 z-20'
  },
    // Left: Suite Identity & Engine Indicator
    React.createElement('div', { className: 'flex items-center gap-4' },
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('div', {
          className: 'w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-sm tracking-wide'
        }, 'M'),
        React.createElement('div', null,
          React.createElement('div', { className: 'text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-2' },
            'Mail Triage',
            React.createElement('span', { className: 'text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-md border border-zinc-700/50' }, 'PRO')
          ),
          React.createElement('div', { className: 'flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium' },
            React.createElement('span', {
              className: `w-2 h-2 rounded-full transition-all duration-300 ${
                isStalled ? 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse' :
                isBusy ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' : 'bg-zinc-600'
              }`
            }),
            React.createElement('span', null, isBusy ? 'AI Engine Processing' : 'Workspace Ready')
          )
        )
      )
    ),

    // Right: Bento Action Cluster
    React.createElement('div', { className: 'flex items-center gap-3' },
      // Progress Counter
      React.createElement('div', { className: 'hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-300' },
        React.createElement('span', { className: 'text-zinc-500 font-medium' }, 'Triaged'),
        React.createElement('span', { className: 'text-zinc-100 font-semibold' }, `${stats.completed + stats.failed}`),
        React.createElement('span', { className: 'text-zinc-600' }, '/'),
        React.createElement('span', { className: 'text-zinc-400 font-medium' }, stats.total)
      ),

      // Reset Actions
      React.createElement('div', { className: 'flex items-center bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80' },
        React.createElement('button', {
          onClick: () => onTriggerReset('soft'),
          disabled: isBusy,
          className: 'rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-3 py-1.5 disabled:opacity-40 transition-all duration-150 active:scale-95'
        }, actionType === 'soft' ? 'Refreshing...' : 'Soft Refresh'),
        React.createElement('button', {
          onClick: () => onTriggerReset('full'),
          disabled: isBusy,
          className: 'rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-3 py-1.5 disabled:opacity-40 transition-all duration-150 active:scale-95'
        }, actionType === 'full' ? 'Reindexing...' : 'Full Reindex')
      ),

      // Primary Sync Trigger
      React.createElement('button', {
        onClick: onTriggerSync,
        disabled: isBusy,
        className: 'rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 shadow-lg shadow-indigo-600/25 disabled:opacity-40 transition-all duration-200 active:scale-95 flex items-center gap-2'
      },
        React.createElement('svg', {
          className: `w-3.5 h-3.5 ${actionType === 'sync' ? 'animate-spin' : ''}`,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          viewBox: '0 0 24 24'
        },
          React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99' })
        ),
        React.createElement('span', null, actionType === 'sync' ? 'Syncing...' : 'Sync Mailbox')
      )
    )
  );
}