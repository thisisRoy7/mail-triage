import React from 'react';
import { Mail, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function NavSidebar({ currentFilter, onSelectFilter, counts, workerState }) {
  const tabs = [
    { 
      key: 'ALL', 
      label: 'All Mail', 
      icon: Mail, 
      color: 'text-zinc-400',
      activeColor: 'text-zinc-200',
      badgeClass: 'bg-zinc-800/60 text-zinc-400'
    },
    { 
      key: 'HIGH', 
      label: 'High', 
      icon: AlertCircle, 
      color: 'text-rose-400',
      activeColor: 'text-rose-400',
      badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    },
    { 
      key: 'MEDIUM', 
      label: 'Medium', 
      icon: Clock, 
      color: 'text-amber-400',
      activeColor: 'text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    },
    { 
      key: 'LOW', 
      label: 'Low', 
      icon: CheckCircle2, 
      color: 'text-emerald-400',
      activeColor: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  ];

  const pct = Math.min(100, Math.max(0, workerState.progressPct || 0));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const total = workerState.stats?.total || 0;
  const processed = (workerState.stats?.completed || 0) + (workerState.stats?.failed || 0);

  return React.createElement('aside', {
    className: 'h-full flex flex-col gap-3 min-h-0'
  },
    // Top Bento: Donut Meter Card
    React.createElement('div', {
      className: 'glass-panel rounded-3xl p-4 flex items-center gap-4 shrink-0'
    },
      React.createElement('div', { className: 'relative w-20 h-20 shrink-0 flex items-center justify-center' },
        React.createElement('svg', { className: 'w-full h-full -rotate-90', viewBox: '0 0 80 80' },
          React.createElement('circle', {
            cx: '40',
            cy: '40',
            r: radius,
            className: 'stroke-zinc-800/80',
            strokeWidth: '6',
            fill: 'transparent'
          }),
          React.createElement('circle', {
            cx: '40',
            cy: '40',
            r: radius,
            className: 'stroke-indigo-500 transition-all duration-500 ease-out',
            strokeWidth: '6',
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            strokeLinecap: 'round',
            fill: 'transparent'
          })
        ),
        React.createElement('div', { className: 'absolute inset-0 flex flex-col items-center justify-center pointer-events-none' },
          React.createElement('span', { className: 'text-sm font-bold text-zinc-100' }, `${pct}%`)
        )
      ),

      React.createElement('div', { className: 'flex flex-col min-w-0' },
        React.createElement('span', { className: 'text-[11px] font-semibold uppercase tracking-wider text-zinc-500' },
          'Triage Progress'
        ),
        React.createElement('div', { className: 'text-sm font-semibold text-zinc-200 mt-0.5' },
          `${processed} `,
          React.createElement('span', { className: 'text-xs text-zinc-500 font-normal' }, `/ ${total}`)
        ),
        React.createElement('span', { className: 'text-[11px] text-zinc-500 truncate mt-1' },
          workerState.isRunning
            ? (workerState.currentEmail?.sender?.replace(/<.*?>/, '').trim() || 'Triaging...')
            : 'Engine Idle'
        )
      )
    ),

    // Bottom Bento: Workspace Navigation with Urgency-Colored Icons
    React.createElement('div', {
      className: 'flex-1 glass-panel rounded-3xl p-4 flex flex-col justify-between overflow-y-auto'
    },
      React.createElement('div', { className: 'space-y-3' },
        React.createElement('div', { className: 'text-[11px] font-semibold tracking-wider text-zinc-500 uppercase px-2' },
          'Workspaces'
        ),
        React.createElement('nav', { className: 'space-y-1.5' },
          tabs.map((tab) => {
            const isActive = currentFilter === tab.key;
            const Icon = tab.icon;

            return React.createElement('button', {
              key: tab.key,
              onClick: () => onSelectFilter(tab.key),
              className: `w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-200 text-xs font-medium ${
                isActive
                  ? 'bg-zinc-800/80 text-white border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`
            },
              React.createElement('div', { className: 'flex items-center gap-2.5' },
                React.createElement(Icon, { className: `w-4 h-4 ${isActive ? tab.activeColor : tab.color}` }),
                React.createElement('span', null, tab.label)
              ),
              React.createElement('span', {
                className: `text-[11px] px-2 py-0.5 rounded-lg font-semibold transition-colors ${
                  isActive ? 'bg-indigo-500/20 text-indigo-300' : tab.badgeClass
                }`
              }, counts[tab.key] || 0)
            );
          })
        )
      )
    )
  );
}