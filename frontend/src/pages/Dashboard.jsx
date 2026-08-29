import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Table, THead, TH, TBody, TD } from '../components/Table';

const API_URL = import.meta.env.VITE_API_URL;

function statusTone(status) {
  if (status === 'paid' || status === 'approved' || status === 'auto_approved') return 'success';
  if (status === 'pending_approval' || status === 'created') return 'warning';
  if (status === 'failed' || status === 'rejected') return 'danger';
  return 'neutral';
}

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [pending, setPending] = useState([]);
  const [audit, setAudit] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recovery, setRecovery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanMessage, setScanMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

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

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading dashboard...</p>;
  }

  const tabs = [
    { id: 'pending', label: `Pending Approvals (${pending.length})` },
    { id: 'audit', label: 'Audit Trail' },
    { id: 'orders', label: 'Recent Orders' },
    { id: 'recovery', label: 'Cart Recovery' }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Merchant Dashboard</h1>
        <button onClick={logout} className="text-sm text-ink-muted hover:text-ink">Log out</button>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'pending' && (
        <Card title="Pending Approvals">
          {pending.length === 0 && <p className="text-sm text-ink-muted">Nothing waiting for review.</p>}
          {pending.length > 0 && (
            <Table>
              <THead>
                <TH>Product</TH>
                <TH>Type</TH>
                <TH>Discount</TH>
                <TH>Reason</TH>
                <TH>Actions</TH>
              </THead>
              <TBody>
                {pending.map(d => (
                  <tr key={d._id}>
                    <TD>{d.productId?.name}</TD>
                    <TD className="capitalize">{d.decisionType}</TD>
                    <TD>{d.discountPercent ? `${d.discountPercent}%` : '-'}</TD>
                    <TD className="text-ink-muted">{d.reason}</TD>
                    <TD>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" onClick={() => handleAction(d._id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleAction(d._id, 'reject')}>
                          Reject
                        </Button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card title="Audit Trail" action={<span className="text-xs text-ink-muted">Latest 100</span>}>
          <Table>
            <THead>
              <TH>Time</TH>
              <TH>Product</TH>
              <TH>Type</TH>
              <TH>Discount</TH>
              <TH>Reason</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {audit.map(d => (
                <tr key={d._id}>
                  <TD className="text-ink-muted whitespace-nowrap">{new Date(d.createdAt).toLocaleString()}</TD>
                  <TD>{d.productId?.name}</TD>
                  <TD className="capitalize">{d.decisionType}</TD>
                  <TD>{d.discountPercent ? `${d.discountPercent}%` : '-'}</TD>
                  <TD className="text-ink-muted">{d.reason}</TD>
                  <TD><Badge tone={statusTone(d.status)}>{d.status}</Badge></TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card title="Recent Orders">
          <Table>
            <THead>
              <TH>Time</TH>
              <TH>Product</TH>
              <TH>Amount</TH>
              <TH>Status</TH>
              <TH>Failure Reason</TH>
            </THead>
            <TBody>
              {orders.map(o => (
                <tr key={o._id}>
                  <TD className="text-ink-muted whitespace-nowrap">{new Date(o.createdAt).toLocaleString()}</TD>
                  <TD>{o.productId?.name}</TD>
                  <TD>₹{(o.amount / 100).toFixed(2)}</TD>
                  <TD><Badge tone={statusTone(o.status)}>{o.status}</Badge></TD>
                  <TD className="text-ink-muted">{o.failureReason || '-'}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {activeTab === 'recovery' && (
        <Card
          title="Cart Recovery"
          action={<Button size="sm" variant="secondary" onClick={handleScan}>Scan for Abandoned Carts</Button>}
        >
          {scanMessage && <p className="text-sm text-ink-muted mb-4">{scanMessage}</p>}
          <Table>
            <THead>
              <TH>Updated</TH>
              <TH>Recovery Message</TH>
              <TH>Payment Link</TH>
            </THead>
            <TBody>
              {recovery.map(c => (
                <tr key={c._id}>
                  <TD className="text-ink-muted whitespace-nowrap">{new Date(c.updatedAt).toLocaleString()}</TD>
                  <TD className="text-ink-muted">{c.recoveryMessage}</TD>
                  <TD>
                    <a href={c.recoveryPaymentLink} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      Open Link
                    </a>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}