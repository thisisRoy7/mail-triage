import React, { useState, useEffect, useRef } from 'react';
import { PenSquare, Loader2, ExternalLink } from 'lucide-react';
import { getBadgeClass, getBadgeLabel } from '../utils/formatters.js';
import { fetchEmailContent } from '../api.js';

const contentCache = new Map();

export default function ReaderStage({ email, onOpenDrawer }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!email) {
      setContent(null);
      return;
    }

    if (contentCache.has(email.id)) {
      setContent(contentCache.get(email.id));
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchEmailContent(email.id)
      .then((data) => {
        if (isMounted) {
          contentCache.set(email.id, data);
          setContent(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load email content on-demand:', err);
          setContent({ id: email.id, html: null, body: email.body });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [email?.id]);

  if (!email) {
    return React.createElement('main', {
      className: 'h-full glass-panel rounded-3xl flex items-center justify-center text-xs font-medium text-zinc-500'
    }, 'Select a thread to view');
  }

  const isPending = email.status === 'PENDING';

  // Injects safe dark-mode style adaptations into original Gmail HTML
  const buildIframeDoc = (rawHtml) => {
    if (!rawHtml) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <base target="_blank">
          <style>
            html, body {
              color: #d1d5db !important;
              background-color: transparent !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              font-size: 13px;
              line-height: 1.5;
              margin: 0;
              padding: 12px;
              word-break: break-word;
            }
            a { color: #818cf8 !important; text-decoration: underline; }
            img { max-width: 100% !important; height: auto !important; border-radius: 8px; }
            table { max-width: 100% !important; }
            * { color-scheme: dark; }
          </style>
        </head>
        <body>${rawHtml}</body>
      </html>
    `;
  };

  // Sanitizes fallback plain text so tracking URLs turn into compact badges instead of text walls
  const renderFormattedPlainText = (text) => {
    if (!text) return null;
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);

    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        let label = 'Open Link';
        try {
          const parsed = new URL(part);
          label = parsed.hostname.replace('www.', '');
        } catch {
          label = 'Link';
        }
        return React.createElement('a', {
          key: index,
          href: part,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 text-[11px] font-medium no-underline transition-colors align-middle'
        },
          label,
          React.createElement(ExternalLink, { className: 'w-2.5 h-2.5 inline' })
        );
      }
      return part;
    });
  };

  return React.createElement('main', {
    className: 'h-full flex flex-col gap-3 min-h-0 overflow-hidden'
  },
    // Top Bar
    React.createElement('div', {
      className: 'glass-panel rounded-3xl px-5 py-3 flex items-center justify-between shrink-0'
    },
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('span', {
          className: `px-2.5 py-1 rounded-xl text-xs font-medium border ${getBadgeClass(email.urgency)}`
        }, isPending ? 'Processing' : getBadgeLabel(email.urgency))
      ),
      React.createElement('button', {
        onClick: onOpenDrawer,
        className: 'px-3.5 py-1.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-all active:scale-95 flex items-center gap-2 shadow-sm'
      },
        React.createElement(PenSquare, { className: 'w-3.5 h-3.5 text-zinc-800' }),
        React.createElement('span', null, 'Open Draft Canvas')
      )
    ),

    // Content Bento
    React.createElement('div', { className: 'flex-1 glass-panel rounded-3xl p-6 flex flex-col min-h-0 overflow-hidden gap-4' },
      // AI Executive Brief
      email.tldr && React.createElement('div', {
        className: 'p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs leading-relaxed text-indigo-200 shrink-0'
      },
        React.createElement('div', { className: 'font-semibold text-[10px] uppercase tracking-wider text-indigo-300 mb-0.5' }, 'Summary'),
        React.createElement('p', null, isPending ? 'Synthesizing...' : email.tldr)
      ),

      // Header Meta
      React.createElement('div', { className: 'space-y-1 pb-3 border-b border-white/5 shrink-0' },
        React.createElement('h1', { className: 'text-sm font-semibold text-zinc-100 tracking-tight' }, email.subject),
        React.createElement('div', { className: 'flex items-center gap-2 text-xs text-zinc-400' },
          React.createElement('span', { className: 'text-zinc-200 font-medium' }, email.sender),
          React.createElement('span', { className: 'text-zinc-600' }, '•'),
          React.createElement('span', null, new Date(email.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))
        )
      ),

      // Authentic Email Canvas (Iframe for full HTML, Sanitized Text for legacy fallback)
      React.createElement('div', { className: 'flex-1 min-h-0 overflow-hidden relative rounded-2xl bg-white/[0.01]' },
        loading
          ? React.createElement('div', { className: 'absolute inset-0 flex items-center justify-center gap-2 text-xs text-zinc-500' },
              React.createElement(Loader2, { className: 'w-4 h-4 animate-spin text-indigo-400' }),
              React.createElement('span', null, 'Rendering thread...')
            )
          : content?.html
            ? React.createElement('iframe', {
                ref: iframeRef,
                title: 'Email Content View',
                srcDoc: buildIframeDoc(content.html),
                sandbox: 'allow-popups allow-popups-to-escape-sandbox allow-same-origin',
                className: 'w-full h-full border-0 rounded-2xl bg-transparent'
              })
            : React.createElement('div', {
                className: 'h-full overflow-y-auto text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap p-2'
              }, renderFormattedPlainText(content?.body || email.body))
      )
    )
  );
}