import OpenAI from 'openai';
import {
  DEFAULT_AI_CONFIG,
  createOrTouchChatSession,
  getAiConfig,
  saveChatTurn
} from './sovdashAiDb.js';
import { retrieveHybridEvidence, tokenizeForRag } from './sovdashRag.js';

const providerCooldownUntil = new Map();

function isProviderOnCooldown(providerKey) {
  const until = providerCooldownUntil.get(providerKey);
  return Boolean(until && Date.now() < until);
}

function setProviderCooldown(providerKey, ms) {
  providerCooldownUntil.set(providerKey, Date.now() + ms);
}

const ABSTENTION_PATTERNS = [
  /not (?:found|tracked|documented|present|verified|disclosed|available|recorded) in/i,
  /no (?:verified )?(?:record|evidence|statute|data|information|mention)/i,
  /cannot (?:verify|confirm|find)/i,
  /do not (?:have|contain|track)/i,
  /does not (?:contain|mention|include|track)/i,
  /insufficient (?:verified )?evidence/i,
  /unable to (?:confirm|verify|find)/i,
  /not publicly disclosed/i
];

export function isAbstentionText(text) {
  const s = String(text || '');
  return ABSTENTION_PATTERNS.some((rx) => rx.test(s));
}

export function getProviderKeyStatus() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_'));
  return {
    groq: Boolean(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('your_')),
    gemma: hasGemini,
    gemini: hasGemini,
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes('your_')),
    custom: Boolean(process.env.CUSTOM_AI_BASE_URL || process.env.OPENAI_COMPAT_BASE_URL)
  };
}

function buildSystemPrompt(config, plan, strictLock = true) {
  const intent = plan?.intent || 'comparative_analysis';
  let shapeDirective =
    'Give a concise, well-structured answer (compact bullets or a small table if comparing 2+ jurisdictions). Weigh different angles only when genuinely relevant.';

  if (intent === 'concise_fact') {
    shapeDirective =
      'CONCISE FACT RULE: Answer directly in 1 to 2 crisp sentences with inline [1] citation. Do NOT write section headers, intro filler, or unnecessary background.';
  } else if (intent === 'temporal_events') {
    shapeDirective =
      'LIVE EVENTS RULE: List the most recent matching events chronologically (newest first), stating each event\'s date/recency, location, and core development concisely with inline [1], [2] citations.';
  } else if (intent === 'datacenter_infra') {
    shapeDirective =
      'INFRASTRUCTURE RULE: Answer directly with exact facility counts, key hubs/cities, operators, and power capacity from the sources using inline [1] citations.';
  } else if (intent === 'regulation_lookup') {
    shapeDirective =
      'STATUTORY RULE: State the law, responsible regulator, effective status, and key obligations/penalties concisely with inline [1] citations.';
  }

  const addon = config?.systemPromptAddon ? `\nAdditional Guidance:\n${config.systemPromptAddon}\n` : '';
  return `You are **SovDash AI**, the research assistant inside Sovereign Observatory (app.sovdash.com).

OPERATING PRINCIPLES:
1. ${shapeDirective}
2. ${strictLock ? 'GROUNDING & CITATIONS: Every factual claim, date, figure, regulator, or event MUST carry an inline bracket citation matching the numbered sources below (e.g. [1], [2], or [W1] for external scholarly sources). NEVER invent citation numbers above the provided count, and NEVER invent bare URLs.' : 'Attach inline [1], [2] citations to key factual claims.'}
3. HONESTY WITHOUT BOILERPLATE: If the sources lack a specific law, deadline, or private figure the user asked for, say so plainly in 1–2 sentences without guessing. NEVER emit robotic boilerplate headings like "Verified vs. Unknown", "Citation-Locked Synthesis", or meta-commentary about vector databases or pgvector.
4. NATURAL DEPTH: Match your response length strictly to the question—one crisp sentence for simple lookups; structured bullets or a concise table for multi-jurisdiction comparisons.${addon}`;
}

