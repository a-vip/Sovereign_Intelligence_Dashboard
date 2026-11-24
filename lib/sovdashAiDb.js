import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const LOCAL_AI_CHUNKS_FILE = path.resolve('ai-chunks-local.json');
const LOCAL_AI_CONFIG_FILE = path.resolve('ai-config-local.json');
const LOCAL_AI_SESSIONS_FILE = path.resolve('ai-sessions-local.json');
const LOCAL_AI_MESSAGES_FILE = path.resolve('ai-messages-local.json');
const LOCAL_AI_EVALS_FILE = path.resolve('ai-evals-local.json');

export const EMBEDDING_DIM = 256;

export const OPEN_SOURCE_MODEL_PRESETS = [
  {
    id: 'auto-opensource:best',
    provider: 'auto-opensource',
    modelId: 'gemini-3-flash-preview',
    label: 'Auto Reasoning Cascade (Recommended)',
    cost: '$0 Free Tier',
    notes: 'Automatically routes to the fastest reasoning model: Groq GPT-OSS 120B / Qwen3 → OpenRouter :free → Gemini 3 Flash Preview (Thinking) → Gemini Flash Lite → Gemma 4.'
  },
  {
    id: 'gemini:gemini-3-flash-preview',
    provider: 'gemini',
    modelId: 'gemini-3-flash-preview',
    label: 'Google Gemini 3 Flash · Native Thinking & Reasoning',
    cost: '$0 Free Tier',
    notes: 'Fast multi-step thinking model with native thought traces via GEMINI_API_KEY.'
  },
  {
    id: 'gemini:gemini-flash-lite-latest',
    provider: 'gemini',
    modelId: 'gemini-flash-lite-latest',
    label: 'Google Gemini Flash Lite Latest (High-RPM)',
    cost: '$0 Free Tier',
    notes: 'High-availability fast fallback via GEMINI_API_KEY.'
  },
  {
    id: 'gemma:gemma-4-31b-it',
    provider: 'gemma',
    modelId: 'gemma-4-31b-it',
    label: 'Google Gemma 4 · 31B Open-Weights',
    cost: '$0 Free Tier',
    notes: 'Open-weights 31B Gemma 4 model via GEMINI_API_KEY.'
  },
  {
    id: 'gemma:gemma-4-26b-a4b-it',
    provider: 'gemma',
    modelId: 'gemma-4-26b-a4b-it',
    label: 'Google Gemma 4 · 26B-A4B MoE Open-Weights',
    cost: '$0 Free Tier',
    notes: 'Fast open-weights 26B Mixture-of-Experts Gemma 4 model.'
  },
  {
    id: 'groq:openai/gpt-oss-120b',
    provider: 'groq',
    modelId: 'openai/gpt-oss-120b',
    label: 'Groq Free · OpenAI GPT-OSS 120B (Reasoning)',
    cost: '$0 Free Tier',
    notes: '120B open-weight MoE reasoning model with native parsed reasoning trace via Groq LPU (requires GROQ_API_KEY).'
  },
  {
    id: 'groq:qwen/qwen3-32b',
    provider: 'groq',
    modelId: 'qwen/qwen3-32b',
    label: 'Groq Free · Qwen 3 32B (Reasoning)',
    cost: '$0 Free Tier',
    notes: 'Fast open-weights multilingual reasoning model via Groq (requires GROQ_API_KEY).'
  },
  {
    id: 'groq:llama-3.3-70b-versatile',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    label: 'Groq Free · Meta Llama 3.3 70B Versatile',
    cost: '$0 Free Tier',
    notes: 'High-throughput 70B open-weight instruct model via Groq (requires GROQ_API_KEY).'
  },
  {
    id: 'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    modelId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'OpenRouter :free · NVIDIA Nemotron 3 Ultra 550B',
    cost: '$0 Free Tier',
    notes: 'Open-weights frontier-scale MoE reasoning model routed free via OpenRouter (requires OPENROUTER_API_KEY).'
  },
  {
    id: 'openrouter:deepseek/deepseek-r1:free',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-r1:free',
    label: 'OpenRouter :free · DeepSeek R1',
    cost: '$0 Free Tier',
    notes: 'Open-weights step-by-step reasoning model on OpenRouter free tier (requires OPENROUTER_API_KEY).'
  },
  {
    id: 'deepseek:deepseek-chat',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    label: 'DeepSeek · deepseek-chat (Open Weights)',
    cost: 'API Key',
    notes: 'Direct DeepSeek API using DEEPSEEK_API_KEY.'
  },
  {
    id: 'deterministic:citation-synthesizer',
    provider: 'deterministic',
    modelId: 'sovdash-extractive-v1',
    label: 'Deterministic Extractive Synthesizer (Zero External LLM)',
    cost: '$0 Offline / Sovereign',
    notes: '100% deterministic extractive briefing with zero external LLM calls.'
  }
];

