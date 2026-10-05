export function billingAmounts(bill) {
  let details = bill.receipt_details;
  if (typeof details === 'string') { try { details = JSON.parse(details); } catch { details = {}; } }
  const charge = Math.max(0, Number(bill.amount) || 0);
  const paid = bill.billing_status === 'Paid' ? charge : Math.min(charge, Math.max(0, Number(details?.paid) || 0));
  const published = ['Pending', 'Approved', 'Paid'].includes(bill.billing_status);
  return { charge, paid, balance: published ? Math.round((charge - paid) * 100) / 100 : 0 };
}