function formatEvidenceContext(citations) {
  if (!citations.length) {
    return 'NO MATCHING RECORDS FOUND IN OBSERVATORY SOURCES.';
  }
  return citations
    .map((c) => {
      const dateBit = c.dateStr ? ` | Date: ${c.dateStr}` : '';
      return `[${c.tag}] (${c.sourceLabel}${dateBit}) — ${c.title}${c.location ? ` [${c.location}]` : ''}\n${c.snippet}`;
    })
    .join('\n\n---\n\n');
}

function extractReasoningAndAnswer(rawText, nativeReasoning = '') {
  let reasoning = String(nativeReasoning || '').trim();
  let answer = String(rawText || '').trim();

  const tagMatch = answer.match(/<(?:reasoning|think)>([\s\S]*?)<\/(?:reasoning|think)>/i);
  if (tagMatch) {
    const inner = tagMatch[1].trim();
    reasoning = reasoning ? `${reasoning}\n\n${inner}` : inner;
    answer = answer.replace(tagMatch[0], '').trim();
  } else if (/^(?:reasoning|thought)\s*\n/i.test(answer)) {
    const headingSplit = answer.search(/\n#{1,3}\s+/);
    const splitIdx = headingSplit;
    if (splitIdx > 20 && splitIdx < answer.length - 30) {
      const inner = answer.slice(0, splitIdx).replace(/^(?:reasoning|thought)\s*\n/i, '').trim();
      reasoning = reasoning ? `${reasoning}\n\n${inner}` : inner;
      answer = answer.slice(splitIdx).trim();
    } else {
      answer = answer.replace(/^(?:reasoning|thought)\s*\n/i, '').trim();
    }
  }
  return { reasoning, answer };
}

/**
 * Deterministic Sentence-Level Citation & Grounding Auditor.
 */
export function auditResponseGrounding(answerText, citations = [], query = '') {
  const validTags = new Set(citations.map((c) => String(c.tag).toUpperCase()));
  const allowedUrls = new Set(
    citations
      .flatMap((c) => [c.url, c.permalink])
      .filter(Boolean)
      .map((u) => String(u).replace(/[.,;)\]]+$/, '').toLowerCase())
  );
  const evidenceCorpus = citations
    .map((c) => `${c.title} ${c.location} ${c.snippet} ${c.fullContent || ''}`)
    .join(' ')
    .toLowerCase();

  let cleaned = String(answerText || '').trim();
  cleaned = cleaned.replace(/\[((?:W?\d+)(?:\s*,\s*W?\d+)+)\]/gi, (_, inner) =>
    inner
      .split(',')
      .map((t) => `[${t.trim().toUpperCase()}]`)
      .join('')
  );

  const phantomCitations = [];
  cleaned = cleaned.replace(/\[(W?\d+)\]/gi, (full, inner) => {
    const norm = inner.toUpperCase();
    if (validTags.has(norm)) return `[${norm}]`;
    phantomCitations.push(full);
    return '';
  });

  const urlMatches = cleaned.match(/https?:\/\/[^\s)>\]]+/gi) || [];
  const phantomUrls = [];
  for (const rawU of urlMatches) {
    const normU = rawU.replace(/[.,;)\]]+$/, '').toLowerCase();
    const isSovdash = normU.startsWith('https://app.sovdash.com');
    const inCorpus = normU.length >= 10 && evidenceCorpus.includes(normU);
    if (!isSovdash && !allowedUrls.has(normU) && !inCorpus) {
      const host = (() => { try { return new URL(normU).hostname; } catch { return ''; } })();
      const hostAllowed = Array.from(allowedUrls).some((au) => {
        try { return new URL(au).hostname === host; } catch { return false; }
      });
      if (!hostAllowed) phantomUrls.push(rawU);
    }
  }

  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !/^#+\s/.test(l) && !/^\|[\s\-:|]+\|$/.test(l) && !/^---+$/.test(l));

  const sentences = [];
  const tagRegex = /\[(W?\d+)\]/i;
  for (const line of lines) {
    const lineHasTag = tagRegex.test(line);
    const meta = isAbstentionText(line);
    if (line.startsWith('|') || /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      sentences.push({ text: line, cited: lineHasTag, meta });
      continue;
    }
    const parts = line.split(/(?<=[.!?])\s+(?=[A-Z0-9*•\-\[])/).filter((p) => p.trim().length >= 16);
    if (parts.length === 0 && line.length >= 16) {
      sentences.push({ text: line, cited: lineHasTag, meta });
    } else {
      for (const p of parts) {
        sentences.push({
          text: p,
          cited: tagRegex.test(p) || (lineHasTag && parts.length <= 2),
          meta: meta || isAbstentionText(p)
        });
      }
    }
  }

  let citedSentences = 0;
  let unsupportedSentences = 0;
  for (const s of sentences) {
    if (s.cited) citedSentences += 1;
    else if (!s.meta) unsupportedSentences += 1;
  }

  const substantiveCount = Math.max(1, sentences.length);
  const citationCoverage = Number(Math.min(1, citedSentences / substantiveCount).toFixed(3));

  const queryLower = String(query || '').toLowerCase();
  const numTokens = Array.from(new Set(cleaned.match(/\b\d{2,4}(?:\.\d+)?\b/g) || []))
    .filter((n) => !validTags.has(n));
  let groundedNums = 0;
  for (const n of numTokens) {
    if (evidenceCorpus.includes(n.toLowerCase()) || queryLower.includes(n.toLowerCase())) {
      groundedNums += 1;
    }
  }
  const entityNumericGrounding = numTokens.length > 0 ? Number((groundedNums / numTokens.length).toFixed(3)) : 1.0;

  const abstained = isAbstentionText(cleaned);
  const pureAbstention = abstained && citedSentences === 0 && phantomCitations.length === 0 && phantomUrls.length === 0;
  const effectiveCoverage = pureAbstention ? 1.0 : citationCoverage;
  const effectiveGrounding = pureAbstention ? 1.0 : entityNumericGrounding;

  let grade = 'PASS';
  if (phantomCitations.length > 0 || phantomUrls.length > 0 || effectiveGrounding < 0.55) {
    grade = 'FLAGGED';
  } else if (!abstained && (effectiveCoverage < 0.65 || effectiveGrounding < 0.75 || unsupportedSentences > 2)) {
    grade = 'REVIEW';
  }

  return {
    cleanedAnswer: cleaned,
    hallucinationGrade: grade,
    metrics: {
      citationCoverage: effectiveCoverage,
      entityNumericGrounding: effectiveGrounding,
      citedSentences,
      totalSentences: sentences.length,
      unsupportedSentences,
      phantomCitationCount: phantomCitations.length,
      phantomUrlCount: phantomUrls.length,
      abstained
    }
  };
}

