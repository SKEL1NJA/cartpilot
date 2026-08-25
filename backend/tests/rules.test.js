const { evaluateUpsell, evaluateDiscount } = require('../agent/rules');

describe('evaluateUpsell', () => {
  test('approves an eligible product', () => {
    const result = evaluateUpsell({ product: { isUpsellEligible: true } });
    expect(result.status).toBe('auto_approved');
  });

  test('rejects a non-eligible product', () => {
    const result = evaluateUpsell({ product: { isUpsellEligible: false } });
    expect(result.status).toBe('rejected');
  });
});

describe('evaluateDiscount', () => {
  const merchant = { discountApprovalThreshold: 10, maxDiscountPercent: 25 };

  test('auto-approves a discount at the threshold', () => {
    const result = evaluateDiscount({ discountPercent: 10, merchant });
    expect(result.status).toBe('auto_approved');
  });

  test('auto-approves a discount below the threshold', () => {
    const result = evaluateDiscount({ discountPercent: 5, merchant });
    expect(result.status).toBe('auto_approved');
  });

  test('sends a discount above threshold but within max to pending approval', () => {
    const result = evaluateDiscount({ discountPercent: 20, merchant });
    expect(result.status).toBe('pending_approval');
  });

  test('boundary: exactly at max still goes to pending, not rejected', () => {
    const result = evaluateDiscount({ discountPercent: 25, merchant });
    expect(result.status).toBe('pending_approval');
  });

  test('rejects a discount above the merchant max, even though it might seem reasonable', () => {
    const result = evaluateDiscount({ discountPercent: 40, merchant });
    expect(result.status).toBe('rejected');
  });
});