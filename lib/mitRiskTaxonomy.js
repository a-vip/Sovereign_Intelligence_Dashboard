/**
 * Sovereign Observatory — MIT AI Risk Repository 7-Domain Taxonomy Mapper
 *
 * Maps live AI governance, safety, cyber, and autonomous weapons signals to the
 * 7 canonical sociotechnical risk domains & causal dimensions (Intent, Timing).
 * Pure isomorphic JS (safe for SSR, API routes, and client components).
 */

export const MIT_RISK_DOMAINS = [
  {
    code: 'D1',
    id: 'discrimination-toxicity',
    label: 'Discrimination & Toxicity',
    shortLabel: 'Bias & Toxicity',
    color: '#f472b6'
  },
  {
    code: 'D2',
    id: 'privacy-security',
    label: 'Privacy & Security',
    shortLabel: 'Privacy & Security',
    color: '#38bdf8'
  },
  {
    code: 'D3',
    id: 'misinformation',
    label: 'Misinformation & Synthetic Media',
    shortLabel: 'Synthetic / Disinfo',
    color: '#fb923c'
  },
  {
    code: 'D4',
    id: 'malicious-actors',
    label: 'Malicious Actors & Dual-Use Misuse',
    shortLabel: 'Malicious / Dual-Use',
    color: '#ff2d55'
  },
  {
    code: 'D5',
    id: 'hci-agency',
    label: 'Human-Computer Interaction',
    shortLabel: 'Agency & HCI',
    color: '#a855f7'
  },
  {
    code: 'D6',
    id: 'socioeconomic-environmental',
    label: 'Socioeconomic & Environmental',
    shortLabel: 'Socioecon & Energy',
    color: '#facc15'
  },
  {
    code: 'D7',
    id: 'ai-safety-failures',
    label: 'AI System Safety, Failures & Limitations',
    shortLabel: 'System Safety & Eval',
    color: '#10b981'
  }
];

function byCode(code) {
  return MIT_RISK_DOMAINS.find((d) => d.code === code) || MIT_RISK_DOMAINS[6];
}

/**
 * Classifies a signal or incident into an MIT AI Risk Domain + causal metadata.
 */
export function classifyMitRiskDomain(title = '', summary = '', domainPillar = '') {
  const text = `${title || ''} ${summary || ''} ${domainPillar || ''}`.toLowerCase();

  let domain = byCode('D7');
  let causalIntent = 'Governance / Systemic';
  let timing = 'Post-deployment';

  if (
    /\b(lethal autonomous|autonomous weapon|killer robot|drone swarm|apt\d+|ransomware|spyware|pegasus|predator|cyberattack|cyber-attack|zero-day|0-day|malware|gnss spoofing|gps jamming|electronic warfare|cable sabotage|cbrn|bioweapon|jailbreak|dual-use|hack)\b/i.test(
      text
    )
  ) {
    domain = byCode('D4');
    causalIntent = 'Intentional';
    timing = /\b(eval|red-team|benchmark|pre-deployment|preparedness|safety framework)\b/i.test(text)
      ? 'Pre-deployment'
      : 'Post-deployment';
  } else if (
    /\b(deepfake|synthetic media|disinformation|misinformation|election interference|watermarking|provenance|cloning|impersonation)\b/i.test(
      text
    )
  ) {
    domain = byCode('D3');
    causalIntent = 'Intentional';
    timing = 'Post-deployment';
  } else if (
    /\b(biometric|facial recognition|mass surveillance|privacy|gdpr|data breach|encryption backdoor|data retention|social scoring|internet shutdown|censorship|client-side scanning|anpd|ico)\b/i.test(
      text
    )
  ) {
    domain = byCode('D2');
    causalIntent = /\b(breach|surveillance|backdoor|shutdown|censorship|spyware)\b/i.test(text)
      ? 'Intentional'
      : 'Mixed';
    timing = 'Post-deployment';
  } else if (
    /\b(bias|discrimination|hate speech|harassment|toxicity|fairness|protected characteristic|civil rights|predictive policing)\b/i.test(
      text
    )
  ) {
    domain = byCode('D1');
    causalIntent = 'Unintentional / Structural';
    timing = 'Post-deployment';
  } else if (
    /\b(semiconductor|export control|data center|datacenter|power grid|nuclear|energy|water|climate|labor|strike|antitrust|copyright|concentration|compute cluster|tsmc|asml|nvidia|capex)\b/i.test(
      text
    )
  ) {
    domain = byCode('D6');
    causalIntent = 'Structural / Economic';
    timing = 'Pre- & Post-deployment';
  } else if (
    /\b(chatbot|mental health|suicide|companion|dependency|anthropomorphism|deception|manipulation|dark pattern|overreliance|meaningful human control|whistleblower)\b/i.test(
      text
    )
  ) {
    domain = byCode('D5');
    causalIntent = 'Unintentional / Design';
    timing = 'Post-deployment';
  } else {
    domain = byCode('D7');
    causalIntent = 'Safety & Governance';
    timing = /\b(ai act|ai basic act|sb 53|aisi|caisi|metr|safety|alignment|evaluation|audit|hallucination|robustness)\b/i.test(
      text
    )
      ? 'Pre-deployment'
      : 'Post-deployment';
  }

  return {
    code: domain.code,
    id: domain.id,
    label: domain.label,
    shortLabel: domain.shortLabel,
    color: domain.color,
    causalIntent,
    timing
  };
}
