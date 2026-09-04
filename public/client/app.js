import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/Header.js';
import NavSidebar from './components/NavSidebar.js';
import TriageFeed from './components/TriageFeed.js';
import ReaderStage from './components/ReaderStage.js';
import DraftDrawer from './components/DraftDrawer.js';
import { fetchEmails, triggerSync, triggerReset, subscribeProgress, openDraftStream } from './api.js';

function App() {
  const [emails, setEmails] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [actionType, setActionType] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [draftBuffer, setDraftBuffer] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const [categoryCounts, setCategoryCounts] = useState({
    ALL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  });

  const [workerState, setWorkerState] = useState({
    isRunning: false,
    isIngesting: false,
    isStalled: false,
    currentEmail: null,
    stats: { total: 0, completed: 0, failed: 0, pending: 0 },
    progressPct: 0
  });

  const activeStreamRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshGlobalCounts = async () => {
    try {
      const allEmails = await fetchEmails('ALL');
      const counts = { ALL: allEmails.length, HIGH: 0, MEDIUM: 0, LOW: 0 };
      allEmails.forEach((e) => {
        if (counts[e.urgency] !== undefined) counts[e.urgency]++;
      });
      setCategoryCounts(counts);
    } catch (err) {
      console.error('Failed to update category counts:', err);
    }
  };

  const loadData = async (filterToLoad = currentFilter) => {
    try {
      const data = await fetchEmails(filterToLoad);
      setEmails(data);
      if (data.length > 0) {
        setActiveId((prev) => (prev && data.some((e) => e.id === prev) ? prev : data[0].id));
      } else {
        setActiveId(null);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    refreshGlobalCounts();
    loadData(currentFilter);
  }, [currentFilter]);

  useEffect(() => {
    const sub = subscribeProgress(
      (data) => {
        setWorkerState(data);
        if (!data.isRunning && !data.isIngesting) {
          setActionType(null);
          refreshGlobalCounts();
          loadData(currentFilter);
        }
      },
      () => showToast('Background engine stream offline')
    );
    return () => sub.close();
  }, [currentFilter]);

  const activeEmail = emails.find((e) => e.id === activeId) || null;

  useEffect(() => {
    if (activeEmail) {
      setDraftBuffer(activeEmail.suggested_reply || '');
    }
  }, [activeId, emails]);

  const handleTriggerSync = async () => {
    setActionType('sync');
    try {
      await triggerSync();
    } catch (err) {
      setActionType(null);
      showToast(err.message);
    }
  };

  const handleTriggerReset = async (type) => {
    setActionType(type);
    try {
      await triggerReset(type);
    } catch (err) {
      setActionType(null);
      showToast(err.message);
    }
  };

  const startDraftGeneration = (mailId) => {
    if (activeStreamRef.current) activeStreamRef.current.close();
    setDraftBuffer('');
    setIsStreaming(true);

    activeStreamRef.current = openDraftStream(
      mailId,
      (token) => setDraftBuffer((prev) => prev + token),
      () => {
        setIsStreaming(false);
        activeStreamRef.current = null;
      },
      (err) => {
        setIsStreaming(false);
        showToast(typeof err === 'string' ? err : 'Draft generation interrupted');
      }
    );
  };

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
    if (activeEmail && (!activeEmail.suggested_reply || activeEmail.suggested_reply.trim() === '')) {
      startDraftGeneration(activeEmail.id);
    }
  };

  return React.createElement('div', { className: 'h-screen w-screen flex flex-col overflow-hidden text-zinc-100 bg-[#0D0D11]' },
    toastMessage && React.createElement('div', {
      className: 'fixed top-18 right-8 z-50 flex items-center gap-2 glass-panel text-zinc-200 text-xs px-4 py-2.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200'
    }, toastMessage),

    React.createElement(Header, {
      activeEmail,
      workerState,
      onTriggerSync: handleTriggerSync,
      onTriggerReset: handleTriggerReset,
      actionType
    }),

    // Bento 3-Column Layout: Columns 2 and 3 scroll independently
    React.createElement('div', { className: 'flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden' },
      React.createElement('div', { className: 'col-span-3 h-full min-h-0 flex flex-col' },
        React.createElement(NavSidebar, {
          currentFilter,
          onSelectFilter: setCurrentFilter,
          counts: categoryCounts,
          workerState
        })
      ),
      React.createElement('div', { className: 'col-span-4 h-full min-h-0 flex flex-col' },
        React.createElement(TriageFeed, {
          emails,
          selectedId: activeId,
          onSelectEmail: setActiveId,
          onRefresh: () => {
            refreshGlobalCounts();
            loadData(currentFilter);
          }
        })
      ),
      React.createElement('div', { className: 'col-span-5 h-full min-h-0 flex flex-col' },
        React.createElement(ReaderStage, {
          email: activeEmail,
          onOpenDrawer: handleOpenDrawer
        })
      )
    ),

    React.createElement(DraftDrawer, {
      isOpen: isDrawerOpen,
      email: activeEmail,
      draftText: draftBuffer,
      isStreaming,
      onRegenerate: () => activeEmail && startDraftGeneration(activeEmail.id),
      onClose: () => setIsDrawerOpen(false),
      onChangeDraft: setDraftBuffer
    })
  );
}

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));