import React, { Children, useState } from 'react';

export function PageControls({ page, pages, count, size, onChange, label }) {
  return <nav className="ov-list-pagination" aria-label={label}>
    <span>{count ? (page - 1) * size + 1 : 0}-{Math.min(page * size, count)} of {count}</span>
    <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <span aria-live="polite">Page {page} of {pages}</span>
    <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
  </nav>;
}

export default function PaginatedList({ children, pageSize = 10, resetKey = '', table = false, columns = 6, label = 'List pages' }) {
  const [selection, setSelection] = useState({ key: resetKey, page: 1 });
  const items = Children.toArray(children);
  const emptyRow = table && items.length === 1 && Children.toArray(items[0]?.props?.children).some(child => child.props?.colSpan);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = selection.key === resetKey ? Math.min(selection.page, pages) : 1;
  const visible = items.slice((page - 1) * pageSize, page * pageSize);
  const controls = <PageControls page={page} pages={pages} count={items.length} size={pageSize} label={label} onChange={next => setSelection({ key: resetKey, page: next })} />;
  return table ? <tbody>{visible}{items.length > 0 && !emptyRow && <tr><td colSpan={columns}>{controls}</td></tr>}</tbody> : <div className="ov-paginated-list">{visible}{items.length > 0 && controls}</div>;
}
