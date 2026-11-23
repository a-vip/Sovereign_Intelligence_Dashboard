import { getJurisdictionBySlug, eventMatchesJurisdiction } from './jurisdictions.js';
import { isSafeFeedUrl } from './rssParser.js';
import { normalizeSignalId } from './provenance.js';

/**
 * Validates that a webhook destination is public HTTPS (no loopback, RFC1918, or metadata IPs).
 */
export function validateWebhookDestination(rawUrl) {
  const cleaned = String(rawUrl || '').trim();
  if (!cleaned) return { safe: true, url: '' };
  const ssrf = isSafeFeedUrl(cleaned);
  if (!ssrf.safe) {
    return ssrf;
  }
  try {
    const parsed = new URL(ssrf.url);
    if (parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Webhook destinations must use https://.' };
    }
    return { safe: true, url: parsed.toString() };
  } catch {
    return { safe: false, reason: 'Invalid webhook URL.' };
  }
}

/**
 * Matches events deterministically against a watchlist rule's jurisdictions, keywords, and minSeverity.
 */
export function matchEventsAgainstWatchlist(watchlist, events = []) {
  if (!watchlist || !Array.isArray(events) || events.length === 0) return [];

  const jurisdictions = (Array.isArray(watchlist.jurisdictions) ? watchlist.jurisdictions : [])
    .map((j) => String(j).trim())
    .filter(Boolean);
  const keywords = (Array.isArray(watchlist.keywords) ? watchlist.keywords : [])
    .map((k) => String(k).trim().toLowerCase())
    .filter(Boolean);
  const minSeverity = Math.min(Math.max(Number(watchlist.minSeverity ?? watchlist.min_severity ?? 1) || 1, 1), 5);

  const jurisdictionObjs = jurisdictions.map((entry) => ({
    raw: entry.toLowerCase(),
    profile: getJurisdictionBySlug(entry)
  }));

  return events.filter((ev) => {
    if (!ev) return false;
    const sev = Number(ev.severity) || 1;
    if (sev < minSeverity) return false;

    const hay = `${ev.title || ''} ${ev.location || ''} ${ev.details?.summary || ''} ${ev.details?.source || ev.source || ''}`.toLowerCase();

    if (jurisdictionObjs.length > 0) {
      const matchedJurisdiction = jurisdictionObjs.some(({ raw, profile }) => {
        if (profile) return eventMatchesJurisdiction(ev, profile);
        return hay.includes(raw);
      });
      if (!matchedJurisdiction) return false;
    }

    if (keywords.length > 0) {
      const matchedKeyword = keywords.some((kw) => hay.includes(kw));
      if (!matchedKeyword) return false;
    }

    return true;
  });
}

/**
 * Dispatches alert notifications to Slack, Discord, or generic HTTPS webhook receivers.
 */
export async function dispatchWatchlistWebhook(webhookUrl, watchlist, matchedEvents = []) {
  const check = validateWebhookDestination(webhookUrl);
  if (!check.safe || !check.url) {
    return { ok: false, skipped: true, reason: check.reason || 'empty_url' };
  }
  if (!Array.isArray(matchedEvents) || matchedEvents.length === 0) {
    return { ok: false, skipped: true, reason: 'no_matches' };
  }

  const target = check.url;
  const topEvents = matchedEvents.slice(0, 6).map((ev) => {
    const cid = normalizeSignalId(ev.id);
    return {
      id: cid,
      title: ev.title || 'AI Policy Signal',
      severity: Number(ev.severity) || 2,
      location: ev.location || 'Global',
      source: ev.details?.source || ev.source || 'OSINT',
      permalink: `https://app.sovdash.com/signal/${encodeURIComponent(cid)}`,
      url: ev.url || null
    };
  });

  let payload;
  if (/discord(app)?\.com\/api\/webhooks/i.test(target)) {
    payload = {
      username: 'Sovereign Observatory Alerts',
      embeds: [
        {
          title: `🛡️ Watchlist Match: ${watchlist.name} (${matchedEvents.length})`,
          description: topEvents
            .map((s) => `• **[SEV-${s.severity}]** [${s.title}](${s.permalink}) _(${s.location})_`)
            .join('\n'),
          color: 61951,
          timestamp: new Date().toISOString(),
          footer: { text: 'Sovereign Global AI Safety & Policy Observatory' }
        }
      ]
    };
  } else if (/hooks\.slack\.com/i.test(target)) {
    payload = {
      text: `🛡️ Sovereign Watchlist Alert: ${watchlist.name} (${matchedEvents.length} match${matchedEvents.length === 1 ? '' : 'es'})`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🛡️ ${watchlist.name} (${matchedEvents.length} signal${matchedEvents.length === 1 ? '' : 's'})`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: topEvents
              .map((s) => `• *SEV-${s.severity}* | <${s.permalink}|${s.title}> _(${s.location})_`)
              .join('\n')
          }
        }
      ]
    };
  } else {
    payload = {
      event: 'sovereign.watchlist.match',
      watchlist: {
        id: watchlist.id || null,
        name: watchlist.name
      },
      matchedCount: matchedEvents.length,
      timestamp: new Date().toISOString(),
      signals: topEvents
    };
  }

  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SovereignObservatory-Alerts/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });
    return { ok: res.ok, status: res.status };
  } catch (error) {
    console.warn('[dispatchWatchlistWebhook] Dispatch failed:', error.message);
    return { ok: false, status: 0, error: error.message };
  }
}
