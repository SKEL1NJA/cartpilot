import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [pending, setPending] = useState([]);
  const [audit, setAudit] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recovery, setRecovery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanMessage, setScanMessage] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  async function loadData() {
    const [pendingRes, auditRes, ordersRes, recoveryRes] = await Promise.all([
      fetch(`${API_URL}/api/decisions/pending`, authHeaders).then(r => r.json()),
      fetch(`${API_URL}/api/decisions`, authHeaders).then(r => r.json()),
      fetch(`${API_URL}/api/orders/recent`, authHeaders).then(r => r.json()),
      fetch(`${API_URL}/api/cart-recovery`, authHeaders).then(r => r.json())
    ]);
    setPending(pendingRes);
    setAudit(auditRes);
    setOrders(ordersRes);
    setRecovery(recoveryRes);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const [pendingRes, auditRes, ordersRes, recoveryRes] = await Promise.all([
        fetch(`${API_URL}/api/decisions/pending`, authHeaders).then(r => r.json()),
        fetch(`${API_URL}/api/decisions`, authHeaders).then(r => r.json()),
        fetch(`${API_URL}/api/orders/recent`, authHeaders).then(r => r.json()),
        fetch(`${API_URL}/api/cart-recovery`, authHeaders).then(r => r.json())
      ]);
      if (!ignore) {
        setPending(pendingRes);
        setAudit(auditRes);
        setOrders(ordersRes);
        setRecovery(recoveryRes);
        setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAction(id, action) {
    await fetch(`${API_URL}/api/decisions/${id}/${action}`, { method: 'POST', ...authHeaders });
    loadData();
  }

  async function handleScan() {
    setScanMessage('Scanning...');
    const res = await fetch(`${API_URL}/api/cart-recovery/scan`, { method: 'POST', ...authHeaders });
    const data = await res.json();
    setScanMessage(`Found ${data.recoveredCount} abandoned cart(s).`);
    loadData();
  }

  if (loading) return <p style={{ fontFamily: 'sans-serif' }}>Loading...</p>;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div className="flex justify-end mb-2">
        <button onClick={logout} className="text-sm text-ink-muted hover:text-ink">Log out</button>
      </div>

      <h1>CartPilot Merchant Dashboard</h1>

      <h2>Pending Approvals ({pending.length})</h2>
      {pending.length === 0 && <p>Nothing waiting for review.</p>}
      {pending.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Discount</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(d => (
              <tr key={d._id}>
                <td style={tdStyle}>{d.productId?.name}</td>
                <td style={tdStyle}>{d.decisionType}</td>
                <td style={tdStyle}>{d.discountPercent ? `${d.discountPercent}%` : '-'}</td>
                <td style={tdStyle}>{d.reason}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleAction(d._id, 'approve')}>Approve</button>{' '}
                  <button onClick={() => handleAction(d._id, 'reject')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 40 }}>Audit Trail (latest 100)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Time</th>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Discount</th>
            <th style={thStyle}>Reason</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {audit.map(d => (
            <tr key={d._id}>
              <td style={tdStyle}>{new Date(d.createdAt).toLocaleString()}</td>
              <td style={tdStyle}>{d.productId?.name}</td>
              <td style={tdStyle}>{d.decisionType}</td>
              <td style={tdStyle}>{d.discountPercent ? `${d.discountPercent}%` : '-'}</td>
              <td style={tdStyle}>{d.reason}</td>
              <td style={tdStyle}>{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 40 }}>Recent Orders</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Time</th>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Failure Reason</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td style={tdStyle}>{new Date(o.createdAt).toLocaleString()}</td>
              <td style={tdStyle}>{o.productId?.name}</td>
              <td style={tdStyle}>₹{(o.amount / 100).toFixed(2)}</td>
              <td style={{ ...tdStyle, color: o.status === 'paid' ? 'green' : o.status === 'failed' ? 'crimson' : 'inherit' }}>
                {o.status}
              </td>
              <td style={tdStyle}>{o.failureReason || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 40 }}>Cart Recovery</h2>
      <button onClick={handleScan} style={{ padding: '8px 16px', marginBottom: 10 }}>
        Scan for Abandoned Carts
      </button>
      {scanMessage && <p>{scanMessage}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Updated</th>
            <th style={thStyle}>Recovery Message</th>
            <th style={thStyle}>Payment Link</th>
          </tr>
        </thead>
        <tbody>
          {recovery.map(c => (
            <tr key={c._id}>
              <td style={tdStyle}>{new Date(c.updatedAt).toLocaleString()}</td>
              <td style={tdStyle}>{c.recoveryMessage}</td>
              <td style={tdStyle}>
                <a href={c.recoveryPaymentLink} target="_blank" rel="noreferrer">Open Link</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { textAlign: 'left', borderBottom: '2px solid #ccc', padding: '8px' };
const tdStyle = { borderBottom: '1px solid #eee', padding: '8px' };