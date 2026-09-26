import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import FocusStack from '../components/FocusStack';
import SettingsPanel from '../components/SettingsPanel';

const DEFAULT_SETTINGS = { embedding_model: 'all-minilm', hybrid_weight: 0.5, voice_enabled: true };

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [focusSources, setFocusSources] = useState([]);
  const [asking, setAsking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [error, setError] = useState('');

  const refreshDocuments = useCallback(async () => {
    try {
      setDocuments(await api.get('/documents'));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const openSession = useCallback(async (id) => {
    setCurrentSessionId(id);
    setFocusSources([]);
    try {
      const detail = await api.get(`/chat/sessions/${id}`);
      setMessages(detail.messages);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleNewSession = useCallback(async () => {
    try {
      const s = await api.post('/chat/sessions', {});
      setSessions((prev) => [s, ...prev]);
      setCurrentSessionId(s.id);
      setMessages([]);
      setFocusSources([]);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshDocuments();
      try {
        setSettings(await api.get('/settings'));
      } catch {
        // fall back to defaults — first-time users won't have a row yet
      }
      let existing = [];
      try {
        existing = await api.get('/chat/sessions');
        setSessions(existing);
      } catch (e) {
        setError(e.message);
      }
      if (existing.length) {
        await openSession(existing[0].id);
      } else {
        await handleNewSession();
      }
    })();
  }, [refreshDocuments, openSession, handleNewSession]);

  async function handleDeleteSession(id) {
    try {
      await api.delete(`/chat/sessions/${id}`);
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (id === currentSessionId) {
        if (remaining.length) await openSession(remaining[0].id);
        else await handleNewSession();
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAsk(question) {
    setAsking(true);
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: 'user', content: question, sources: [], created_at: new Date().toISOString() },
    ]);
    try {
      const res = await api.post('/chat/ask', { session_id: currentSessionId, question });
      setMessages((prev) => [...prev, res.message]);
      setFocusSources(res.message.sources || []);
      if (res.session_id !== currentSessionId) {
        setCurrentSessionId(res.session_id);
        try {
          setSessions(await api.get('/chat/sessions'));
        } catch (e) {
          setError(e.message);
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Something went wrong reaching the answer engine: ${e.message}`,
          sources: [],
          confidence: 'none',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  async function handleUpload(fileList) {
    if (!fileList || !fileList.length) return;
    const names = Array.from(fileList).map(f => f.name).join(', ');
    setIsUploading(true);
    setUploadStatus(`Uploading & indexing ${fileList.length > 1 ? `${fileList.length} files` : names}...`);
    setError('');
    setInfoMessage('');

    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append('files', f));

    try {
      const res = await api.upload('/documents/upload', formData);
      await refreshDocuments();
      if (res.errors?.length) {
        setError(res.errors.join(' · '));
      } else if (res.documents?.length) {
        setInfoMessage(`Successfully indexed ${res.documents.length} document(s)!`);
        setTimeout(() => setInfoMessage(''), 5000);
      }
    } catch (e) {
      setError(e.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  }

  async function handleDeleteDocument(id) {
    try {
      await api.delete(`/documents/${id}`);
      await refreshDocuments();
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateSettings(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await api.put('/settings', next);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app-view">
      <header className="topbar">
        <div className="topbar-actions">
          <button className="icon-btn panel-toggle" onClick={() => setLeftOpen((v) => !v)} title="Documents">
            ☰
          </button>
          <div className="brandmark">
            <span className="brand-word">
              RAGnify <em>Media</em>
            </span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn panel-toggle" onClick={() => setRightOpen((v) => !v)} title="Focus stack">
            ◉
          </button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
            ⚙
          </button>
        </div>
      </header>

      {error && (
        <div className="banner banner-error dismissible" onClick={() => setError('')}>
          {error} (tap to dismiss)
        </div>
      )}

      {infoMessage && (
        <div className="banner banner-info dismissible" onClick={() => setInfoMessage('')}>
          {infoMessage}
        </div>
      )}

      <div className="app-shell">
        <Sidebar
          className={leftOpen ? 'drawer-open' : ''}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={openSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          documents={documents}
          onUpload={handleUpload}
          onDeleteDocument={handleDeleteDocument}
          isUploading={isUploading}
          uploadStatus={uploadStatus}
        />
        <ChatPanel messages={messages} onAsk={handleAsk} asking={asking} voiceEnabled={settings.voice_enabled} />
        <FocusStack className={rightOpen ? 'drawer-open' : ''} sources={focusSources} />
      </div>

      {settingsOpen && <SettingsPanel settings={settings} onChange={updateSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