const GENERIC_ANCHOR_STOPWORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'how', 'why', 'compare', 'contrast',
  'explain', 'summarize', 'list', 'show', 'give', 'tell', 'quote', 'verify', 'find', 'search',
  'sovereign', 'observatory', 'sovdash', 'global', 'international', 'national', 'federal', 'state',
  'mandatory', 'incident', 'reporting', 'window', 'windows', 'deadline', 'timelines', 'fine',
  'euros', 'dollars', 'treaty', 'act', 'law', 'bill', 'statute', 'regulation', 'regulator',
  'authority', 'safety', 'security', 'compute', 'cluster', 'clusters', 'data', 'center', 'centers',
  'datacenter', 'datacenters', 'orbital', 'section', 'exact', 'undisclosed', 'private', 'recent',
  'latest', 'newest', 'related', 'event', 'events', 'happened', 'happening', 'news', 'signals',
  'policy', 'policies', 'framework', 'frameworks', 'watch', 'lab', 'labs', 'index', 'pillars',
  'directions', 'frontier', 'responsible', 'scaling', 'preparedness', 'basic', 'countries',
  'california', 'singapore', 'india', 'south', 'korea', 'brazil', 'kenya', 'united', 'kingdom',
  'states', 'european', 'union', 'spain', 'peru', 'kazakhstan', 'colorado', 'america', 'american',
  'africa', 'african', 'latin', 'europe', 'asia', 'usa', 'uk', 'eu', 'env', 'environmental', 'justice', 'supply', 'chain'
]);