export const DEFAULT_AI_CONFIG = {
  provider: 'auto-opensource',
  modelId: 'gemini-3.5-flash',
  fallbackChain: [
    'groq:openai/gpt-oss-120b',
    'groq:qwen/qwen3-32b',
    'groq:llama-3.3-70b-versatile',
    'openrouter:nvidia/nemotron-3-ultra-550b-a55b:free',
    'openrouter:deepseek/deepseek-r1:free',
    'gemini:gemini-3.5-flash',
    'gemini:gemini-3.6-flash',
    'gemini:gemini-flash-lite-latest',
    'gemini:gemini-3.5-flash-lite',
    'gemini:gemini-3-flash-preview',
    'gemini:gemini-omni-1.1-flash',
    'gemma:gemma-4-26b-a4b-it',
    'gemma:gemma-4-31b-it'
  ],
  temperature: 0.2,
  maxTokens: 1800,
  reasoningEffort: 'medium',
  topK: 14,
  allowWebAugmentation: true,
  strictCitationLock: true,
  customBaseUrl: '',
  customApiKeyEnv: '',
  systemPromptAddon: ''
};

let aiInitPromise = null;
let detectedPgVector = false;

function readLocalJson(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {}
  return fallback;
}

function writeLocalJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[sovdashAiDb] Failed local JSON write:', err.message);
  }
}

