import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [pending, setPending] = useState([]);
  const [audit, setAudit] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const [pendingRes, auditRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/api/decisions/pending`).then(r => r.json()),
      fetch(`${API_URL}/api/decisions`).then(r => r.json()),
      fetch(`${API_URL}/api/orders/recent`).then(r => r.json())
    ]);
    setPending(pendingRes);
    setAudit(auditRes);
    setOrders(ordersRes);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const [pendingRes, auditRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/decisions/pending`).then(r => r.json()),
        fetch(`${API_URL}/api/decisions`).then(r => r.json()),
        fetch(`${API_URL}/api/orders/recent`).then(r => r.json())
      ]);
      if (!ignore) {
        setPending(pendingRes);
        setAudit(auditRes);
        setOrders(ordersRes);
        setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  async function handleAction(id, action) {
    await fetch(`${API_URL}/api/decisions/${id}/${action}`, { method: 'POST' });
    loadData();
  }

  if (loading) return <p style={{ fontFamily: 'sans-serif', margin: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
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
    </div>
  );
}

const thStyle = { textAlign: 'left', borderBottom: '2px solid #ccc', padding: '8px' };
const tdStyle = { borderBottom: '1px solid #eee', padding: '8px' };

export default App;