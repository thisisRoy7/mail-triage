import React from 'react';

export default function NavSidebar({ currentFilter, onSelectFilter, counts, workerState }) {
  const tabs = [
    { key: 'ALL', label: 'All Mail', desc: 'Unified incoming stream' },
    { key: 'HIGH', label: 'Action Required', desc: 'Urgent & direct decisions' },
    { key: 'MEDIUM', label: 'Review & FYI', desc: 'Confirmations & updates' },
    { key: 'LOW', label: 'Low Priority', desc: 'Newsletters & marketing' }
  ];

  return React.createElement('aside', {
    className: 'w-64 p-3 flex flex-col justify-between shrink-0'
  },
    // Upper Bento Cluster: Filter Workspace Cards
    React.createElement('div', { className: 'space-y-3' },
      React.createElement('div', { className: 'text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-3' },
        'Workspaces'
      ),
      React.createElement('nav', { className: 'space-y-1.5' },
        tabs.map((tab) => {
          const isActive = currentFilter === tab.key;
          return React.createElement('button', {
            key: tab.key,
            onClick: () => onSelectFilter(tab.key),
            className: `w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-200 ${
              isActive
                ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-md shadow-zinc-950/40 ring-1 ring-zinc-700/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800/40'
            }`
          },
            React.createElement('div', null,
              React.createElement('div', { className: 'text-xs font-semibold' }, tab.label),
              React.createElement('div', { className: 'text-[10px] text-zinc-500 font-medium' }, tab.desc)
            ),
            React.createElement('span', {
              className: `text-xs px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
                isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800/80 text-zinc-400'
              }`
            }, counts[tab.key] || 0)
          );
        })
      )
    ),

    // Bottom Bento Cluster: Pipeline Diagnostics Card
    React.createElement('div', {
      className: 'p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-3'
    },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('span', { className: 'text-[11px] font-semibold text-zinc-400' }, 'Pipeline Status'),
        React.createElement('span', { className: 'text-xs font-bold text-indigo-400' }, `${workerState.progressPct || 0}%`)
      ),
      React.createElement('div', { className: 'w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden' },
        React.createElement('div', {
          className: 'h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full',
          style: { width: `${workerState.progressPct || 0}%` }
        })
      ),
      React.createElement('p', { className: 'text-[11px] text-zinc-400 truncate leading-relaxed' },
        workerState.currentEmail
          ? `${workerState.currentEmail.sender}: ${workerState.currentEmail.subject}`
          : (workerState.isRunning ? 'Analyzing queue items...' : 'Queue idle')
      )
    )
  );
}