import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  DEFAULT_AI_CONFIG,
  createOrTouchChatSession,
  getAiConfig,
  saveChatTurn
} from './sovdashAiDb.js';
import { retrieveHybridEvidence, tokenizeForRag } from './sovdashRag.js';

const providerCooldownUntil = new Map();

function isProviderOnCooldown(provider) {
  const until = providerCooldownUntil.get(provider);
  return Boolean(until && Date.now() < until);
}

function setProviderCooldown(provider, ms) {
  providerCooldownUntil.set(provider, Date.now() + ms);
}

const ABSTENTION_PATTERNS = [
  /not (?:found|tracked|documented|present|verified|disclosed|available) in/i,
  /no verified (?:record|evidence|statute|data|information)/i,
  /cannot verify/i,
  /do not have verified/i,
  /does not contain/i,
  /insufficient verified evidence/i,
  /\bunknown\b/i,
  /unverified in (?:the )?(?:sovdash|observatory|archive)/i,
  /unable to confirm/i
];

export function isAbstentionText(text) {
  const s = String(text || '');
  return ABSTENTION_PATTERNS.some((rx) => rx.test(s));
}

export function getProviderKeyStatus() {
  return {
    groq: Boolean(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('your_')),
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes('your_')),
    gemini: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')),
    custom: Boolean(process.env.CUSTOM_AI_BASE_URL || process.env.OPENAI_COMPAT_BASE_URL)
  };
}

function buildSystemPrompt(config, hasEvidence, strictLock = true) {
  const addon = config?.systemPromptAddon ? `\nAdditional Observatory Guidance:\n${config.systemPromptAddon}\n` : '';
  return `You are **SovDash AI**, the citation-locked research copilot inside Sovereign Observatory (app.sovdash.com).
You assist legal scholars, AI safety researchers, and policy analysts using verified Observatory databases and optional open-scholarly augmentation.

STRICT OPERATING RULES:
1. Think concisely first inside <reasoning>...</reasoning> tags (2-4 crisp analytical bullets on what evidence matches, multi-jurisdiction angles, and any missing gaps). Then output the user-facing response OUTSIDE <reasoning> tags.
2. ${strictLock ? 'CITATION-LOCK MANDATE: Every factual sentence, statutory clause, time window, threshold, MW/CO2 figure, or enforcement action MUST cite the matching source tag inline like [1], [2] (for internal SovDash records) or [W1] (for open scholarly web records). NEVER invent citation numbers outside the provided evidence.' : 'Cite relevant evidence tags [1], [2], [W1] on all factual claims.'}
3. ZERO FABRICATION & EPISTEMIC HUMILITY:
   - Never fabricate statutes, dates, penalties, reporting hours/days, URLs, or organizations that do not appear verbatim or strictly implied in the evidence.
   - If the evidence does not cover part or all of the prompt, explicitly state what is **Verified** vs **Unknown / Not Tracked in SovDash** rather than guessing.
   - If the query asks about a non-existent law, private undisclosed data, or fictional entity (${hasEvidence ? 'or if evidence overlap is near zero' : 'no relevant evidence found'}), cleanly abstain and state that SovDash has no verified record.
4. RESPONSE STYLE:
   - Be concise, objective, analytical, and structured (short comparative bullets or compact markdown table when comparing 2+ jurisdictions).
   - Briefly present distinct regulatory or technical perspectives where relevant (e.g., statutory binding deadlines vs. implementing ministerial decree flexibility).
   - End with a short "**Verified vs. Unknown**" note whenever nuance or secondary implementing rules exist.${addon}`;
}

