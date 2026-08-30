require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Merchant = require('../models/Merchant');
const Product = require('../models/Product');
const AgentDecision = require('../models/AgentDecision');
const { runAgent } = require('../agent/orchestrator');
const testCases = require('./dataset');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runEvaluation() {
  await connectDB();

  const merchant = await Merchant.findOne();
  const products = await Product.find({ merchantId: merchant._id });

  const createdDecisionIds = [];
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    if (i > 0) {
      console.log('Waiting to respect free-tier rate limits...');
      await wait(13000); 
    }

    const conversationId = new mongoose.Types.ObjectId(); 

    let result;
    let runtimeError = null;

    try {
      result = await runAgent({
        merchant,
        products,
        recentMessages: [{ role: 'user', content: testCase.input }],
        conversationId
      });
    } catch (err) {
      runtimeError = err.message;
      result = { reply: '', toolCallLog: [] };
    }

    result.toolCallLog.forEach(call => {
      if (call.result?.decisionId) createdDecisionIds.push(call.result.decisionId);
    });

    const issues = runtimeError
      ? [`Runtime error: ${runtimeError}`]
      : testCase.expect(result, { products, merchant });

    results.push({
      id: testCase.id,
      description: testCase.description,
      input: testCase.input,
      pass: issues.length === 0,
      issues,
      reply: result.reply,
      toolCallLog: result.toolCallLog
    });
  }

  console.log('\n=== CartPilot AI Evaluation ===\n');
  let passCount = 0;
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) passCount++;
    console.log(`[${status}] ${r.id}`);
    console.log(`  Input: "${r.input}"`);
    if (!r.pass) {
      r.issues.forEach(issue => console.log(`  Issue: ${issue}`));
    }
    console.log('');
  }
  console.log(`Result: ${passCount}/${results.length} passed\n`);

  if (createdDecisionIds.length > 0) {
    await AgentDecision.deleteMany({ _id: { $in: createdDecisionIds } });
    console.log(`Cleaned up ${createdDecisionIds.length} test-generated decision record(s).\n`);
  }

  await mongoose.connection.close();
  process.exit(passCount === results.length ? 0 : 1);
}

runEvaluation();