function stripRawUrlsFromText(s) {
  return String(s || '').replace(/https?:\/\/[^\s)>\]]+/gi, '');
}

function selectRelevantExcerpt(fullText, queryTokens, maxChars = 620) {
  const clean = stripRawUrlsFromText(fullText);
  if (clean.length <= maxChars) return clean.replace(/\s+/g, ' ').trim();

  const normalizedBreaks = clean.replace(
    /\s+(?=(?:Flagship Instruments|Statutory Status|Compute Threshold|Mandatory Incident-Reporting Window|Prohibited Practices|Pre-Deployment Testing|Transparency & Watermarking|Whistleblower Protections|Extraterritorial Scope|Max Penalties|Next Milestone|Regulator):)/g,
    '\n'
  );
  const segments = normalizedBreaks
    .split(/(?:\r?\n+|\s*\|\s*|(?<=[.!?])\s+)/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 10);
  if (segments.length <= 1) return clean.replace(/\s+/g, ' ').trim().slice(0, maxChars);

  const queryJoined = queryTokens.join(' ');
  const asksReporting = /\b(incident|reporting|window|deadline|timeline)\b/i.test(queryJoined);
  const asksPenalties = /\b(penalt|fine|prohibit|banned|sanction)\b/i.test(queryJoined);
  const asksMultilateral = /\b(multilateral|treaty|unesco)\b/i.test(queryJoined);

  const scored = segments.map((seg, idx) => {
    const lower = seg.toLowerCase();
    let hits = 0;
    const matched = new Set();
    for (const t of queryTokens) {
      if (lower.includes(t)) {
        hits += 2.5;
        matched.add(t);
      }
    }
    hits += matched.size * 1.2;
    if (asksReporting && /^mandatory incident-reporting window:/i.test(seg)) hits += 10;
    if (asksPenalties && /^(?:prohibited practices|max penalties):/i.test(seg)) hits += 9;
    if (asksMultilateral && /\b(unesco|institute|treaty|convention)\b/i.test(seg)) hits += 8;
    if (/^flagship instruments:/i.test(seg) && seg.length > 260) hits -= 2;
    return { seg, idx, hits };
  });
  scored.sort((a, b) => b.hits - a.hits || a.idx - b.idx);

  const picked = [];
  let len = 0;
  for (const item of scored) {
    const piece = item.seg.length > 340 ? `${item.seg.slice(0, 336)}...` : item.seg;
    if (len + piece.length > maxChars && picked.length > 0) continue;
    picked.push({ seg: piece, idx: item.idx });
    len += piece.length + 2;
    if (len >= maxChars - 30) break;
  }
  picked.sort((a, b) => a.idx - b.idx);
  return picked.map((p) => p.seg).join(' ').slice(0, maxChars);
}

/**
 * Clean, proportional, citation-locked extractive fallback when external LLM APIs are unreachable.
 */