export function cosineSimilarityArrays(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = Number(a[i]) || 0;
    const vb = Number(b[i]) || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

export async function ensureAiTables() {
  if (!process.env.POSTGRES_URL) {
    detectedPgVector = false;
    return { ready: true, hasPgVector: false, mode: 'local-json' };
  }
  if (aiInitPromise) return aiInitPromise;

  aiInitPromise = (async () => {
    try {
      let hasVec = false;
      try {
        await sql`CREATE EXTENSION IF NOT EXISTS vector`;
        hasVec = true;
      } catch (extErr) {
        console.warn('[sovdashAiDb] pgvector extension unavailable, falling back to TEXT embeddings:', extErr.message);
      }
      detectedPgVector = hasVec;

      if (hasVec) {
        await sql`
          CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
            id TEXT PRIMARY KEY,
            source_type TEXT NOT NULL,
            source_id TEXT,
            title TEXT NOT NULL,
            location TEXT,
            jurisdiction_slug TEXT,
            url TEXT,
            permalink TEXT,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            embedding vector(256),
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          )
        `;
      } else {
        await sql`
          CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
            id TEXT PRIMARY KEY,
            source_type TEXT NOT NULL,
            source_id TEXT,
            title TEXT NOT NULL,
            location TEXT,
            jurisdiction_slug TEXT,
            url TEXT,
            permalink TEXT,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            embedding TEXT,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          )
        `;
      }

      await sql`CREATE INDEX IF NOT EXISTS idx_ai_chunks_source_type ON ai_knowledge_chunks (source_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_chunks_jur_slug ON ai_knowledge_chunks (jurisdiction_slug)`;

      await sql`
        CREATE TABLE IF NOT EXISTS ai_copilot_config (
          id TEXT PRIMARY KEY DEFAULT 'default',
          config JSONB NOT NULL,
          updated_by TEXT,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS ai_chat_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_email TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_sessions_email ON ai_chat_sessions (LOWER(user_email), updated_at DESC)`;

      await sql`
        CREATE TABLE IF NOT EXISTS ai_chat_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_email TEXT NOT NULL,
          prompt TEXT NOT NULL,
          answer TEXT NOT NULL,
          reasoning TEXT,
          citations JSONB DEFAULT '[]'::jsonb,
          retrieved_chunks JSONB DEFAULT '[]'::jsonb,
          provider_used TEXT,
          model_used TEXT,
          latency_ms INTEGER,
          grounding_metrics JSONB DEFAULT '{}'::jsonb,
          hallucination_grade TEXT DEFAULT 'PASS',
          user_feedback TEXT,
          admin_notes TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_chat_messages (session_id, created_at ASC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_chat_messages (created_at DESC)`;

      await sql`
        CREATE TABLE IF NOT EXISTS ai_eval_runs (
          id TEXT PRIMARY KEY,
          triggered_by TEXT,
          provider_used TEXT,
          model_used TEXT,
          total_tests INTEGER,
          pass_rate FLOAT,
          citation_coverage_avg FLOAT,
          grounding_avg FLOAT,
          abstention_accuracy FLOAT,
          phantom_citation_count INTEGER,
          hallucination_rate FLOAT,
          results JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )
      `;

      return { ready: true, hasPgVector: hasVec, mode: 'postgres' };
    } catch (err) {
      aiInitPromise = null;
      console.error('[sovdashAiDb] ensureAiTables failed:', err.message);
      return { ready: false, hasPgVector: false, error: err.message };
    }
  })();

  return aiInitPromise;
}

export async function getAiConfig() {
  await ensureAiTables();
  if (!process.env.POSTGRES_URL) {
    const saved = readLocalJson(LOCAL_AI_CONFIG_FILE, null);
    return { ...DEFAULT_AI_CONFIG, ...(saved && typeof saved === 'object' ? saved : {}) };
  }
  try {
    const { rows } = await sql`SELECT config, updated_by, updated_at FROM ai_copilot_config WHERE id = 'default' LIMIT 1`;
    if (rows.length > 0 && rows[0].config) {
      const saved = rows[0].config;
      const savedChain = Array.isArray(saved.fallbackChain) ? saved.fallbackChain : [];
      const needsChainUpgrade =
        !savedChain.includes('gemini:gemini-omni-1.1-flash') ||
        !savedChain.includes('gemini:gemini-3.5-flash') ||
        savedChain.indexOf('gemini:gemini-3.5-flash') > savedChain.indexOf('gemini:gemini-3-flash-preview') ||
        saved.modelId === 'gemma-4-31b-it' ||
        saved.modelId === 'gemini-3.6-flash';
      return {
        ...DEFAULT_AI_CONFIG,
        ...saved,
        ...(needsChainUpgrade
          ? {
              modelId: saved.provider === 'auto-opensource' || saved.modelId === 'gemma-4-31b-it'
                ? DEFAULT_AI_CONFIG.modelId
                : saved.modelId,
              fallbackChain: DEFAULT_AI_CONFIG.fallbackChain,
              maxTokens: Math.max(Number(saved.maxTokens) || 0, DEFAULT_AI_CONFIG.maxTokens)
            }
          : {}),
        updatedBy: rows[0].updated_by || null,
        updatedAt: rows[0].updated_at || null
      };
    }
  } catch (err) {
    console.warn('[getAiConfig] fallback to default:', err.message);
  }
  return { ...DEFAULT_AI_CONFIG };
}

export async function saveAiConfig(patch = {}, updatedBy = 'admin') {
  await ensureAiTables();
  const current = await getAiConfig();
  const next = {
    ...DEFAULT_AI_CONFIG,
    ...current,
    ...patch,
    temperature: Math.min(1, Math.max(0, Number(patch.temperature ?? current.temperature ?? 0.15))),
    maxTokens: Math.min(4096, Math.max(256, Number(patch.maxTokens ?? current.maxTokens ?? 1400))),
    topK: Math.min(24, Math.max(4, Number(patch.topK ?? current.topK ?? 12))),
    allowWebAugmentation: patch.allowWebAugmentation !== undefined ? Boolean(patch.allowWebAugmentation) : Boolean(current.allowWebAugmentation),
    strictCitationLock: patch.strictCitationLock !== undefined ? Boolean(patch.strictCitationLock) : Boolean(current.strictCitationLock),
    customBaseUrl: String(patch.customBaseUrl ?? current.customBaseUrl ?? '').trim().slice(0, 300),
    customApiKeyEnv: String(patch.customApiKeyEnv ?? current.customApiKeyEnv ?? '').trim().slice(0, 80),
    systemPromptAddon: String(patch.systemPromptAddon ?? current.systemPromptAddon ?? '').trim().slice(0, 1200)
  };
  delete next.updatedBy;
  delete next.updatedAt;

  if (!process.env.POSTGRES_URL) {
    writeLocalJson(LOCAL_AI_CONFIG_FILE, { ...next, updatedBy, updatedAt: new Date().toISOString() });
    return next;
  }

  await sql`
    INSERT INTO ai_copilot_config (id, config, updated_by, updated_at)
    VALUES ('default', ${JSON.stringify(next)}::jsonb, ${String(updatedBy || 'admin')}, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      config = EXCLUDED.config,
      updated_by = EXCLUDED.updated_by,
      updated_at = CURRENT_TIMESTAMP
  `;
  return { ...next, updatedBy, updatedAt: new Date().toISOString() };
}

export async function upsertKnowledgeChunks(chunks = []) {
  const status = await ensureAiTables();
  if (!Array.isArray(chunks) || chunks.length === 0) return { upserted: 0, hasPgVector: status.hasPgVector };

  if (!process.env.POSTGRES_URL) {
    const map = new Map();
    for (const c of readLocalJson(LOCAL_AI_CHUNKS_FILE, [])) {
      if (c?.id) map.set(c.id, c);
    }
    for (const c of chunks) {
      map.set(c.id, { ...c, updated_at: new Date().toISOString() });
    }
    writeLocalJson(LOCAL_AI_CHUNKS_FILE, Array.from(map.values()));
    return { upserted: chunks.length, hasPgVector: false };
  }

  let upserted = 0;
  // Batch in chunks of 40 inside sequential Promise waves to keep serverless memory & Neon fast
  const batchSize = 40;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (c) => {
        const vecLiteral = `[${(c.embedding || []).map((v) => Number(v).toFixed(5)).join(',')}]`;
        const metaJson = JSON.stringify(c.metadata || {});
        if (detectedPgVector) {
          await sql`
            INSERT INTO ai_knowledge_chunks (
              id, source_type, source_id, title, location, jurisdiction_slug, url, permalink, content, metadata, embedding, updated_at
            ) VALUES (
              ${c.id},
              ${c.sourceType},
              ${c.sourceId || null},
              ${c.title.slice(0, 320)},
              ${c.location ? c.location.slice(0, 180) : null},
              ${c.jurisdictionSlug || null},
              ${c.url ? c.url.slice(0, 600) : null},
              ${c.permalink ? c.permalink.slice(0, 300) : null},
              ${c.content.slice(0, 6000)},
              ${metaJson}::jsonb,
              ${vecLiteral}::vector,
              CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
              source_type = EXCLUDED.source_type,
              source_id = EXCLUDED.source_id,
              title = EXCLUDED.title,
              location = EXCLUDED.location,
              jurisdiction_slug = EXCLUDED.jurisdiction_slug,
              url = EXCLUDED.url,
              permalink = EXCLUDED.permalink,
              content = EXCLUDED.content,
              metadata = EXCLUDED.metadata,
              embedding = EXCLUDED.embedding,
              updated_at = CURRENT_TIMESTAMP
          `;
        } else {
          await sql`
            INSERT INTO ai_knowledge_chunks (
              id, source_type, source_id, title, location, jurisdiction_slug, url, permalink, content, metadata, embedding, updated_at
            ) VALUES (
              ${c.id},
              ${c.sourceType},
              ${c.sourceId || null},
              ${c.title.slice(0, 320)},
              ${c.location ? c.location.slice(0, 180) : null},
              ${c.jurisdictionSlug || null},
              ${c.url ? c.url.slice(0, 600) : null},
              ${c.permalink ? c.permalink.slice(0, 300) : null},
              ${c.content.slice(0, 6000)},
              ${metaJson}::jsonb,
              ${JSON.stringify(c.embedding || [])},
              CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
              source_type = EXCLUDED.source_type,
              title = EXCLUDED.title,
              content = EXCLUDED.content,
              metadata = EXCLUDED.metadata,
              embedding = EXCLUDED.embedding,
              updated_at = CURRENT_TIMESTAMP
          `;
        }
        upserted += 1;
      })
    );
  }
  return { upserted, hasPgVector: detectedPgVector };
}

