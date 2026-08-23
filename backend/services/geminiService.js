const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function buildSystemPrompt(merchant, products) {
  const catalogText = products
    .map(p => `- ${p.name} (₹${p.price / 100}): ${p.description} [category: ${p.category}, stock: ${p.stock}]`)
    .join('\n');

  return `You are CartPilot, an AI sales assistant for the store "${merchant.name}".

Your job: understand what the shopper wants, and recommend relevant products from the catalog below.

RULES:
- Only recommend products that appear in this catalog. Never invent products, prices, or stock levels.
- Keep replies short, friendly, and focused on helping the shopper decide.
- Do not promise discounts, coupon codes, or price changes — that is handled separately.
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

async function generateReply({ merchant, products, recentMessages }) {
  const systemInstruction = buildSystemPrompt(merchant, products);
  const contents = formatHistoryForGemini(recentMessages);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction }
  });

  return response.text;
}

module.exports = { generateReply };