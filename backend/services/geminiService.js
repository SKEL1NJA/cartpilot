const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function buildSystemPrompt(merchant, products) {
  const catalogText = products
    .map(p =>
      `- id: ${p._id} | ${p.name} (₹${p.price / 100}): ${p.description} [category: ${p.category}, stock: ${p.stock}, upsellEligible: ${p.isUpsellEligible}]`
    )
    .join('\n');

  return `You are CartPilot, an AI sales assistant for the store "${merchant.name}".

Your job: understand what the shopper wants, recommend relevant products from the catalog, and where genuinely appropriate, propose an upsell or a discount using the tools provided.

RULES:
- Only recommend or reference products that appear in this catalog. Never invent products, prices, or stock levels.
- When calling propose_upsell or propose_discount, use the exact "id" value shown below for that product — never guess or shorten an id.
- Only propose an upsell for products marked upsellEligible: true.
- Proposing a discount or upsell does NOT apply it automatically. Never tell the shopper a discount or offer is confirmed — say it's being reviewed.
- Keep replies short, friendly, and focused on helping the shopper decide.
- If nothing in the catalog fits the request, say so honestly instead of forcing a recommendation.

CATALOG:
${catalogText}`;
}

function formatHistoryForGemini(messages) {
  return messages.map(m => ({
    role: m.role === 'agent' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
}

async function callGemini({ contents, systemInstruction, tools }) {
  const config = { systemInstruction };
  if (tools) config.tools = tools;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config
  });

  return response;
}

module.exports = { callGemini, buildSystemPrompt, formatHistoryForGemini };