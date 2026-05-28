const targetEvent = {
  "id": "https___www_hrw_org_news_2026_05_25_sudan_colombians_linked_to_a",
  "title": "Sudan: Colombians Linked to Atrocities Trained in UAE Bases",
  "category": "Humanitarian",
  "severity": 1,
  "location": "Sudan",
  "timestamp": "2026-05-25T12:00:00.000Z",
  "url": "https://www.hrw.org/news/2026/05/25/sudan-colombians-linked-to-atrocities-trained-in-uae-bases",
  "details": {
    "summary": "Click to expand Image Spanish-speaking private military contractors and RSF fighters gathering in a courtyard between houses in El Fasher, North Darfur, Sudan. © 2025 Private With apparent support from the UAE, Colombian private military contractors have deployed to Sudan to s...",
    "verificationStatus": "active"
  },
  "edited": true
};

function isEventAiRelated(e) {
  if (!e) return false;
  const title = (e.title || e.name || '').toLowerCase();
  const desc = (e.description || e.details?.summary || e.details?.description || '').toLowerCase();
  const gear = (e.details?.gear || '').toLowerCase();
  const units = (e.details?.units || '').toLowerCase();
  const faction = (e.details?.faction || e.faction || '').toLowerCase();
  const conflict = (e.details?.conflict || e.conflict || '').toLowerCase();
  
  const aiRegex = /\\b(artificial intelligence|ai|autonomous weapon|autonomous weapons|drone|drones|military ai|surveillance|facial recognition|biometric|biometrics|cyber|killer robot|killer robots|robotics|robotic|algorithm|algorithmic|automated)\\b/i;
  
  return aiRegex.test(title) || aiRegex.test(desc) || aiRegex.test(gear) || aiRegex.test(units) || aiRegex.test(faction) || aiRegex.test(conflict);
}

console.log("Is Sudan Colombian event AI-related under the current filter?", isEventAiRelated(targetEvent));

function isEventAiRelatedWithExemption(e) {
  if (!e) return false;
  if (e.edited === true || e.edited === 'true') return true;
  return isEventAiRelated(e);
}

console.log("Is it AI-related with edited exemption?", isEventAiRelatedWithExemption(targetEvent));