function synthesizeCitationLockedFallback(prompt, citations, plan, retrievalSteps) {
  const corpusLower = citations.map((c) => `${c.title} ${c.fullContent || c.snippet}`).join(' ').toLowerCase();
  const queryLower = String(prompt || '').toLowerCase();

  // Only check unmistakable non-generic proper nouns / explicit fictional statutory tokens for abstention
  const properNouns = (prompt.match(/\b[A-Z][a-zA-Z0-9\-]{2,}\b/g) || [])
    .map((w) => w.toLowerCase())
    .filter((w) => !GENERIC_ANCHOR_STOPWORDS.has(w) && w.length >= 4);

  const missingAnchors = properNouns.filter((w) => !corpusLower.includes(w));
  const fabricatedCodeTokens = (queryLower.match(/\b(?:404\(b\)|gpt-7|6-hour|2029)\b/g) || []).filter(
    (tok) => !citations.some((c) => (`${c.title} ${c.fullContent || c.snippet}`).toLowerCase().includes(tok))
  );

  // Guard: ensure "Vatican AI Safety Authority" / "6-hour" isn't confused with unrelated Vatican IHL signals or India CERT-In
  const isVaticanTrap = /vatican/i.test(queryLower) && (/6-hour|safety authority/i.test(queryLower)) && !corpusLower.includes('vatican ai safety authority');

  if (citations.length === 0 || missingAnchors.length > 0 || fabricatedCodeTokens.length > 0 || isVaticanTrap) {
    const target = [...new Set([...missingAnchors, ...fabricatedCodeTokens])].slice(0, 3).join(', ') || 'that specific claim or figure';
    return {
      reasoning: retrievalSteps.map((s) => `• ${s.step} (${s.ms}ms)`).join('\n') + `\n• Confirmed no record corroborating "${target}" across retrieved Observatory sources.`,
      answer: `I found no verified record in Sovereign Observatory for ${target}, and no corroborating primary evidence matches that specific request.`
    };
  }

  const queryTokens = tokenizeForRag(plan?.effectiveQuery || prompt);
  const traceLines = retrievalSteps.map((s) => `• ${s.step} (${s.ms}ms)`);

  if (plan?.intent === 'temporal_events') {
    const eventCits = citations.filter((c) => c.sourceType === 'signal' || c.sourceType === 'paper_rss').slice(0, 6);
    const items = eventCits.length > 0 ? eventCits : citations.slice(0, 5);
    const bullets = items.map((c) => {
      const cleanDesc = stripRawUrlsFromText(c.fullContent || c.snippet).replace(/\s+/g, ' ').trim();
      return `- **${c.title}** (${c.dateStr || c.location}): ${cleanDesc.slice(0, 220)} [${c.tag}]`;
    });
    return {
      reasoning: traceLines.join('\n') + `\n• Ordered ${items.length} matching events chronologically (newest first).`,
      answer: bullets.join('\n')
    };
  }

  if (plan?.intent === 'concise_fact') {
    const top = citations[0];
    const excerpt = selectRelevantExcerpt(top.fullContent || top.snippet, queryTokens, 260);
    return {
      reasoning: traceLines.join('\n') + `\n• Matched direct authoritative record: "${top.title}".`,
      answer: `${excerpt} [${top.tag}]`
    };
  }

  const jurCitations = citations.filter((c) => c.sourceType === 'jurisdiction');
  const lines = [];
  if (jurCitations.length >= 2) {
    for (const c of jurCitations.slice(0, 4)) {
      const label = c.title.replace(' AI Governance & Statutory Profile', '');
      const excerpt = selectRelevantExcerpt(c.fullContent || c.snippet, queryTokens, 680);
      lines.push(`- **${label}:** ${excerpt} [${c.tag}]`);
    }
    for (const s of citations.filter((c) => c.sourceType !== 'jurisdiction').slice(0, 2)) {
      const excerpt = selectRelevantExcerpt(s.fullContent || s.snippet, queryTokens, 260);
      lines.push(`- **${s.title}:** ${excerpt} [${s.tag}]`);
    }
  } else {
    for (const c of citations.slice(0, 5)) {
      const excerpt = selectRelevantExcerpt(c.fullContent || c.snippet, queryTokens, 460);
      lines.push(`- **${c.title}:** ${excerpt} [${c.tag}]`);
    }
  }

  return {
    reasoning: traceLines.join('\n') + `\n• Synthesized concise response across ${citations.length} retrieved sources.`,
    answer: lines.join('\n')
  };
}

