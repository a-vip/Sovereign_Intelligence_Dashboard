const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Gemini SDK Config
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiEnabled = geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here' && geminiApiKey !== '';
const genAI = geminiEnabled ? new GoogleGenerativeAI(geminiApiKey) : null;

// DeepSeek Config
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekEnabled = deepseekApiKey && deepseekApiKey !== 'your_deepseek_api_key_here' && deepseekApiKey !== '';

const openai = deepseekEnabled ? new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: deepseekApiKey,
}) : null;

/**
 * Direct SDK call for Gemini
 */
async function askGeminiSDK(prompt, systemPrompt) {
  if (!genAI) throw new Error('Gemini SDK not configured');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  const result = await model.generateContent(`${systemPrompt}\n\nTask: ${prompt}`);
  const response = await result.response;
  return response.text();
}

/**
 * Fallback to Gemini using the system's gemini-cli
 */
async function askGeminiCLI(prompt, systemPrompt) {
  try {
    const fullPrompt = `${systemPrompt}\n\nTask: ${prompt}`;
    const command = `npx.cmd --yes @google/gemini-cli "${fullPrompt.replace(/"/g, '\\"')}"`;
    const result = execSync(command).toString();
    return result.trim();
  } catch (error) {
    console.error('Gemini CLI Error:', error.message);
    throw new Error('Gemini CLI fallback failed.');
  }
}

async function askDeepSeek(prompt, systemPrompt) {
  if (!openai) throw new Error('DeepSeek not configured');
  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: false,
  });
  return response.choices[0].message.content;
}

/**
 * Unified AI client prioritizing Gemini
 */
async function askAI(prompt, systemPrompt = 'You are a helpful AI assistant.') {
  // 1. Try Gemini SDK first
  if (geminiEnabled) {
    try {
      console.log('--- Attempting Gemini SDK ---');
      return await askGeminiSDK(prompt, systemPrompt);
    } catch (error) {
      console.error('Gemini SDK Error:', error.message);
      console.warn('Falling back to Gemini CLI...');
    }
  }

  // 2. Try Gemini CLI
  try {
    console.log('--- Attempting Gemini CLI ---');
    return await askGeminiCLI(prompt, systemPrompt);
  } catch (error) {
    console.warn('Gemini CLI failed. Falling back to DeepSeek...');
  }

  // 3. Last resort: DeepSeek
  if (deepseekEnabled) {
    try {
      console.log('--- Attempting DeepSeek ---');
      return await askDeepSeek(prompt, systemPrompt);
    } catch (error) {
      console.error('DeepSeek Error:', error.message);
      throw new Error('All AI providers failed.');
    }
  }

  throw new Error('No AI providers configured.');
}

module.exports = { askAI, askGemini: askAI, askDeepSeek: askAI }; 
