import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const WELCOME_MESSAGE = {
  role: 'agent',
  content: "Hi! I'm the CartPilot shopping assistant. Tell me what you're looking for, your budget, or who it's for, and I'll help you find the right product."
};

export default function ChatWidget() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('cartpilot_session'));
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'agent', content: data.error || 'Something went wrong, please try again.' }]);
        return;
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('cartpilot_session', data.sessionId);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          content: data.reply,
          hasProposal: Array.isArray(data.toolCallLog) && data.toolCallLog.length > 0
        }
      ]);
    } catch (err) {
      console.error('Chat request failed:', err.message);
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, I couldn't reach the assistant just now. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-lg flex flex-col h-[600px]">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Chat with CartPilot</h2>
        <p className="text-xs text-ink-muted">AI shopping assistant · Glow & Co.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user' ? 'bg-ink text-white' : 'bg-surface-muted text-ink border border-border'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.hasProposal && (
                <p className="mt-1.5 text-[11px] text-accent">Includes an offer submitted for review</p>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-surface-muted border border-border rounded-lg px-3 py-2 text-sm text-ink-muted">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about a product, budget, or occasion..."
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}