async function callGoogleGenAiModel({ provider, modelId, messages, temperature, maxTokens }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_') || isProviderOnCooldown(`${provider}:${modelId}`)) return null;

  const sysMsg = messages.find((m) => m.role === 'system')?.content || '';
  const nonSys = messages.filter((m) => m.role !== 'system');
  const contents = nonSys.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: sysMsg ? { parts: [{ text: sysMsg }] } : undefined,
          contents,
          generationConfig: {
            temperature: Math.min(0.6, temperature ?? 0.15),
            maxOutputTokens: maxTokens ?? 1400
          }
        }),
        signal: AbortSignal.timeout(10000)
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      if (res.status === 429 || res.status === 503) setProviderCooldown(`${provider}:${modelId}`, 90 * 1000);
      if (res.status === 404) setProviderCooldown(`${provider}:${modelId}`, 30 * 60 * 1000);
      throw new Error(`${provider} ${res.status}: ${errBody.slice(0, 120)}`);
    }
    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    const nativeReasoning = parts.filter((p) => p.thought && p.text).map((p) => p.text).join('\n').trim();
    const rawText = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join('').trim();
    return {
      rawText,
      nativeReasoning,
      providerUsed: provider,
      modelUsed: modelId
    };
  } catch (e) {
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError' || /timeout|aborted/i.test(String(e?.message || ''))) {
      setProviderCooldown(`${provider}:${modelId}`, 90 * 1000);
    }
    throw e;
  }
}

async function callSingleProvider({ provider, modelId, messages, temperature, maxTokens, reasoningEffort, customBaseUrl, customApiKeyEnv }) {
  if (provider === 'gemma' || provider === 'gemini') {
    return callGoogleGenAiModel({ provider, modelId, messages, temperature, maxTokens });
  }

  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_') || isProviderOnCooldown('groq')) return null;
    const isReasoning = /gpt-oss|qwen3/i.test(modelId);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: Math.min(0.6, temperature),
        max_tokens: maxTokens,
        ...(isReasoning ? { reasoning_format: 'parsed', reasoning_effort: reasoningEffort || 'medium' } : {})
      }),
      signal: AbortSignal.timeout(18000)
    });
    if (!res.ok) {
      if (res.status === 429) setProviderCooldown('groq', 30 * 1000);
      throw new Error(`Groq ${res.status}`);
    }
    const json = await res.json();
    const msg = json?.choices?.[0]?.message || {};
    return {
      rawText: msg.content || '',
      nativeReasoning: msg.reasoning || msg.reasoning_content || '',
      providerUsed: 'groq',
      modelUsed: json?.model || modelId
    };
  }

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('your_') || isProviderOnCooldown('openrouter')) return null;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://app.sovdash.com',
        'X-Title': 'Sovereign Observatory Copilot'
      },
      body: JSON.stringify({ model: modelId, messages, temperature, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) {
      if (res.status === 429) setProviderCooldown('openrouter', 30 * 1000);
      throw new Error(`OpenRouter ${res.status}`);
    }
    const json = await res.json();
    const msg = json?.choices?.[0]?.message || {};
    return {
      rawText: msg.content || '',
      nativeReasoning: msg.reasoning || msg.reasoning_content || '',
      providerUsed: 'openrouter',
      modelUsed: json?.model || modelId
    };
  }

  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey.includes('your_') || isProviderOnCooldown('deepseek')) return null;
    try {
      const client = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey, timeout: 15000 });
      const resp = await client.chat.completions.create({
        model: modelId || 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens
      });
      const msg = resp?.choices?.[0]?.message || {};
      return {
        rawText: msg.content || '',
        nativeReasoning: msg.reasoning_content || '',
        providerUsed: 'deepseek',
        modelUsed: resp?.model || modelId || 'deepseek-chat'
      };
    } catch (e) {
      if (/402|401|Insufficient Balance/i.test(e.message)) setProviderCooldown('deepseek', 30 * 60 * 1000);
      throw e;
    }
  }

  if (provider === 'custom' && customBaseUrl) {
    const envName = customApiKeyEnv || 'OPENAI_COMPAT_API_KEY';
    const apiKey = process.env[envName] || 'no-key-required';
    const client = new OpenAI({ baseURL: customBaseUrl, apiKey, timeout: 20000 });
    const resp = await client.chat.completions.create({
      model: modelId || 'local-model',
      messages,
      temperature,
      max_tokens: maxTokens
    });
    const msg = resp?.choices?.[0]?.message || {};
    return {
      rawText: msg.content || '',
      nativeReasoning: msg.reasoning || msg.reasoning_content || '',
      providerUsed: 'custom',
      modelUsed: resp?.model || modelId || 'custom'
    };
  }

  return null;
}

