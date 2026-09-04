import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, RotateCcw, Database, ChevronDown, Check, Plus, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header({ activeEmail, workerState, onTriggerSync, onTriggerReset, actionType }) {
  const { isRunning, isIngesting } = workerState;
  const isBusy = isRunning || isIngesting;
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitial = () => {
    if (!activeEmail || !activeEmail.sender) return 'M';
    const clean = activeEmail.sender.replace(/["'<].*?[>"]/g, '').trim();
    return clean ? clean.charAt(0).toUpperCase() : 'M';
  };

  const accounts = [
    { name: 'Primary Mailbox', email: 'user@domain.com', active: true },
    { name: 'Work Inbox', email: 'work@company.com', active: false }
  ];

  return React.createElement('header', {
    className: 'h-16 px-6 glass-panel border-b border-white/5 flex items-center justify-between shrink-0 z-30'
  },
    // Left: Account Switcher Button + Title
    React.createElement('div', { className: 'flex items-center gap-3.5 relative', ref: menuRef },
      React.createElement('button', {
        onClick: () => setIsAccountMenuOpen(!isAccountMenuOpen),
        className: 'relative flex items-center gap-2 p-1 pr-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all duration-200 active:scale-95 text-left group'
      },
        React.createElement('div', {
          className: 'w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-600/20 border border-indigo-400/25 flex items-center justify-center text-xs font-semibold text-indigo-200 shadow-inner group-hover:border-indigo-400/40 transition-colors'
        }, getInitial()),
        React.createElement('span', { className: 'text-xs font-semibold text-zinc-200 tracking-tight' }, 'Mail Triage Engine'),
        React.createElement(ChevronDown, {
          className: `w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180 text-zinc-300' : ''}`
        })
      ),

      // Account Dropdown Menu with motion animation
      React.createElement(AnimatePresence, null,
        isAccountMenuOpen && React.createElement(motion.div, {
          initial: { opacity: 0, y: -6, scale: 0.96 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -6, scale: 0.96 },
          transition: { duration: 0.15, ease: 'easeOut' },
          className: 'absolute top-12 left-0 w-64 glass-panel rounded-2xl p-2 shadow-2xl border border-white/10 z-50 bg-[#121218]/90 backdrop-blur-2xl'
        },
          React.createElement('div', { className: 'px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500' },
            'Connected Inboxes'
          ),
          React.createElement('div', { className: 'space-y-1 my-1' },
            accounts.map((acc, i) =>
              React.createElement('button', {
                key: i,
                onClick: () => setIsAccountMenuOpen(false),
                className: `w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                  acc.active ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`
              },
                React.createElement('div', { className: 'flex flex-col min-w-0' },
                  React.createElement('span', { className: 'font-medium truncate' }, acc.name),
                  React.createElement('span', { className: 'text-[10px] text-zinc-500 truncate' }, acc.email)
                ),
                acc.active && React.createElement(Check, { className: 'w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2' })
              )
            )
          ),
          React.createElement('div', { className: 'pt-1.5 mt-1 border-t border-white/5' },
            React.createElement('button', {
              onClick: () => setIsAccountMenuOpen(false),
              className: 'w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors'
            },
              React.createElement(Plus, { className: 'w-3.5 h-3.5 text-zinc-400' }),
              React.createElement('span', null, 'Connect New Account')
            )
          )
        )
      )
    ),

    // Right: Controls
    React.createElement('div', { className: 'flex items-center gap-2.5' },
      // Reset Actions
      React.createElement('div', { className: 'flex items-center bg-white/[0.03] p-1 rounded-2xl border border-white/5' },
        React.createElement('button', {
          onClick: () => onTriggerReset('soft'),
          disabled: isBusy,
          title: 'Soft Refresh',
          className: 'flex items-center gap-1.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-3 py-1.5 disabled:opacity-40 transition-all duration-150 active:scale-95'
        },
          React.createElement(RotateCcw, { className: `w-3.5 h-3.5 ${actionType === 'soft' ? 'animate-spin' : ''}` }),
          React.createElement('span', null, actionType === 'soft' ? 'Refreshing...' : 'Soft Refresh')
        ),
        React.createElement('button', {
          onClick: () => onTriggerReset('full'),
          disabled: isBusy,
          title: 'Full Reindex',
          className: 'flex items-center gap-1.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-xs font-medium px-3 py-1.5 disabled:opacity-40 transition-all duration-150 active:scale-95'
        },
          React.createElement(Database, { className: `w-3.5 h-3.5 ${actionType === 'full' ? 'animate-spin' : ''}` }),
          React.createElement('span', null, actionType === 'full' ? 'Reindexing...' : 'Reindex')
        )
      ),

      // Primary Sync Trigger
      React.createElement('button', {
        onClick: onTriggerSync,
        disabled: isBusy,
        className: 'rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold px-4 py-2 shadow-sm disabled:opacity-40 transition-all duration-150 active:scale-95 flex items-center gap-2'
      },
        React.createElement(RefreshCw, {
          className: `w-3.5 h-3.5 ${actionType === 'sync' ? 'animate-spin' : ''}`
        }),
        React.createElement('span', null, actionType === 'sync' ? 'Syncing...' : 'Sync')
      )
    )
  );
}