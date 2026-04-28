alter table public.business_profiles
add column if not exists customer_name text,
add column if not exists address_or_area text,
add column if not exists instagram_handle text,
add column if not exists website_url text,
add column if not exists customer_confidence_level text,
add column if not exists price_sensitivity text,
add column if not exists urgency_level text,
add column if not exists decision_readiness text,
add column if not exists admin_sales_hint text,
add column if not exists summary_for_dashboard text;