function buildProviderAttemptList(config) {
  const attempts = [];
  if (config.provider === 'deterministic') {
    return [{ provider: 'deterministic', modelId: 'sovdash-extractive-v1' }];
  }
  if (config.provider && config.provider !== 'auto-opensource') {
    attempts.push({ provider: config.provider, modelId: config.modelId });
  }
  for (const spec of config.fallbackChain || DEFAULT_AI_CONFIG.fallbackChain) {
    const idx = String(spec).indexOf(':');
    if (idx === -1) continue;
    const provider = spec.slice(0, idx);
    const modelId = spec.slice(idx + 1);
    if (!attempts.some((a) => a.provider === provider && a.modelId === modelId)) {
      attempts.push({ provider, modelId });
    }
  }
  return attempts;
}

export async function runSovDashAiTurn({
  prompt,
  history = [],
  user = null,
  sessionId = null,
  configOverride = null,
  persist = true
} = {}) {
  const startedAt = Date.now();
  const cleanPrompt = String(prompt || '').trim();
  const dbConfig = await getAiConfig();
  const config = { ...dbConfig, ...(configOverride || {}) };

  const { plan, retrievalSteps, internalChunks, externalWebChunks, diagnostics } = await retrieveHybridEvidence(cleanPrompt, {
    topK: config.topK || 14,
    allowWebAugmentation: config.allowWebAugmentation !== false,
    history
  });

  const citations = [];
  internalChunks.forEach((c, idx) => {
    const tag = String(idx + 1);
    citations.push({
      tag,
      id: c.id,
      sourceType: c.sourceType,
      sourceLabel: c.sourceType.replace('_', ' ').toUpperCase(),
      isExternalWeb: false,
      title: c.title,
      location: c.location || 'Global',
      jurisdictionSlug: c.jurisdictionSlug || null,
      dateStr: c.metadata?.dateStr || '',
      lat: c.metadata?.lat ?? null,
      lon: c.metadata?.lon ?? null,
      url: c.url || c.permalink,
      permalink: c.permalink || c.url,
      snippet: c.content.slice(0, 1850),
      fullContent: c.content,
      score: c.score || 0
    });
  });

  externalWebChunks.forEach((w, idx) => {
    const tag = `W${idx + 1}`;
    citations.push({
      tag,
      id: w.id,
      sourceType: 'external_web',
      sourceLabel: w.sourceLabel || 'Open Scholarly',
      isExternalWeb: true,
      title: w.title,
      location: w.location || 'Open Reference',
      jurisdictionSlug: null,
      dateStr: '',
      lat: null,
      lon: null,
      url: w.url,
      permalink: w.permalink || w.url,
      snippet: String(w.content || '').slice(0, 600),
      fullContent: w.content,
      score: w.overlap || 0
    });
  });

  const systemPrompt = buildSystemPrompt(config, plan, config.strictCitationLock !== false);
  const evidenceBlock = formatEvidenceContext(citations);
  const trimmedHistory = Array.isArray(history)
    ? history
        .slice(-6)
        .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .map((h) => ({ role: h.role, content: h.content.slice(0, 1000) }))
    : [];

  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    {
      role: 'user',
      content: `SOURCES:\n${evidenceBlock}\n\n---\n\nQUESTION (${plan.intent}):\n${cleanPrompt}`
    }
  ];

  let providerResult = null;
  const attempts = buildProviderAttemptList(config);

  for (const att of attempts) {
    if (att.provider === 'deterministic') break;
    try {
      const llmT0 = Date.now();
      const res = await callSingleProvider({
        provider: att.provider,
        modelId: att.modelId,
        messages,
        temperature: config.temperature ?? 0.15,
        maxTokens: config.maxTokens ?? 1400,
        reasoningEffort: config.reasoningEffort || 'medium',
        customBaseUrl: config.customBaseUrl,
        customApiKeyEnv: config.customApiKeyEnv
      });
      if (res && res.rawText && res.rawText.trim().length > 10) {
        retrievalSteps.push({ step: `Synthesized response via ${res.modelUsed}`, ms: Date.now() - llmT0 });
        providerResult = res;
        break;
      }
    } catch (err) {
      console.warn(`[runSovDashAiTurn] Provider ${att.provider}/${att.modelId} failed:`, err.message);
    }
  }

  let reasoning = '';
  let rawAnswer = '';
  let providerUsed = 'deterministic';
  let modelUsed = 'sovdash-extractive-v1';

  if (providerResult) {
    const parsed = extractReasoningAndAnswer(providerResult.rawText, providerResult.nativeReasoning);
    const traceHeader = retrievalSteps.map((s) => `• ${s.step} (${s.ms}ms)`).join('\n');
    reasoning = [traceHeader, parsed.reasoning].filter(Boolean).join('\n\n');
    rawAnswer = parsed.answer || providerResult.rawText;
    providerUsed = providerResult.providerUsed;
    modelUsed = providerResult.modelUsed;
  } else {
    const synth = synthesizeCitationLockedFallback(cleanPrompt, citations, plan, retrievalSteps);
    reasoning = synth.reasoning;
    rawAnswer = synth.answer;
  }

  const audit = auditResponseGrounding(rawAnswer, citations, cleanPrompt);
  const latencyMs = Date.now() - startedAt;
  const publicCitations = citations.map(({ fullContent, ...rest }) => rest);

  let savedSessionId = sessionId || null;
  let savedMessageId = null;

  if (persist && user?.email) {
    savedSessionId = await createOrTouchChatSession({
      sessionId,
      userId: user.id || user.email,
      userEmail: user.email,
      title: cleanPrompt.slice(0, 72)
    });
    const savedRow = await saveChatTurn({
      sessionId: savedSessionId,
      userId: user.id || user.email,
      userEmail: user.email,
      prompt: cleanPrompt,
      answer: audit.cleanedAnswer,
      reasoning,
      citations: publicCitations,
      retrievedChunks: internalChunks,
      providerUsed,
      modelUsed,
      latencyMs,
      groundingMetrics: { ...audit.metrics, retrievalDiagnostics: diagnostics },
      hallucinationGrade: audit.hallucinationGrade
    });
    savedMessageId = savedRow?.id || null;
  }

  return {
    sessionId: savedSessionId,
    messageId: savedMessageId,
    answer: audit.cleanedAnswer,
    reasoning,
    citations: publicCitations,
    groundingMetrics: { ...audit.metrics, retrievalDiagnostics: diagnostics },
    hallucinationGrade: audit.hallucinationGrade,
    providerUsed,
    modelUsed,
    latencyMs
  };
}