export async function getKnowledgeChunkStats() {
  const status = await ensureAiTables();
  if (!process.env.POSTGRES_URL) {
    const all = readLocalJson(LOCAL_AI_CHUNKS_FILE, []);
    const byType = {};
    for (const c of all) {
      byType[c.sourceType || 'other'] = (byType[c.sourceType || 'other'] || 0) + 1;
    }
    return { total: all.length, byType, hasPgVector: false, lastSyncedAt: all[0]?.updated_at || null };
  }
  try {
    const { rows } = await sql`
      SELECT source_type, COUNT(*)::int AS cnt, MAX(updated_at) AS latest
      FROM ai_knowledge_chunks
      GROUP BY source_type
      ORDER BY cnt DESC
    `;
    const byType = {};
    let total = 0;
    let lastSyncedAt = null;
    for (const r of rows) {
      byType[r.source_type] = Number(r.cnt) || 0;
      total += byType[r.source_type];
      if (!lastSyncedAt || (r.latest && new Date(r.latest) > new Date(lastSyncedAt))) {
        lastSyncedAt = r.latest;
      }
    }
    return { total, byType, hasPgVector: status.hasPgVector || detectedPgVector, lastSyncedAt };
  } catch (err) {
    console.warn('[getKnowledgeChunkStats] error:', err.message);
    return { total: 0, byType: {}, hasPgVector: false, lastSyncedAt: null };
  }
}

export async function getKnowledgeChunksByIds(ids = []) {
  await ensureAiTables();
  const cleanIds = Array.from(new Set((ids || []).map((x) => String(x || '').trim()).filter(Boolean)));
  if (cleanIds.length === 0) return [];

  if (!process.env.POSTGRES_URL) {
    const idSet = new Set(cleanIds);
    return readLocalJson(LOCAL_AI_CHUNKS_FILE, []).filter((c) => idSet.has(c.id));
  }

  try {
    const rows = await Promise.all(
      cleanIds.map(async (cid) => {
        const res = await sql`
          SELECT id, source_type, source_id, title, location, jurisdiction_slug, url, permalink, content, metadata
          FROM ai_knowledge_chunks
          WHERE id = ${cid}
          LIMIT 1
        `;
        return res.rows?.[0] || null;
      })
    );
    return rows.filter(Boolean).map((r) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      title: r.title,
      location: r.location,
      jurisdictionSlug: r.jurisdiction_slug,
      url: r.url,
      permalink: r.permalink,
      content: r.content,
      metadata: r.metadata || {},
      vecScore: 0.75,
      vecRank: 1,
      lexRankDb: 1
    }));
  } catch (err) {
    console.warn('[getKnowledgeChunksByIds] error:', err.message);
    return [];
  }
}

