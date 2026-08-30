import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 8000;

const WELCOME_MESSAGE = {
  role: 'agent',
  content: "Hi! I'm the CartPilot shopping assistant. Tell me what you're looking for, your budget, or who it's for, and I'll help you find the right product."
};

export function useConversation() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('cartpilot_session'));
  const [conversationId, setConversationId] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const knownDecisionStatuses = useRef(new Map());
  const initialSessionId = useRef(localStorage.getItem('cartpilot_session'));

  useEffect(() => {
    if (!initialSessionId.current) return;

    fetch(`${API_URL}/api/chat/${initialSessionId.current}`)
      .then(r => r.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        setDecisions(data.decisions || []);
        (data.decisions || []).forEach(d => {
          knownDecisionStatuses.current.set(d._id, d.status);
        });
      })
      .catch(err => console.error('Failed to restore conversation:', err.message));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat/${sessionId}`);
        const data = await res.json();

        (data.decisions || []).forEach(d => {
          const previousStatus = knownDecisionStatuses.current.get(d._id);
          const justResolved =
            previousStatus === 'pending_approval' &&
            (d.status === 'approved' || d.status === 'rejected');

          if (justResolved) {
            const productName = d.productId?.name || 'your item';
            const update = d.status === 'approved'
              ? `Update: your ${d.discountPercent}% discount on ${productName} has been approved — you're all set to check out.`
              : `Update: your requested discount on ${productName} wasn't approved this time.`;
            setMessages(prev => [...prev, { role: 'agent', content: update }]);
          }
          knownDecisionStatuses.current.set(d._id, d.status);
        });

        setDecisions(data.decisions || []);
      } catch (err) {
        console.error('Polling failed:', err.message);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId]);

  async function sendMessage(text) {
    if (!text.trim() || sending) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
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

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('cartpilot_session', data.sessionId);
      }
      if (data.conversationId) setConversationId(data.conversationId);

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

  return { messages, sending, sessionId, conversationId, decisions, sendMessage };
}