function formatEvidenceContext(citations) {
  if (!citations.length) {
    return 'NO VERIFIED EVIDENCE CHUNKS RETRIEVED FOR THIS QUERY.';
  }
  return citations
    .map((c) => {
      const urlLine = c.url && c.url !== c.permalink ? `Primary URL: ${c.url} | SovDash: ${c.permalink}` : `URL: ${c.permalink || c.url}`;
      return `[${c.tag}] (${c.sourceLabel}) — ${c.title}${c.location ? ` [${c.location}]` : ''}\n${urlLine}\nContent: ${c.snippet}`;
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
    const headingSplit = answer.search(/\n#{2,3}\s+/);
    const boldSplit = answer.search(/\n\*\*(?!Verified vs\. Unknown)[A-Z][^*\n]{2,60}:\*\*/);
    const splitIdx = headingSplit !== -1 ? headingSplit : boldSplit;
    if (splitIdx > 20 && splitIdx < answer.length - 40) {
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
 * Deterministic Post-Generation Sentence-Level Citation & Grounding Auditor.
 * Checks phantom citation tags, phantom URLs, sentence citation coverage, and numeric/entity grounding.
 */
export function auditResponseGrounding(answerText, citations = [], query = '') {
  const validTags = new Set(citations.map((c) => String(c.tag).toUpperCase()));
  const allowedUrls = new Set(
    citations
      .flatMap((c) => [c.url, c.permalink])
      .filter(Boolean)
      .map((u) => String(u).replace(/[.,;)\]]+$/, '').toLowerCase())
  );
  const evidenceCorpus = citations.map((c) => `${c.title} ${c.location} ${c.snippet} ${c.fullContent || ''}`).join(' ').toLowerCase();

  let cleaned = String(answerText || '').trim();
  // Normalize grouped comma citations like [1, 2, 10] or [W1, 3] into discrete clickable [1][2][10] tags
  cleaned = cleaned.replace(/\[((?:W?\d+)(?:\s*,\s*W?\d+)+)\]/gi, (_, inner) =>
    inner
      .split(',')
      .map((t) => `[${t.trim().toUpperCase()}]`)
      .join('')
  );

  const phantomCitations = [];

  // Strip or neutralize out-of-range bracket citations like [99] or [W9]
  cleaned = cleaned.replace(/\[(W?\d+)\]/gi, (full, inner) => {
    const norm = inner.toUpperCase();
    if (validTags.has(norm)) return `[${norm}]`;
    phantomCitations.push(full);
    return '';
  });

  // Check raw URLs emitted in answer against evidence URLs + trusted sovdash domain + verbatim evidence corpus
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
      if (!hostAllowed) {
        phantomUrls.push(rawU);
      }
    }
  }

  // Analyze substantive declarative lines/sentences (inheriting line/bullet-level citation tags like `...text. [1]`)
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !/^#+\s/.test(l) && !/^\|[\s\-:|]+\|$/.test(l) && !/^---+$/.test(l) && !/^\*\*(?:verified vs\. unknown|note \/ limitations)/i.test(l));

  const sentences = [];
  const tagRegex = /\[(W?\d+)\]/i;
  let citedSentences = 0;
  let unsupportedSentences = 0;

  for (const line of lines) {
    const lineHasTag = tagRegex.test(line);
    const isMetaDisclaimer = /\*\*verified vs\. unknown\*\*|^note:/i.test(line) || isAbstentionText(line);
    if (line.startsWith('|') || /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      sentences.push({ text: line, cited: lineHasTag, meta: isMetaDisclaimer });
      continue;
    }
    const parts = line.split(/(?<=[.!?])\s+(?=[A-Z0-9*•\-\[])/).filter((p) => p.trim().length >= 18);
    if (parts.length === 0 && line.length >= 18) {
      sentences.push({ text: line, cited: lineHasTag, meta: isMetaDisclaimer });
    } else {
      for (const p of parts) {
        sentences.push({
          text: p,
          cited: tagRegex.test(p) || (lineHasTag && parts.length <= 2),
          meta: isMetaDisclaimer || isAbstentionText(p)
        });
      }
    }
  }

  for (const s of sentences) {
    if (s.cited) {
      citedSentences += 1;
    } else if (!s.meta) {
      unsupportedSentences += 1;
    }
  }

  const substantiveCount = Math.max(1, sentences.length);
  const citationCoverage = Number(Math.min(1, citedSentences / substantiveCount).toFixed(3));

  // Verify significant multi-digit numbers / statutory tokens emitted in answer appear in evidence or query
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
  } else if (!abstained && (effectiveCoverage < 0.7 || effectiveGrounding < 0.75 || unsupportedSentences > 2)) {
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

const GENERIC_QUERY_WORDS = new Set([
  'sovereign', 'observatory', 'sovdash', 'tracked', 'mandatory', 'incident', 'reporting',
  'deadline', 'fine', 'euros', 'dollars', 'treaty', 'act', 'authority', 'safety', 'compute',
  'orbital', 'quote', 'section', 'exact', 'undisclosed', 'private', 'bill', 'paid',
  'training', 'last', 'tuesday', 'enacted', 'list', 'specific', 'under', 'compare',
  'explain', 'summarize', 'regulation', 'ai', 'model', 'global', 'system', 'data',
  'watch', 'lab', 'labs', 'policy', 'framework', 'index', 'pillars', 'directions',
  'frontier', 'responsible', 'scaling', 'preparedness', 'basic', 'california',
  'singapore', 'india', 'south', 'korea', 'brazil', 'kenya', 'united', 'kingdom',
  'states', 'european', 'union', 'windows', 'timelines', 'against', 'across', 'between'
]);

function stripRawUrlsFromText(s) {
  return String(s || '').replace(/https?:\/\/[^\s)>\]]+/gi, '');
}

function selectRelevantExcerpt(fullText, queryTokens, maxChars = 680) {
  const clean = stripRawUrlsFromText(fullText);
  if (clean.length <= maxChars) return clean.replace(/\s+/g, ' ').trim();

  // Split preserving newlines, labeled diff fields, and pipe-delimited milestone entries
  const normalizedBreaks = clean.replace(
    /\s+(?=(?:Flagship Instruments|Statutory Status|Compute Threshold|Mandatory Incident-Reporting Window|Prohibited Practices|Pre-Deployment Testing|Transparency & Watermarking|Whistleblower Protections|Extraterritorial Scope|Max Penalties|Next Milestone):)/g,
    '\n'
  );
  const segments = normalizedBreaks
    .split(/(?:\r?\n+|\s*\|\s*|(?<=[.!?])\s+)/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 12);
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
    // Penalize oversized catch-all Flagship Instruments blurb so crisp statutory fields fit easily
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
 * Guaranteed-available citation-locked analytical synthesizer.
 * Used when configured LLM providers have no keys in the runtime environment or encounter rate-limits/outages.
 */
function synthesizeCitationLockedFallback(prompt, citations, diagnostics) {
  const maxOverlap = diagnostics?.maxOverlap || 0;
  const maxVec = diagnostics?.maxVectorSimilarity || 0;
  const queryLower = String(prompt || '').toLowerCase();
  const corpusLower = citations.map((c) => `${c.title} ${c.fullContent || c.snippet}`).join(' ').toLowerCase();

  const properNouns = (prompt.match(/\b[A-Z][a-zA-Z0-9\-]{2,}\b/g) || [])
    .map((w) => w.toLowerCase())
    .filter((w) => !GENERIC_QUERY_WORDS.has(w) && !/^(what|when|where|which|how|compare|explain|list|quote|summarize|verify)$/.test(w));

  const missingAnchors = properNouns.filter((w) => !corpusLower.includes(w));
  const specificCodeTokens = (queryLower.match(/\b(?:404\(b\)|gpt-\d+|6-hour|2029)\b/g) || []).filter(
    (tok) => !citations.some((c) => (`${c.title} ${c.fullContent || c.snippet}`).toLowerCase().includes(tok))
  );
  const queryTokens = tokenizeForRag(prompt);
  const rareTerms = queryTokens.filter((t) => !GENERIC_QUERY_WORDS.has(t) && t.length >= 4 && !corpusLower.includes(t));

  const internalCount = citations.filter((c) => !c.isExternalWeb).length;
  const weakOverlap = citations.length === 0 || (maxOverlap < 0.16 && maxVec < 0.25 && internalCount === 0);

  if (weakOverlap || missingAnchors.length > 0 || specificCodeTokens.length > 0 || (rareTerms.length >= 2 && rareTerms.length >= queryTokens.length * 0.4)) {
    const missingDesc = [...new Set([...missingAnchors, ...specificCodeTokens, ...rareTerms])].slice(0, 4).join(', ');
    return {
      reasoning: `Checked indexed SovDash pgvector chunks. Missing verified primary evidence for discriminating entities or claims (${missingDesc || 'low overlap'}). Triggering strict citation-lock abstention.`,
      answer: `### Verification Result: No Verified Record in SovDash\n\nI cannot verify specific statutory obligations, deadlines, or figures for **"${prompt.slice(0, 140)}"** because Sovereign Observatory's verified archive contains no primary evidence corroborating **${missingDesc || 'the requested instrument or figure'}**.\n\n**Verified vs. Unknown**\n- **Verified:** SovDash indexes verified statutes, Frontier Lab safety frameworks, compute clusters, and live OSINT/OONI telemetry within the Observatory.\n- **Unknown / Not Tracked in SovDash:** The specific statute, clause, deadline, or undisclosed metric requested (${missingDesc || 'query target'}) is not found in primary sources, so no figures are extrapolated.`
    };
  }

  const lines = [];
  const jurCitations = citations.filter((c) => c.sourceType === 'jurisdiction');

  if (jurCitations.length >= 2) {
    lines.push(`### Cross-Jurisdictional Comparison (${jurCitations.map((j) => j.title.replace(' AI Governance & Statutory Profile', '')).join(' vs. ')})`);
    lines.push('');
    for (const c of jurCitations.slice(0, 4)) {
      const label = c.title.replace(' AI Governance & Statutory Profile', '');
      const excerpt = selectRelevantExcerpt(c.fullContent || c.snippet, queryTokens, 720);
      lines.push(`- **${label}:** ${excerpt} [${c.tag}]`);
    }
    const supplemental = citations.filter((c) => c.sourceType !== 'jurisdiction').slice(0, 3);
    if (supplemental.length > 0) {
      lines.push('');
      lines.push('### Corroborating Observatory Records & Perspectives');
      for (const s of supplemental) {
        const excerpt = selectRelevantExcerpt(s.fullContent || s.snippet, queryTokens, 320);
        lines.push(`- **${s.title}** (${s.sourceLabel}): ${excerpt} [${s.tag}]`);
      }
    }
  } else {
    lines.push(`### Citation-Locked Research Synthesis`);
    lines.push('');
    for (const c of citations.slice(0, 6)) {
      const excerpt = selectRelevantExcerpt(c.fullContent || c.snippet, queryTokens, 660);
      lines.push(`- **${c.title}** (${c.sourceLabel}): ${excerpt} [${c.tag}]`);
    }
  }

  lines.push('');
  lines.push('**Verified vs. Unknown**');
  lines.push(`- **Verified:** All factual claims above map directly to [${citations.slice(0, 6).map((c) => c.tag).join('], [')}] across the SovDash pgvector corpus${citations.some((c) => c.isExternalWeb) ? ' and tagged external scholarly sources' : ''}.`);
  lines.push('- **Note / Limitations:** Subordinate implementing notices or unpublished internal disclosures outside the cited primary records are treated as unverified rather than inferred.');

  const reasoning = [
    `Retrieved ${citations.length} citation-locked evidence records via Neon pgvector + lexical RRF (max overlap ${maxOverlap}, vector sim ${maxVec}).`,
    `Jurisdictions explicitly matched: ${diagnostics?.mentionedJurisdictions?.length ? diagnostics.mentionedJurisdictions.join(', ') : 'multi-domain'}.`,
    `Extracted query-relevant clauses directly from verified records with zero ungrounded extrapolation.`
  ].join('\n');

  return { reasoning, answer: lines.join('\n') };
}

async function callSingleProvider({ provider, modelId, messages, temperature, maxTokens, reasoningEffort, customBaseUrl, customApiKeyEnv }) {
  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.includes('your_')) return null;
    const isReasoning = /gpt-oss|qwen3/i.test(modelId);
    const body = {
      model: modelId,
      messages,
      temperature: Math.min(0.6, temperature),
      max_tokens: maxTokens,
      ...(isReasoning ? { reasoning_format: 'parsed', reasoning_effort: reasoningEffort || 'medium' } : {})
    };
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(18000)
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
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
    if (!apiKey || apiKey.includes('your_')) return null;
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://app.sovdash.com',
        'X-Title': 'Sovereign Observatory Copilot'
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
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

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_') || isProviderOnCooldown('gemini')) return null;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelId || 'gemini-2.5-flash' });
      const combinedPrompt = messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');
      const result = await model.generateContent(combinedPrompt);
      return {
        rawText: result.response?.text() || '',
        nativeReasoning: '',
        providerUsed: 'gemini',
        modelUsed: modelId || 'gemini-2.5-flash'
      };
    } catch (e) {
      if (/429|Quota exceeded/i.test(e.message)) setProviderCooldown('gemini', 45 * 1000);
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

  const { internalChunks, externalWebChunks, diagnostics } = await retrieveHybridEvidence(cleanPrompt, {
    topK: config.topK || 12,
    allowWebAugmentation: config.allowWebAugmentation !== false
  });

  // Assign deterministic citation tags: [1]..[N] for internal SovDash records, [W1]..[Wm] for open scholarly web
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
      sourceLabel: w.sourceLabel || 'Open Web Scholarly',
      isExternalWeb: true,
      title: w.title,
      location: w.location || 'Open Reference',
      jurisdictionSlug: null,
      url: w.url,
      permalink: w.permalink || w.url,
      snippet: String(w.content || '').slice(0, 600),
      fullContent: w.content,
      score: w.overlap || 0
    });
  });

  const systemPrompt = buildSystemPrompt(config, citations.length > 0, config.strictCitationLock !== false);
  const evidenceBlock = formatEvidenceContext(citations);
  const trimmedHistory = Array.isArray(history)
    ? history
        .slice(-6)
        .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .map((h) => ({ role: h.role, content: h.content.slice(0, 1200) }))
    : [];

  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    {
      role: 'user',
      content: `VERIFIED EVIDENCE SOURCES:\n${evidenceBlock}\n\n---\n\nRESEARCHER QUESTION:\n${cleanPrompt}`
    }
  ];

  let providerResult = null;
  const attempts = buildProviderAttemptList(config);

  for (const att of attempts) {
    if (att.provider === 'deterministic') break;
    try {
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
      if (res && res.rawText && res.rawText.trim().length > 20) {
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
    reasoning = parsed.reasoning;
    rawAnswer = parsed.answer || providerResult.rawText;
    providerUsed = providerResult.providerUsed;
    modelUsed = providerResult.modelUsed;
  } else {
    const synth = synthesizeCitationLockedFallback(cleanPrompt, citations, diagnostics);
    reasoning = synth.reasoning;
    rawAnswer = synth.answer;
  }

  const audit = auditResponseGrounding(rawAnswer, citations, cleanPrompt);
  const latencyMs = Date.now() - startedAt;

  // Compact citations payload returned to client (omit bulky fullContent)
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