export async function searchKnowledgeChunksPgVector(queryVector = [], queryText = '', limit = 48) {
  await ensureAiTables();
  const safeLimit = Math.min(120, Math.max(10, Number(limit) || 48));

  if (!process.env.POSTGRES_URL) {
    const all = readLocalJson(LOCAL_AI_CHUNKS_FILE, []);
    return all
      .map((c) => ({
        ...c,
        vecScore: cosineSimilarityArrays(queryVector, c.embedding || []),
        lexRankDb: 0
      }))
      .sort((a, b) => b.vecScore - a.vecScore)
      .slice(0, safeLimit);
  }

  try {
    if (detectedPgVector && Array.isArray(queryVector) && queryVector.length === EMBEDDING_DIM) {
      const vecLiteral = `[${queryVector.map((v) => Number(v).toFixed(5)).join(',')}]`;
      // Fetch both pure pgvector cosine nearest neighbors AND full-text websearch matches so rare statutory codes never get missed
      const [vecRes, lexRes] = await Promise.all([
        sql`
          SELECT
            id, source_type, source_id, title, location, jurisdiction_slug, url, permalink, content, metadata,
            (1 - (embedding <=> ${vecLiteral}::vector))::float AS vec_score
          FROM ai_knowledge_chunks
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> ${vecLiteral}::vector ASC
          LIMIT ${safeLimit}
        `,
        queryText.trim()
          ? sql`
              SELECT
                id, source_type, source_id, title, location, jurisdiction_slug, url, permalink, content, metadata,
                ts_rank_cd(to_tsvector('english', title || ' ' || COALESCE(location, '') || ' ' || content), plainto_tsquery('english', ${queryText}))::float AS lex_score
              FROM ai_knowledge_chunks
              WHERE to_tsvector('english', title || ' ' || COALESCE(location, '') || ' ' || content) @@ plainto_tsquery('english', ${queryText})
              ORDER BY lex_score DESC
              LIMIT ${Math.min(40, safeLimit)}
            `.catch(() => ({ rows: [] }))
          : Promise.resolve({ rows: [] })
      ]);

      const merged = new Map();
      vecRes.rows.forEach((r, idx) => {
        merged.set(r.id, {
          id: r.id,
          sourceType: r.source_type,
          sourceId: r.source_id,
          title: r.title,
          location: r.location,
          jurisdictionSlug: r.jurisdiction_slug,
          url: r.url,
          permalink: r.permalink,
          content: r.content,
          metadata: r.metadata || {},
          vecScore: Number(r.vec_score) || 0,
          vecRank: idx + 1,
          lexScore: 0,
          lexRankDb: 999
        });
      });

      lexRes.rows.forEach((r, idx) => {
        const existing = merged.get(r.id);
        if (existing) {
          existing.lexScore = Number(r.lex_score) || 0;
          existing.lexRankDb = idx + 1;
        } else {
          merged.set(r.id, {
            id: r.id,
            sourceType: r.source_type,
            sourceId: r.source_id,
            title: r.title,
            location: r.location,
            jurisdictionSlug: r.jurisdiction_slug,
            url: r.url,
            permalink: r.permalink,
            content: r.content,
            metadata: r.metadata || {},
            vecScore: 0,
            vecRank: 999,
            lexScore: Number(r.lex_score) || 0,
            lexRankDb: idx + 1
          });
        }
      });

      return Array.from(merged.values());
    }

    // Fallback when pgvector is absent
    const { rows } = await sql`
      SELECT id, source_type, source_id, title, location, jurisdiction_slug, url, permalink, content, metadata, embedding
      FROM ai_knowledge_chunks
      LIMIT 600
    `;
    return rows
      .map((r) => {
        let emb = [];
        try { emb = typeof r.embedding === 'string' ? JSON.parse(r.embedding) : []; } catch {}
        return {
          id: r.id,
          sourceType: r.source_type,
          sourceId: r.source_id,
          title: r.title,
          location: r.location,
          jurisdictionSlug: r.jurisdiction_slug,
          url: r.url,
          permalink: r.permalink,
          content: r.content,
          metadata: r.metadata || {},
          vecScore: cosineSimilarityArrays(queryVector, emb),
          lexRankDb: 0
        };
      })
      .sort((a, b) => b.vecScore - a.vecScore)
      .slice(0, safeLimit);
  } catch (err) {
    console.error('[searchKnowledgeChunksPgVector] query error:', err.message);
    return [];
  }
}

