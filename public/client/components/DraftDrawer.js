import React, { useState } from 'react';

export default function DraftDrawer({ isOpen, email, draftText, isStreaming, onRegenerate, onClose, onChangeDraft }) {
  const [copied, setCopied] = useState(false);

  if (!email || !isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return React.createElement('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-all duration-300 ease-out'
  },
    React.createElement('div', {
      className: 'w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'
    },
      // Modal Header
      React.createElement('div', {
        className: 'h-14 px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40 shrink-0'
      },
        React.createElement('div', { className: 'flex items-center gap-3' },
          React.createElement('span', { className: 'text-xs font-semibold text-zinc-200' }, 'AI Draft Studio'),
          React.createElement('span', {
            className: `text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isStreaming ? 'bg-indigo-500/20 text-indigo-300 animate-pulse' : 'bg-zinc-800 text-zinc-400'
            }`
          }, isStreaming ? 'Streaming Response...' : 'Ready')
        ),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('button', {
            onClick: handleCopy,
            className: 'rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3.5 py-1.5 transition active:scale-95'
          }, copied ? 'Copied' : 'Copy Text'),
          React.createElement('button', {
            onClick: onRegenerate,
            disabled: isStreaming,
            className: 'rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 disabled:opacity-40 transition active:scale-95'
          }, isStreaming ? 'Drafting...' : 'Regenerate'),
          React.createElement('button', {
            onClick: onClose,
            className: 'rounded-xl p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition ml-2'
          },
            React.createElement('svg', { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M6 18L18 6M6 6l12 12' })
            )
          )
        )
      ),

      // Split Canvas
      React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
        // Left Reference Pane
        React.createElement('div', { className: 'w-[45%] border-r border-zinc-800/80 p-6 overflow-y-auto space-y-4 bg-zinc-950/50' },
          React.createElement('div', null,
            React.createElement('div', { className: 'text-[11px] font-semibold uppercase text-zinc-500 mb-1' }, 'Subject'),
            React.createElement('div', { className: 'text-sm font-semibold text-zinc-200' }, email.subject)
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'text-[11px] font-semibold uppercase text-zinc-500 mb-1' }, 'Sender'),
            React.createElement('div', { className: 'text-xs text-zinc-400 font-medium' }, email.sender)
          ),
          React.createElement('div', { className: 'p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-1' },
            React.createElement('div', { className: 'text-[10px] font-bold uppercase text-indigo-400' }, 'Contextual Brief'),
            React.createElement('div', { className: 'text-xs leading-relaxed text-zinc-300 font-medium' }, email.tldr || 'No summary available.')
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'text-[11px] font-semibold uppercase text-zinc-500 mb-1' }, 'Message Body'),
            React.createElement('div', { className: 'text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed' }, email.body)
          )
        ),

        // Right Editor Pane
        React.createElement('div', { className: 'w-[55%] p-6 flex flex-col bg-zinc-900/20' },
          React.createElement('textarea', {
            value: draftText,
            onChange: (e) => onChangeDraft(e.target.value),
            placeholder: 'AI response will stream here...',
            className: 'flex-1 w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 text-xs leading-relaxed text-zinc-200 focus:outline-none focus:border-indigo-500/50 resize-none font-sans placeholder-zinc-600 transition shadow-inner'
          })
        )
      )
    )
  );
}