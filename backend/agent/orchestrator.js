const { callGemini, buildSystemPrompt, formatHistoryForGemini } = require('../services/geminiService');
const { TOOL_DECLARATIONS, executeTool } = require('./tools');
const { logEvent } = require('../utils/logger');

const MAX_TOOL_ITERATIONS = 5;

async function runAgent({ merchant, products, recentMessages, conversationId }) {
  const startedAt = Date.now();
  const systemInstruction = buildSystemPrompt(merchant, products);
  let contents = formatHistoryForGemini(recentMessages);
  const toolCallLog = [];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await callGemini({
      contents,
      systemInstruction,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }]
    });

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      logEvent('agent_run_complete', {
        conversationId: conversationId?.toString(),
        latencyMs: Date.now() - startedAt,
        iterations: i + 1,
        toolsCalled: toolCallLog.map(c => c.tool),
        outcome: 'reply'
      });
      return { reply: response.text, toolCallLog };
    }

    contents.push(response.candidates[0].content);

    const responseParts = [];
    for (const call of functionCalls) {
      const result = await executeTool(call, { conversationId, merchantId: merchant._id, merchant });
      toolCallLog.push({ tool: call.name, args: call.args, result });
      responseParts.push({ functionResponse: { name: call.name, response: result } });
    }

    contents.push({ role: 'user', parts: responseParts });
  }

  logEvent('agent_run_complete', {
    conversationId: conversationId?.toString(),
    latencyMs: Date.now() - startedAt,
    iterations: MAX_TOOL_ITERATIONS,
    toolsCalled: toolCallLog.map(c => c.tool),
    outcome: 'max_iterations_reached'
  });

  return {
    reply: "I've shared what I found above.",
    toolCallLog
  };
}

module.exports = { runAgent };