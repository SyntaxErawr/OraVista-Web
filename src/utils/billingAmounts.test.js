import { billingAmounts } from './billingAmounts';
test('approved and pending bills deduct partial payments; denied and unpublished bills are not owed', () => {
  expect(billingAmounts({ amount: 1000, billing_status: 'Approved', receipt_details: { paid: 250 } }).balance).toBe(750);
  expect(billingAmounts({ amount: 1000, billing_status: 'Pending', receipt_details: '{"paid":250}' }).balance).toBe(0);
  expect(billingAmounts({ amount: 1000, billing_status: 'Paid' }).balance).toBe(0);
  expect(billingAmounts({ amount: 1000, billing_status: 'Denied' }).balance).toBe(0);
  expect(billingAmounts({ amount: 1000 }).balance).toBe(0);
});
