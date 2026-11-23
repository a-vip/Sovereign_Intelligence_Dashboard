/**
 * Sovereign Intelligence — Strict International AI, Cyber & Tech Policy Classifier
 *
 * Ensures 100% of ingested OSINT, RSS, and GDELT signals placed onto the Sovereign
 * tactical globe and intelligence feeds have a verifiable nexus to:
 *   1. AI Governance, Frontier Safety & Regulation
 *   2. Cybersecurity, State Espionage & Critical Infrastructure Defense
 *   3. Autonomous Weapons (LAWS), Military AI & Electronic Warfare
 *   4. Compute Geopolitics, Semiconductors & Sovereign Digital Infrastructure
 *   5. Digital Rights, Biometric Surveillance & Platform Policy
 */

import { classifyMitRiskDomain } from './mitRiskTaxonomy.js';

// Immediate exclusion of non-policy noise: sports, entertainment, consumer shopping/reviews,
// routine weather, podcasts/promo blurbs, and non-tech local crime/ceremonies.
const NOISE_EXCLUSION_REGEX = /\b(cricket|football|soccer|baseball|rugby|tennis|olympics|stadium|batting|bowler|innings|ballon d'or|ballon d’or|harry kane|bayern munich|champions league|world cup|fifa|uefa|nba|nfl|celebrity|hollywood|bollywood|pop star|concert|album|box office|super bowl|premier league|striker|goalkeeper|smart ring|earbuds|headphones|soundbar|robot vacuum|air fryer|mattress|promo code|coupon|gift guide|buying guide|best deals|black friday|prime day|iphone case|screen protector|gaming mouse|gaming chair|horoscope|recipe|celebration of life|red carpet|fashion week|tour dates)\b/i;

// Routine natural hazard headlines that have NO cyber, grid, cable, datacenter, or tech-policy nexus
const ROUTINE_WEATHER_CRIME_REGEX = /\b(heavy rain|powerful storm|tropical storm|flash flood|wildfire smoke|volcanic eruption|landslide kills|bus crash|ferry sinks|train derailment|measles outbreak|cholera|malaria)\b/i;

// Podcast / event promo / generic newsletter wrappers with low standalone event value
const PROMO_WRAPPER_REGEX = /^(podcast:|listen:|watch:|newsletter:|sponsored:|deal alert:|review:)/i;

// Purely abstract ML / math optimization papers that lack any governance, security, safety,
// surveillance, defense, cyber, copyright, infrastructure, or real-world policy dimension
const ABSTRACT_MATH_ML_REGEX = /\b(stochastic gradient|riemannian manifold|hilbert space|banach|convex optimization|monte carlo tree|variational autoencoder|graph neural network|hyperparameter tuning|evolutionary adaptive neighborhood|few-shot segmentation|point cloud registration|super-resolution|image denoising|lora fine-tuning|reinforcement learning from|reward shaping|markov decision process|protein folding|molecular dynamics)\b/i;

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN PILLAR PATTERNS (Word-boundary anchored for high precision)
// ═══════════════════════════════════════════════════════════════════════════

// Pillar 1: Autonomous Weapons (LAWS), Military AI & Electronic Warfare -> Category: Conflict
const AUTONOMOUS_DEFENSE_REGEX = /\b(lethal autonomous|autonomous weapon|autonomous weapons|killer robot|killer robots|meaningful human control|drone swarm|drone swarms|autonomous drone|autonomous uav|autonomous deep learning|uav border|ai militarization|loitering munition|loitering munitions|ai targeting|algorithmic warfare|algorithmic targeting|lavender ai|gospel ai|military ai|defense ai|defence ai|pentagon ai|battlefield ai|autonomous turret|unmanned combat|electronic warfare|gps jamming|gnss spoofing|gnss jamming|counter-uas|ai-enabled weapon|automated warfare|machine autonomy|cyber command|cyberwarfare|cyber warfare|darpa)\b/i;
const UPPERCASE_LAWS_ACRONYM = /\bLAWS\b/;
const LAWS_CONTEXT_REGEX = /\b(un|united nations|geneva|treaty|disarmament|autonomous|weapon|weapons|robot|military|ihl|humanitarian law|ccw)\b/i;

// Pillar 2: Cybersecurity, State Espionage & Critical Infra -> Category: Surveillance (or Disaster if critical outage)
const CYBER_ESPIONAGE_REGEX = /\b(cyberattack|cyber-attack|cyberattacks|cybersecurity|cyber-security|cyber security|cyber espionage|cyber threat|cyber incident|cyber intrusion|cyber operation|cyber operations|ransomware|zero-day|0-day|spyware|pegasus|predator spyware|finfisher|malware|botnet|ddos|data breach|supply chain attack|apt\d+|state-sponsored hack|state-backed hack|chinese hackers|russian hackers|north korean hackers|iranian hackers|lazarus group|volt typhoon|salt typhoon|sandworm|fancy bear|cozy bear|cve-\d{4}-\d+|critical vulnerability|remote code execution|cisa|enisa|ncsc|cert-|telecom breach|credential theft|backdoor|rootkit|threat intelligence|infosec|industrial control systems)\b/i;

// Pillar 3: Biometric Surveillance, Digital Rights & Censorship -> Category: Surveillance / Humanitarian
const SURVEILLANCE_RIGHTS_REGEX = /\b(facial recognition|biometric surveillance|biometric id|mass surveillance|state surveillance|internet shutdown|internet blackout|digital censorship|online censorship|great firewall|vpn ban|encrypted messaging|end-to-end encryption|encryption backdoor|client-side scanning|chat control|digital rights|automated border|predictive policing|social scoring|algorithmic discrimination|algorithmic harm|spy cam|stingray|imsi catcher|lawful intercept|data retention|digital repression|transnational repression.*digital)\b/i;

// Pillar 4: AI Governance, Frontier Safety & Tech Regulation -> Category: Political
const AI_GOVERNANCE_REGEX = /\b(artificial intelligence|ai act|eu ai act|ai safety|ai governance|ai regulation|ai regulatory|ai bill|ai executive order|ai treaty|ai convention|ai summit|ai institute|aisi|caisi|eu ai office|frontier ai|frontier model|foundation model|large language model|generative ai|deepfake|deepfakes|synthetic media|algorithmic accountability|ai accountability|ai guardrails|ai liability|trustworthy ai|safe ai|responsible scaling|preparedness framework|safety testing|pre-deployment testing|ai copyright|ai training data|openai|anthropic|deepmind|mistral ai|deepseek|xai|meta ai|online safety act|digital services act|digital markets act|gdpr|data protection authority|data privacy law|platform regulation|tech antitrust|tiktok ban|social media ban|age verification|digital sovereignty|ai ethics|ai alignment|existential risk.*ai|ai risk)\b/i;

// Pillar 5: Compute Geopolitics, Semiconductors & Sovereign Infra -> Category: Economic
const COMPUTE_INFRA_REGEX = /\b(semiconductor|semiconductors|microchip|microchips|chip export|export controls|chip ban|ai chip|ai chips|gpu cluster|compute cluster|tsmc|asml|nvidia|smic|huawei ascend|h100|h200|b200|blackwell gpu|euv lithography|chips act|foundry|wafer fab|sovereign cloud|sovereign ai|hyperscale data center|ai data center|datacenter power|nuclear.*data center|subsea cable|undersea cable|submarine cable|cable sabotage|cable cut|satellite constellation|direct-to-cell|quantum computing|post-quantum cryptography|quantum encryption|critical minerals.*chip|gallium|germanium)\b/i;

// Critical infrastructure disruption modifier -> elevates to Disaster / High Severity
const CRITICAL_INFRA_OUTAGE_REGEX = /\b(power grid|water utility|hospital ransomware|pipeline shut|cable severed|cable cut|aviation outage|telecom outage|nuclear facility|emergency services down)\b/i;

// Real-world policy/security/governance anchor required for academic arXiv papers so pure theory is excluded
const ACADEMIC_POLICY_ANCHOR_REGEX = /\b(policy|governance|regulation|regulatory|law|legal|legislation|treaty|convention|ethics|ethical|safety|alignment|audit|accountability|surveillance|privacy|censorship|cyber|cybersecurity|malware|adversarial attack|jailbreak|red-teaming|backdoor|deepfake|disinformation|misinformation|election|autonomous weapon|military|warfare|defense|national security|geopolit|sovereign|export control|labor|copyright|human rights|discrimination|bias|fairness|public sector|government|cbrn|responsible scaling|preparedness|autonomous replication)\b/i;

/**
 * Evaluates whether an article/event belongs on the Sovereign AI, Cyber & Tech Policy platform.
 *
 * @param {string} title
 * @param {string} summary
 * @param {string} [sourceId]
 * @param {string[]} [customKeywords]
 * @returns {{
 *   isRelevant: boolean,
 *   category: 'Political' | 'Surveillance' | 'Conflict' | 'Economic' | 'Humanitarian' | 'Disaster',
 *   domainPillar: string,
 *   severity: number,
 *   reason: string
 * }}
 */
export function classifyTechPolicySignal(title = '', summary = '', sourceId = '', customKeywords = []) {
  const cleanTitle = String(title || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanSummary = String(summary || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const combined = `${cleanTitle} ${cleanSummary}`;

  if (!cleanTitle || cleanTitle.length < 10) {
    return { isRelevant: false, category: 'Political', domainPillar: 'None', severity: 1, reason: 'Title too short' };
  }

  if (PROMO_WRAPPER_REGEX.test(cleanTitle)) {
    return { isRelevant: false, category: 'Political', domainPillar: 'None', severity: 1, reason: 'Promotional or podcast wrapper' };
  }

  if (NOISE_EXCLUSION_REGEX.test(combined)) {
    return { isRelevant: false, category: 'Political', domainPillar: 'None', severity: 1, reason: 'Consumer/sports/entertainment noise' };
  }

  // Test core pillars
  const hasAutonomous = AUTONOMOUS_DEFENSE_REGEX.test(combined) ||
    (UPPERCASE_LAWS_ACRONYM.test(`${cleanTitle} ${cleanSummary}`) && LAWS_CONTEXT_REGEX.test(combined));
  const hasCyber = CYBER_ESPIONAGE_REGEX.test(combined);
  const hasSurveillanceRights = SURVEILLANCE_RIGHTS_REGEX.test(combined);
  const hasAiGov = AI_GOVERNANCE_REGEX.test(combined);
  const hasCompute = COMPUTE_INFRA_REGEX.test(combined);
  const hasCriticalOutage = CRITICAL_INFRA_OUTAGE_REGEX.test(combined);

  let hasCustomKeyword = false;
  if (Array.isArray(customKeywords) && customKeywords.length > 0) {
    hasCustomKeyword = customKeywords.some(kw => {
      const trimmed = String(kw || '').trim();
      if (trimmed.length < 3) return false;
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(combined);
    });
  }

  const hasAnyTechNexus = hasAutonomous || hasCyber || hasSurveillanceRights || hasAiGov || hasCompute || hasCustomKeyword;

  // Reject routine weather/health/crime if there is zero tech/cyber/AI nexus
  if (!hasAnyTechNexus) {
    return { isRelevant: false, category: 'Political', domainPillar: 'None', severity: 1, reason: 'No AI, cyber, or tech policy nexus' };
  }

  if (ROUTINE_WEATHER_CRIME_REGEX.test(combined) && !hasCyber && !hasCompute && !hasAutonomous) {
    return { isRelevant: false, category: 'Disaster', domainPillar: 'None', severity: 1, reason: 'Routine natural weather event without cyber/infra nexus' };
  }

  // Academic feed filter: require explicit policy, governance, security, safety, or societal anchor
  const isAcademicSource = String(sourceId || '').startsWith('arxiv') || sourceId === 'nature' || /arxiv\.org/i.test(combined);
  if (isAcademicSource) {
    if (ABSTRACT_MATH_ML_REGEX.test(combined) && !ACADEMIC_POLICY_ANCHOR_REGEX.test(cleanTitle)) {
      return { isRelevant: false, category: 'Political', domainPillar: 'None', severity: 1, reason: 'Abstract ML theory without policy/security nexus' };
    }
    if (!ACADEMIC_POLICY_ANCHOR_REGEX.test(combined)) {
      return { isRelevant: false, category: 'Political', domainPillar: 'None', severity: 1, reason: 'Academic paper lacking governance, safety, or security anchor' };
    }
  }

  // Assign primary SovDash category + specific Domain Pillar + calibrated empirical severity (1-5)
  let category = 'Political';
  let domainPillar = 'AI Governance';
  let severity = 2;

  if (hasAutonomous) {
    category = 'Conflict';
    domainPillar = 'Autonomous & Defense';
    severity = /\b(lethal|strike|deployed|swarm|combat|jamming|spoofing|ban|treaty)\b/i.test(combined) ? 4 : 3;
  } else if (hasCyber && hasCriticalOutage) {
    category = 'Disaster';
    domainPillar = 'Critical Infra Cyber';
    severity = 5;
  } else if (hasCyber) {
    category = 'Surveillance';
    domainPillar = 'Cyber & Espionage';
    severity = /\b(zero-day|0-day|state-sponsored|apt\d+|ransomware|critical|cisa|volt typhoon|salt typhoon|lazarus|pegasus)\b/i.test(combined) ? 4 : 3;
  } else if (hasSurveillanceRights) {
    const isHumanitarianImpact = /\b(refugee|asylum|human rights|journalist|activist|detained|shutdown|blackout|minority|uyghur|gaza|sudan|myanmar)\b/i.test(combined);
    category = isHumanitarianImpact ? 'Humanitarian' : 'Surveillance';
    domainPillar = 'Digital Rights & Surveillance';
    severity = /\b(shutdown|blackout|spyware|biometric|arrest|ban|facial recognition)\b/i.test(combined) ? 3 : 2;
  } else if (hasCompute) {
    if (/\b(cable cut|cable severed|cable sabotage)\b/i.test(combined)) {
      category = 'Disaster';
      domainPillar = 'Subsea & Compute Infra';
      severity = 4;
    } else {
      category = 'Economic';
      domainPillar = 'Compute & Semiconductors';
      severity = /\b(export control|chip ban|sanctions|billion|sovereign|tsmc|asml|nvidia)\b/i.test(combined) ? 3 : 2;
    }
  } else if (hasAiGov) {
    category = 'Political';
    domainPillar = 'AI Governance & Policy';
    severity = /\b(law|enacted|banned|fined|sued|treaty|executive order|summit|investigation|antitrust)\b/i.test(combined) ? 3 : 2;
  }

  // Escalate severity to 5 only for acute, large-scale international cyber/autonomous crises
  if (/\b(nationwide outage|critical infrastructure cyberattack|nuclear.*cyber|autonomous.*lethal strike|global internet outage|zero-day.*actively exploited)\b/i.test(combined)) {
    severity = 5;
  }

  const mitRisk = classifyMitRiskDomain(cleanTitle, cleanSummary, domainPillar);

  return {
    isRelevant: true,
    category,
    domainPillar,
    mitRisk,
    severity,
    reason: domainPillar
  };
}

/**
 * Convenience boolean wrapper for legacy callers.
 */
export function isStrictTechPolicyEvent(title = '', summary = '', sourceId = '') {
  return classifyTechPolicySignal(title, summary, sourceId).isRelevant;
}
