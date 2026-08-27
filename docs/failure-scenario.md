# Failure Scenario: Declined Payment

## What we demonstrate
A shopper's card payment is declined in Razorpay's test-mode simulation.
CartPilot detects this, records it accurately, and never corrupts order state.

## How it's triggered
1. A real Razorpay test-mode Order is created via `/api/orders`.
2. The shopper attempts payment via Razorpay Checkout using a valid test card.
3. The mock bank simulation returns a failure (via the "Failure" button, or an OTP under 4 digits).

## What happens in the system
1. Razorpay's Checkout script fires a `payment.failed` event client-side.
2. The frontend calls `POST /api/orders/fail` with the order ID and Razorpay's own failure reason.
3. The backend looks up the matching `Order`, and — guarding against a late/duplicate
   notice ever downgrading a genuinely successful payment — sets `status: 'failed'`
   and stores the real `failureReason`.
4. The order is never marked `paid`. No discount, upsell, or fulfillment logic runs.
5. The failure is visible in the Merchant Dashboard's Recent Orders table, color-coded red,
   with the real reason shown — not a generic error.

## Why this matters for the track's "explainable, bounded, gated" bar
- **Detected**: Razorpay's own signal is what triggers the failure path — we never guess.
- **Contained**: the Order's `status` field is the single source of truth, and it accurately
  reflects reality at every step; a failed payment can never silently become a paid order.
- **Communicated**: both the shopper (in Checkout) and the merchant (in the dashboard) see
  an honest, specific explanation.
- **Logged**: the failure is a permanent, timestamped, queryable record — part of the same
  audit infrastructure used for every other decision in the system.

## Related failure handling elsewhere in CartPilot
- LLM (Gemini) overload/unavailability: automatic retry with backoff, then a graceful
  fallback message — conversation state is preserved either way.
- Rejected discount/upsell proposals: handled entirely by the deterministic rules engine,
  never left ambiguous to the AI's judgment.
- Unapproved discount at checkout: blocked at the order-creation API level, regardless of
  what a client claims — verified in Day 8 testing.