const { upsellArgsSchema, discountArgsSchema } = require('../agent/schemas');

describe('upsellArgsSchema', () => {
  test('accepts valid input', () => {
    const result = upsellArgsSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      reason: 'Pairs well with the serum'
    });
    expect(result.success).toBe(true);
  });

  test('rejects a malformed productId', () => {
    const result = upsellArgsSchema.safeParse({
      productId: 'not-a-real-id',
      reason: 'Pairs well with the serum'
    });
    expect(result.success).toBe(false);
  });

  test('rejects a missing reason', () => {
    const result = upsellArgsSchema.safeParse({
      productId: '507f1f77bcf86cd799439011'
    });
    expect(result.success).toBe(false);
  });
});

describe('discountArgsSchema', () => {
  test('accepts a valid discount request', () => {
    const result = discountArgsSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      discountPercent: 10,
      reason: 'Customer asked for a deal'
    });
    expect(result.success).toBe(true);
  });

  test('rejects a negative discount', () => {
    const result = discountArgsSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      discountPercent: -5,
      reason: 'Customer asked for a deal'
    });
    expect(result.success).toBe(false);
  });

  test('rejects a discount over 100%', () => {
    const result = discountArgsSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      discountPercent: 150,
      reason: 'Customer asked for a deal'
    });
    expect(result.success).toBe(false);
  });

  test('rejects a non-numeric discount', () => {
    const result = discountArgsSchema.safeParse({
      productId: '507f1f77bcf86cd799439011',
      discountPercent: 'a lot',
      reason: 'Customer asked for a deal'
    });
    expect(result.success).toBe(false);
  });
});