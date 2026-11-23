/**
 * Sovereign Observatory — Stage 2 Grounded Intelligence Triage Engine
 *
 * Performs schema-validated structured extraction via Gemini 2.5 Flash or DeepSeek Chat,
 * verifying that any extracted quote actually appears verbatim in the source text
 * and gracefully falling back to deterministic classification when offline/unconfigured.
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyTechPolicySignal } from './policyClassifier.js';
import { classifyMitRiskDomain } from './mitRiskTaxonomy.js';

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') return null;
  return new GoogleGenerativeAI(key);
}

function getDeepSeekClient() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || key === 'your_deepseek_api_key_here') return null;
  return new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: key,
    timeout: 5000
  });
}

function verifyVerbatimQuote(quote, haystack) {
  const cleanQuote = String(quote || '').replace(/^["']|["']$/g, '').trim();
  if (cleanQuote.length < 12) return null;
  const normHaystack = String(haystack || '').replace(/\s+/g, ' ').toLowerCase();
  const normQuote = cleanQuote.replace(/\s+/g, ' ').toLowerCase();
  return normHaystack.includes(normQuote) ? cleanQuote : null;
}

function parseJsonSafe(rawText) {
  try {
    const cleaned = String(rawText || '')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function triageSignalGrounded({ title = '', summary = '', source = '', url = '' } = {}) {
  const cleanTitle = String(title || '').trim();
  const cleanSummary = String(summary || '').trim();
  const cls = classifyTechPolicySignal(cleanTitle, cleanSummary, '');
  const mitRisk = cls.mitRisk || classifyMitRiskDomain(cleanTitle, cleanSummary, cls.domainPillar);

  const deterministicResult = {
    deltaSummary: cleanSummary ? cleanSummary.slice(0, 260) : `${cls.domainPillar} signal recorded via ${source || 'OSINT Wire'}.`,
    mitRisk,
    governanceInstrument: cls.domainPillar || 'Policy Signal',
    entities: [],
    verbatimQuote: cleanTitle.slice(0, 140),
    groundedBy: 'deterministic'
  };

  const genAI = getGeminiClient();
  const deepseek = getDeepSeekClient();
  if (!genAI && !deepseek) {
    return deterministicResult;
  }

  const systemPrompt =
    'You are an empirical AI governance and cybersecurity analyst. Output STRICT valid JSON only (no markdown fences) with keys: deltaSummary (max 220 chars describing what changed), governanceInstrument (short label e.g. "Binding Statute", "Advisory", "Safety Framework", "Cyber Incident"), entities (array of max 5 strings), verbatimQuote (an exact substring copied verbatim from the provided Title or Summary).';
  const userPrompt = `Source: ${source}\nURL: ${url}\nTitle: ${cleanTitle}\nSummary: ${cleanSummary.slice(0, 1500)}`;

  let rawResponse = null;
  try {
    if (deepseek) {
      const resp = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1
      });
      rawResponse = resp.choices?.[0]?.message?.content || null;
    } else if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      rawResponse = result.response?.text() || null;
    }
  } catch (err) {
    console.warn('[triageSignalGrounded] LLM fallback to deterministic:', err.message);
    return deterministicResult;
  }

  const parsed = parseJsonSafe(rawResponse);
  if (!parsed || typeof parsed !== 'object') {
    return deterministicResult;
  }

  const verifiedQuote = verifyVerbatimQuote(parsed.verbatimQuote, `${cleanTitle} ${cleanSummary}`);
  return {
    deltaSummary: String(parsed.deltaSummary || deterministicResult.deltaSummary).slice(0, 280),
    mitRisk,
    governanceInstrument: String(parsed.governanceInstrument || deterministicResult.governanceInstrument).slice(0, 80),
    entities: Array.isArray(parsed.entities) ? parsed.entities.map((e) => String(e).slice(0, 60)).slice(0, 5) : [],
    verbatimQuote: verifiedQuote || deterministicResult.verbatimQuote,
    groundedBy: verifiedQuote ? 'llm' : 'deterministic'
  };
}

export async function askAI(prompt, systemPrompt = 'You are a helpful AI assistant.') {
  const deepseek = getDeepSeekClient();
  if (deepseek) {
    try {
      const resp = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      });
      return resp.choices?.[0]?.message?.content || '';
    } catch (e) {
      console.warn('DeepSeek askAI fallback:', e.message);
    }
  }
  const genAI = getGeminiClient();
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const res = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
      return res.response?.text() || '';
    } catch (e) {
      console.warn('Gemini askAI fallback:', e.message);
    }
  }
  return JSON.stringify({
    summary: `Deterministic signal analysis: ${String(prompt || '').slice(0, 140)}`,
    groundedBy: 'deterministic'
  });
}

export const askGemini = askAI;
export const askDeepSeek = askAI;