export async function createOrTouchChatSession({ sessionId = null, userId, userEmail, title }) {
  await ensureAiTables();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanId = sessionId && String(sessionId).trim()
    ? String(sessionId).trim().slice(0, 80)
    : `chat-${crypto.randomBytes(6).toString('hex')}`;
  const cleanTitle = String(title || 'SovDash Research Session').trim().slice(0, 120);

  if (!process.env.POSTGRES_URL) {
    const sessions = readLocalJson(LOCAL_AI_SESSIONS_FILE, []);
    const idx = sessions.findIndex((s) => s.id === cleanId);
    const now = new Date().toISOString();
    if (idx === -1) {
      sessions.unshift({ id: cleanId, user_id: userId, user_email: cleanEmail, title: cleanTitle, created_at: now, updated_at: now });
    } else {
      sessions[idx].updated_at = now;
    }
    writeLocalJson(LOCAL_AI_SESSIONS_FILE, sessions.slice(0, 200));
    return cleanId;
  }

  await sql`
    INSERT INTO ai_chat_sessions (id, user_id, user_email, title)
    VALUES (${cleanId}, ${String(userId || cleanEmail)}, ${cleanEmail}, ${cleanTitle})
    ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
  `;
  return cleanId;
}

export async function saveChatTurn({
  sessionId,
  userId,
  userEmail,
  prompt,
  answer,
  reasoning = '',
  citations = [],
  retrievedChunks = [],
  providerUsed = 'auto-opensource',
  modelUsed = 'unknown',
  latencyMs = 0,
  groundingMetrics = {},
  hallucinationGrade = 'PASS'
}) {
  await ensureAiTables();
  const messageId = `msg-${crypto.randomBytes(7).toString('hex')}`;
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanChunksSummary = (retrievedChunks || []).map((c) => ({
    id: c.id,
    sourceType: c.sourceType,
    title: c.title,
    score: Number((c.score || 0).toFixed(4))
  }));

  if (!process.env.POSTGRES_URL) {
    const msgs = readLocalJson(LOCAL_AI_MESSAGES_FILE, []);
    const row = {
      id: messageId,
      session_id: sessionId,
      user_id: userId,
      user_email: cleanEmail,
      prompt,
      answer,
      reasoning,
      citations,
      retrieved_chunks: cleanChunksSummary,
      provider_used: providerUsed,
      model_used: modelUsed,
      latency_ms: latencyMs,
      grounding_metrics: groundingMetrics,
      hallucination_grade: hallucinationGrade,
      user_feedback: null,
      admin_notes: null,
      created_at: new Date().toISOString()
    };
    msgs.unshift(row);
    writeLocalJson(LOCAL_AI_MESSAGES_FILE, msgs.slice(0, 1000));
    return row;
  }

  const { rows } = await sql`
    INSERT INTO ai_chat_messages (
      id, session_id, user_id, user_email, prompt, answer, reasoning,
      citations, retrieved_chunks, provider_used, model_used, latency_ms,
      grounding_metrics, hallucination_grade
    ) VALUES (
      ${messageId},
      ${sessionId},
      ${String(userId || cleanEmail)},
      ${cleanEmail},
      ${String(prompt || '').slice(0, 4000)},
      ${String(answer || '').slice(0, 20000)},
      ${String(reasoning || '').slice(0, 8000)},
      ${JSON.stringify(citations || [])}::jsonb,
      ${JSON.stringify(cleanChunksSummary)}::jsonb,
      ${String(providerUsed || '')},
      ${String(modelUsed || '')},
      ${Math.round(Number(latencyMs) || 0)},
      ${JSON.stringify(groundingMetrics || {})}::jsonb,
      ${String(hallucinationGrade || 'PASS')}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getUserChatSessions(userEmail) {
  await ensureAiTables();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  if (!cleanEmail) return [];

  if (!process.env.POSTGRES_URL) {
    return readLocalJson(LOCAL_AI_SESSIONS_FILE, [])
      .filter((s) => String(s.user_email || '').toLowerCase() === cleanEmail)
      .slice(0, 30);
  }

  const { rows } = await sql`
    SELECT s.id, s.title, s.created_at, s.updated_at,
           COUNT(m.id)::int AS message_count
    FROM ai_chat_sessions s
    LEFT JOIN ai_chat_messages m ON m.session_id = s.id
    WHERE LOWER(s.user_email) = ${cleanEmail}
    GROUP BY s.id
    ORDER BY s.updated_at DESC
    LIMIT 30
  `;
  return rows;
}

export async function getSessionMessages(sessionId, userEmail) {
  await ensureAiTables();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  if (!sessionId || !cleanEmail) return [];

  if (!process.env.POSTGRES_URL) {
    return readLocalJson(LOCAL_AI_MESSAGES_FILE, [])
      .filter((m) => m.session_id === sessionId && String(m.user_email || '').toLowerCase() === cleanEmail)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  const { rows } = await sql`
    SELECT *
    FROM ai_chat_messages
    WHERE session_id = ${sessionId} AND LOWER(user_email) = ${cleanEmail}
    ORDER BY created_at ASC
  `;
  return rows;
}

export async function updateMessageFeedback(messageId, userEmail, feedback) {
  await ensureAiTables();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanFeedback = feedback === 'up' || feedback === 'down' ? feedback : null;
  if (!messageId || !cleanEmail) return { updated: false };

  if (!process.env.POSTGRES_URL) {
    const msgs = readLocalJson(LOCAL_AI_MESSAGES_FILE, []);
    const target = msgs.find((m) => m.id === messageId && String(m.user_email || '').toLowerCase() === cleanEmail);
    if (!target) return { updated: false };
    target.user_feedback = cleanFeedback;
    writeLocalJson(LOCAL_AI_MESSAGES_FILE, msgs);
    return { updated: true };
  }

  const res = await sql`
    UPDATE ai_chat_messages
    SET user_feedback = ${cleanFeedback}
    WHERE id = ${messageId} AND LOWER(user_email) = ${cleanEmail}
  `;
  return { updated: (res?.rowCount || 0) > 0 };
}

export async function getAdminAiLogs({ page = 1, limit = 30, search = '', grade = 'all' } = {}) {
  await ensureAiTables();
  const safeLimit = Math.min(100, Math.max(5, Number(limit) || 30));
  const offset = (Math.max(1, Number(page) || 1) - 1) * safeLimit;
  const q = String(search || '').trim().toLowerCase();
  const g = String(grade || 'all').toUpperCase();

  if (!process.env.POSTGRES_URL) {
    let all = readLocalJson(LOCAL_AI_MESSAGES_FILE, []);
    if (g !== 'ALL') all = all.filter((m) => String(m.hallucination_grade || '').toUpperCase() === g);
    if (q) {
      all = all.filter((m) =>
        `${m.user_email} ${m.prompt} ${m.answer} ${m.model_used}`.toLowerCase().includes(q)
      );
    }
    return { logs: all.slice(offset, offset + safeLimit), total: all.length };
  }

  const likePattern = q ? `%${q}%` : null;
  const gradeFilter = g !== 'ALL' ? g : null;

  const [countRes, rowsRes] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS total
      FROM ai_chat_messages
      WHERE (${gradeFilter}::text IS NULL OR hallucination_grade = ${gradeFilter})
        AND (${likePattern}::text IS NULL OR LOWER(user_email || ' ' || prompt || ' ' || answer || ' ' || COALESCE(model_used, '')) LIKE ${likePattern})
    `,
    sql`
      SELECT *
      FROM ai_chat_messages
      WHERE (${gradeFilter}::text IS NULL OR hallucination_grade = ${gradeFilter})
        AND (${likePattern}::text IS NULL OR LOWER(user_email || ' ' || prompt || ' ' || answer || ' ' || COALESCE(model_used, '')) LIKE ${likePattern})
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `
  ]);

  return {
    logs: rowsRes.rows || [],
    total: Number(countRes.rows?.[0]?.total) || 0
  };
}

