const Product = require('../models/Product');
const AgentDecision = require('../models/AgentDecision');

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
    description: 'Propose a percentage discount on a specific product to help close the sale. This only logs a proposal — it does not apply automatically.',
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

async function executeTool(call, { conversationId, merchantId }) {
  const { name, args } = call;

  const product = await Product.findById(args.productId).catch(() => null);
  if (!product) {
    return { success: false, error: 'Product not found in catalog. Do not tell the shopper this succeeded.' };
  }

  if (name === 'propose_upsell') {
    const decision = await AgentDecision.create({
      conversationId,
      merchantId,
      productId: product._id,
      decisionType: 'upsell',
      reason: args.reason,
      status: 'proposed'
    });
    return {
      success: true,
      decisionId: decision._id,
      note: 'Upsell proposal logged for review. Not yet approved — mention it as a suggestion, not a confirmed offer.'
    };
  }

  if (name === 'propose_discount') {
    const decision = await AgentDecision.create({
      conversationId,
      merchantId,
      productId: product._id,
      decisionType: 'discount',
      discountPercent: args.discountPercent,
      reason: args.reason,
      status: 'proposed'
    });
    return {
      success: true,
      decisionId: decision._id,
      note: 'Discount proposal logged for review. It has NOT been applied yet — tell the shopper it is being checked, not confirmed.'
    };
  }

  return { success: false, error: `Unknown tool: ${name}` };
}

module.exports = { TOOL_DECLARATIONS, executeTool };