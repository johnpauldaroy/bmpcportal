insert into public.loan_products (
  code,
  name,
  description,
  min_amount,
  max_amount,
  min_term_months,
  max_term_months,
  interest_rate_percent
)
values
  ('REGULAR', 'Regular Loan', 'General member loan product.', 1000, 100000, 3, 36, null),
  ('EMERGENCY', 'Emergency Loan', 'Short-term loan for urgent member needs.', 500, 25000, 1, 12, null)
on conflict do nothing;

insert into public.rewards_catalog (code, name, points_cost)
values
  ('GROCERY-500', 'BMPC Grocery Voucher', 500),
  ('FEE-WAIVER-300', 'Service Fee Waiver', 300)
on conflict do nothing;