export async function updateAdminMessageNotes(messageId, adminNotes) {
  await ensureAiTables();
  if (!messageId) return { updated: false };
  const notes = String(adminNotes || '').slice(0, 2000);

  if (!process.env.POSTGRES_URL) {
    const msgs = readLocalJson(LOCAL_AI_MESSAGES_FILE, []);
    const target = msgs.find((m) => m.id === messageId);
    if (!target) return { updated: false };
    target.admin_notes = notes;
    writeLocalJson(LOCAL_AI_MESSAGES_FILE, msgs);
    return { updated: true };
  }

  const res = await sql`UPDATE ai_chat_messages SET admin_notes = ${notes} WHERE id = ${messageId}`;
  return { updated: (res?.rowCount || 0) > 0 };
}

export async function getAdminAiAnalytics() {
  await ensureAiTables();
  if (!process.env.POSTGRES_URL) {
    const msgs = readLocalJson(LOCAL_AI_MESSAGES_FILE, []);
    const total = msgs.length;
    const users = new Set(msgs.map((m) => m.user_email)).size;
    const avgLatency = total ? Math.round(msgs.reduce((a, m) => a + (Number(m.latency_ms) || 0), 0) / total) : 0;
    const passCount = msgs.filter((m) => m.hallucination_grade === 'PASS').length;
    const flaggedCount = msgs.filter((m) => m.hallucination_grade === 'FLAGGED').length;
    const up = msgs.filter((m) => m.user_feedback === 'up').length;
    const down = msgs.filter((m) => m.user_feedback === 'down').length;
    return {
      totalTurns: total,
      uniqueUsers: users,
      avgLatencyMs: avgLatency,
      passRate: total ? Math.round((passCount / total) * 1000) / 10 : 100,
      flaggedCount,
      thumbsUp: up,
      thumbsDown: down,
      avgCitationCoverage: 100,
      modelBreakdown: []
    };
  }

  try {
    const [aggRes, modelRes] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total_turns,
          COUNT(DISTINCT LOWER(user_email))::int AS unique_users,
          COALESCE(AVG(latency_ms), 0)::int AS avg_latency_ms,
          COUNT(*) FILTER (WHERE hallucination_grade = 'PASS')::int AS pass_count,
          COUNT(*) FILTER (WHERE hallucination_grade = 'REVIEW')::int AS review_count,
          COUNT(*) FILTER (WHERE hallucination_grade = 'FLAGGED')::int AS flagged_count,
          COUNT(*) FILTER (WHERE user_feedback = 'up')::int AS thumbs_up,
          COUNT(*) FILTER (WHERE user_feedback = 'down')::int AS thumbs_down,
          COALESCE(AVG((grounding_metrics->>'citationCoverage')::float), 0)::float AS avg_citation_cov
        FROM ai_chat_messages
      `,
      sql`
        SELECT COALESCE(model_used, 'unknown') AS model, COUNT(*)::int AS turns,
               COALESCE(AVG(latency_ms), 0)::int AS avg_latency_ms
        FROM ai_chat_messages
        GROUP BY model_used
        ORDER BY turns DESC
        LIMIT 8
      `
    ]);

    const r = aggRes.rows[0] || {};
    const total = Number(r.total_turns) || 0;
    const passCount = Number(r.pass_count) || 0;
    return {
      totalTurns: total,
      uniqueUsers: Number(r.unique_users) || 0,
      avgLatencyMs: Number(r.avg_latency_ms) || 0,
      passRate: total ? Math.round((passCount / total) * 1000) / 10 : 100,
      reviewCount: Number(r.review_count) || 0,
      flaggedCount: Number(r.flagged_count) || 0,
      thumbsUp: Number(r.thumbs_up) || 0,
      thumbsDown: Number(r.thumbs_down) || 0,
      avgCitationCoverage: total ? Math.round((Number(r.avg_citation_cov) || 0) * 1000) / 10 : 100,
      modelBreakdown: modelRes.rows || []
    };
  } catch (err) {
    console.warn('[getAdminAiAnalytics] fallback:', err.message);
    return {
      totalTurns: 0,
      uniqueUsers: 0,
      avgLatencyMs: 0,
      passRate: 100,
      reviewCount: 0,
      flaggedCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      avgCitationCoverage: 100,
      modelBreakdown: []
    };
  }
}

export async function saveEvalRun(run) {
  await ensureAiTables();
  const id = run.id || `eval-${crypto.randomBytes(5).toString('hex')}`;
  const record = {
    id,
    triggered_by: run.triggeredBy || 'cli',
    provider_used: run.providerUsed || 'auto-opensource',
    model_used: run.modelUsed || 'mixed',
    total_tests: Number(run.totalTests) || 0,
    pass_rate: Number(run.passRate) || 0,
    citation_coverage_avg: Number(run.citationCoverageAvg) || 0,
    grounding_avg: Number(run.groundingAvg) || 0,
    abstention_accuracy: Number(run.abstentionAccuracy) || 0,
    phantom_citation_count: Number(run.phantomCitationCount) || 0,
    hallucination_rate: Number(run.hallucinationRate) || 0,
    results: run.results || [],
    created_at: new Date().toISOString()
  };

  if (!process.env.POSTGRES_URL) {
    const runs = readLocalJson(LOCAL_AI_EVALS_FILE, []);
    runs.unshift(record);
    writeLocalJson(LOCAL_AI_EVALS_FILE, runs.slice(0, 30));
    return record;
  }

  await sql`
    INSERT INTO ai_eval_runs (
      id, triggered_by, provider_used, model_used, total_tests,
      pass_rate, citation_coverage_avg, grounding_avg, abstention_accuracy,
      phantom_citation_count, hallucination_rate, results
    ) VALUES (
      ${record.id},
      ${record.triggered_by},
      ${record.provider_used},
      ${record.model_used},
      ${record.total_tests},
      ${record.pass_rate},
      ${record.citation_coverage_avg},
      ${record.grounding_avg},
      ${record.abstention_accuracy},
      ${record.phantom_citation_count},
      ${record.hallucination_rate},
      ${JSON.stringify(record.results)}::jsonb
    )
  `;
  return record;
}

export async function getEvalRuns(limit = 10) {
  await ensureAiTables();
  const safeLimit = Math.min(25, Math.max(1, Number(limit) || 10));
  if (!process.env.POSTGRES_URL) {
    return readLocalJson(LOCAL_AI_EVALS_FILE, []).slice(0, safeLimit);
  }
  try {
    const { rows } = await sql`SELECT * FROM ai_eval_runs ORDER BY created_at DESC LIMIT ${safeLimit}`;
    return rows;
  } catch (err) {
    console.warn('[getEvalRuns] error:', err.message);
    return [];
  }
}
