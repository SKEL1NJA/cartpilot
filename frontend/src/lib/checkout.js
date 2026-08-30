const API_URL = import.meta.env.VITE_API_URL;

export function openCheckout({ productId, conversationId, discountPercent, onSuccess, onFailure, onStatus }) {
  return fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, conversationId, discountPercent })
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        onStatus?.(`Could not start checkout: ${data.error}`);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Glow & Co.',
        description: 'CartPilot Purchase',
        handler: async function (response) {
          onStatus?.('Verifying payment...');
          const verifyRes = await fetch(`${API_URL}/api/orders/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
          });
          const verifyData = await verifyRes.json();
          if (verifyData.verified) {
            onSuccess?.();
          } else {
            onFailure?.('Payment could not be verified.');
          }
        },
        modal: {
          ondismiss: function () {
            onStatus?.('Checkout closed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        await fetch(`${API_URL}/api/orders/fail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.error.metadata.order_id,
            reason: response.error.description
          })
        });
        onFailure?.(response.error.description);
      });
      rzp.open();
    })
    .catch(err => {
      onStatus?.(`Checkout error: ${err.message}`);
    });
}