const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const upsellArgsSchema = z.object({
  productId: z.string().regex(objectIdRegex, 'productId must be a valid catalog id'),
  reason: z.string().min(5, 'reason must be a real explanation').max(300)
});

const discountArgsSchema = z.object({
  productId: z.string().regex(objectIdRegex, 'productId must be a valid catalog id'),
  discountPercent: z.number().min(1, 'discount must be at least 1%').max(100, 'discount cannot exceed 100%'),
  reason: z.string().min(5, 'reason must be a real explanation').max(300)
});

module.exports = { upsellArgsSchema, discountArgsSchema };