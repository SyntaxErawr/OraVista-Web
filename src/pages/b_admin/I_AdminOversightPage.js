import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import PatientDialog from '../../components/PatientDialog';
import { API_BASE_URL } from '../../config/api';

const money = value => `PHP ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const timestamp = value => new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

export default function AdminOversightPage({ audit = false }) {
  const [filters, setFilters] = useState({ from: '', to: '', branch: '', q: '' });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ records: [], count: 0, branches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const params = new URLSearchParams({ ...applied, page });
    fetch(`${API_BASE_URL}/api/admin/${audit ? 'audit-logs' : 'transactions'}?${params}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to load records.'); return data; })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [audit, applied, page, refresh]);
  const update = event => setFilters(current => ({ ...current, [event.target.name]: event.target.value }));
  const exportPage = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ ...applied, format: 'csv' });
      const response = await fetch(`${API_BASE_URL}/api/admin/${audit ? 'audit-logs' : 'transactions'}?${params}`);
      if (!response.ok) throw new Error('Unable to export records. Please try again.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `OraVista_${audit ? 'Audit' : 'Transactions'}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { setError(err.message); } finally { setExporting(false); }
  };
  return <AdminLayout><div style={styles.content}>
    <h1 style={{ color: '#087F8C' }}>{audit ? 'Audit Logs' : 'Transactions'}</h1>
    <p>{audit ? 'Chronological system changes. All times are Philippine time.' : 'Payments collected since transaction tracking was enabled. Earlier bills remain available in Billing; their historical collection details are unknown.'}</p>
    <form style={styles.filters} onSubmit={event => { event.preventDefault(); setPage(1); setApplied({ ...filters }); }}>
      <label>From<input style={styles.input} type="date" name="from" value={filters.from} onChange={update} /></label>
      <label>To<input style={styles.input} type="date" name="to" value={filters.to} onChange={update} /></label>
      <label>Branch<select style={styles.input} name="branch" value={filters.branch} onChange={update}><option value="">All branches</option>{result.branches.map(branch => <option key={branch}>{branch}</option>)}</select></label>
      <label>Search<input style={styles.input} name="q" value={filters.q} onChange={update} placeholder={audit ? 'Staff, action or record' : 'Patient, reference or collector'} /></label>
      <button style={styles.button}>Apply filters</button>
      <button style={styles.button} type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading}>Refresh</button>
    </form>
    {!audit && !loading && !error && <p><strong>Collected in selected period: {money(result.received)}</strong></p>}
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading records...</p> : !error && <>
      <div style={styles.tableWrap} tabIndex={0} role="region" aria-label={audit ? 'Audit log table' : 'Transaction table'}>
        <table style={styles.table}><thead><tr>{(audit ? ['Time','User','Action','Record','Branch','Details'] : ['Time','Patient / Booking','Branch','Service','Received','Method','Collected by','Details']).map(label => <th style={styles.cell} key={label}>{label}</th>)}</tr></thead>
          <tbody>{result.records.map(row => <tr key={row.id}>
            <td style={styles.cell}>{timestamp(row.created_at)}</td>
            {audit ? <><td style={styles.cell}>{row.actor_name || 'System / unidentified'}<br />{row.actor_role}</td><td style={styles.cell}>{row.action}</td><td style={styles.cell}>{row.entity} #{row.entity_id}</td><td style={styles.cell}>{row.branch || '—'}</td></> : <><td style={styles.cell}>{row.patient_name}<br />{row.booking_ref || `Appointment ${row.appointment_id}`}</td><td style={styles.cell}>{row.branch || '—'}</td><td style={styles.cell}>{row.service}</td><td style={styles.cell}>{money(row.amount)}</td><td style={styles.cell}>{row.method}<br />{row.reference}</td><td style={styles.cell}>{row.collector_name || row.collector_id}</td></>}
            <td style={styles.cell}><button style={styles.button} onClick={() => setSelected(row)}>Details</button></td>
          </tr>)}{!result.records.length && <tr><td colSpan={audit ? 6 : 8} style={styles.cell}>No records match these filters.</td></tr>}</tbody>
        </table>
      </div>
      <nav aria-label="Record pages" style={styles.filters}><span>{result.count} records · Page {page} of {Math.max(1, Math.ceil(result.count / 20))}</span><button style={styles.button} disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><button style={styles.button} disabled={page * 20 >= result.count} onClick={() => setPage(value => value + 1)}>Next</button><button style={styles.button} disabled={!result.records.length || exporting} onClick={exportPage}>{exporting ? 'Exporting...' : 'Export filtered records (CSV)'}</button></nav>
    </>}
    {selected && <div style={styles.overlay}><PatientDialog onClose={() => setSelected(null)} style={styles.modal}><h2>{audit ? 'Audit Event' : 'Transaction'} #{selected.id}</h2><p>{timestamp(selected.created_at)}</p><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>{JSON.stringify(audit ? selected.changes : selected, null, 2)}</pre><button style={styles.button} onClick={() => setSelected(null)}>Close</button></PatientDialog></div>}
  </div></AdminLayout>;
}
const styles = {
  content: { padding: 32, color: 'var(--ov-ink, #17343b)', background: '#F3F9FA', minHeight: '100vh' },
  filters: { display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12, margin: '20px 0' },
  input: { display: 'block', padding: 10, border: '1px solid #ccdadd', borderRadius: 8, maxWidth: '100%' },
  button: { background: '#edf8fa', color: '#087F8C', border: '1px solid #96bfca', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  tableWrap: { overflow: 'auto', maxHeight: '60vh', borderRadius: 15, background: 'white' },
  table: { width: '100%', borderCollapse: 'collapse' }, cell: { padding: 14, borderBottom: '1px solid #e3ecee', textAlign: 'left' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1200 },
  modal: { background: 'white', borderRadius: 15, padding: 28, maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto' },
};
