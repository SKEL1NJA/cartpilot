const Product = require('../models/Product');
const AgentDecision = require('../models/AgentDecision');
const { upsellArgsSchema, discountArgsSchema } = require('./schemas');
const { evaluateUpsell, evaluateDiscount } = require('./rules');

const TOOL_DECLARATIONS = [
  {
    name: 'propose_upsell',
    description: 'Propose an additional product to the shopper as an upsell or cross-sell, alongside what they are already considering.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The exact id of the product, copied from the catalog.' },
        reason: { type: 'string', description: 'A short, honest reason this product is a good fit right now.' }
      },
      required: ['productId', 'reason']
    }
  },
  {
    name: 'propose_discount',
    description: 'Propose a percentage discount on a specific product to help close the sale. This only logs a request — it does not apply automatically.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The exact id of the product, copied from the catalog.' },
        discountPercent: { type: 'number', description: 'Proposed discount percentage, e.g. 10 for 10%.' },
        reason: { type: 'string', description: 'A short, honest reason this discount is justified.' }
      },
      required: ['productId', 'discountPercent', 'reason']
    }
  }
];

async function executeTool(call, { conversationId, merchantId, merchant }) {
  const { name, args } = call;

  if (name === 'propose_upsell') {
    const parsed = upsellArgsSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, error: `Invalid upsell request: ${parsed.error.issues[0].message}` };
    }

    const product = await Product.findById(parsed.data.productId).catch(() => null);
    if (!product) {
      return { success: false, error: 'Product not found in catalog.' };
    }

    const { status, ruleReason } = evaluateUpsell({ product });

    const decision = await AgentDecision.create({
      conversationId,
      merchantId,
      productId: product._id,
      decisionType: 'upsell',
      reason: parsed.data.reason,
      status
    });

    return {
      success: status !== 'rejected',
      decisionId: decision._id,
      status,
      note: status === 'auto_approved'
        ? 'Upsell approved. You may present it to the shopper as a real suggestion.'
        : `Upsell rejected by business rules: ${ruleReason}`
    };
  }

  if (name === 'propose_discount') {
    const parsed = discountArgsSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, error: `Invalid discount request: ${parsed.error.issues[0].message}` };
    }

    const product = await Product.findById(parsed.data.productId).catch(() => null);
    if (!product) {
      return { success: false, error: 'Product not found in catalog.' };
    }

    const { status, ruleReason } = evaluateDiscount({
      discountPercent: parsed.data.discountPercent,
      merchant
    });

    const decision = await AgentDecision.create({
      conversationId,
      merchantId,
      productId: product._id,
      decisionType: 'discount',
      discountPercent: parsed.data.discountPercent,
      reason: parsed.data.reason,
      status
    });

    let note;
    if (status === 'auto_approved') {
      note = `Discount approved automatically (${ruleReason}). You may tell the shopper this discount is confirmed.`;
    } else if (status === 'pending_approval') {
      note = `Discount requires merchant approval (${ruleReason}). Tell the shopper it has been submitted for review, not confirmed.`;
    } else {
      note = `Discount rejected (${ruleReason}). Do not offer this discount to the shopper.`;
    }

    return {
      success: status !== 'rejected',
      decisionId: decision._id,
      status,
      note
    };
  }

  return { success: false, error: `Unknown tool: ${name}` };
}

module.exports = { TOOL_DECLARATIONS, executeTool };