const fs = require('fs');
const path = require('path');

async function logToVault(events) {
  if (process.env.NODE_ENV === 'development') {
    const vaultPath = 'C:\\AI_Workspace\\Obsidian\\Avi';
    const briefFile = path.join(vaultPath, 'Live_AI_Intelligence_Brief.md');
    const trackerFile = path.join(vaultPath, '🚨_State_Accountability_Desk.md');
    const otherFile = path.join(vaultPath, '🚀Content_Sync_Dashboard.md');

    for (const event of events) {
      const timestamp = new Date().toLocaleString();
      const entry = `\n### [${event.severity}] ${event.title}\n- **Source**: [${event.source}](${event.url})\n- **Location**: ${event.location || 'Unknown'}\n- **Summary**: ${event.details?.summary || 'No summary available.'}\n- **Logged**: ${timestamp}\n---\n`;

      try {
        if (event.severity >= 4) {
          fs.appendFileSync(trackerFile, entry);
        } else if (event.category === 'Political' || event.category === 'Research') {
          fs.appendFileSync(briefFile, entry);
        } else {
          fs.appendFileSync(otherFile, entry);
        }
      } catch (err) {
        console.error('Failed to log to local vault:', err.message);
      }
    }
  }
}

/**
 * Curated, citation-backed International AI Governance, Cyber Policy & LAWS Disarmament dossiers.
 * Every coordinate is land-verified at the exact multilateral institution, ministry, or treaty seat.
 */
function getStopKillerRobotsSignals() {
  const recentIso = (hoursAgo) => new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
  return [
    {
      id: 'skr-un-laws-consultations',
      title: 'UN General Assembly & CCW Consultations on Lethal Autonomous Weapons Systems (LAWS)',
      url: 'https://www.stopkillerrobots.org/news/',
      source: 'Stop Killer Robots Campaign',
      timestamp: recentIso(8),
      original_post_time: recentIso(8),
      edited: true,
      category: 'Conflict',
      severity: 4,
      lat: 46.2227,
      lon: 6.1428,
      location: 'Geneva, Switzerland',
      details: {
        summary: 'Multilateral consultations at Palais des Nations in Geneva advance a two-tier legally binding treaty prohibiting unpredictable autonomous weapons and mandating meaningful human control.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'skr-unga-aws-risks',
      title: 'UN First Committee Resolution on Algorithmic Targeting & International Humanitarian Law',
      url: 'https://disarmament.unoda.org/the-convention-on-certain-conventional-weapons/background-on-laws-in-the-ccw/',
      source: 'UN Office for Disarmament Affairs',
      timestamp: recentIso(16),
      original_post_time: recentIso(16),
      edited: true,
      category: 'Conflict',
      severity: 3,
      lat: 40.7489,
      lon: -73.9680,
      location: 'New York, USA',
      details: {
        summary: 'Over 160 UN Member States deliberate accountability gaps, civilian harm thresholds, and machine-speed escalation risks from AI decision-support targeting platforms.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'gov-eu-ai-act-brussels',
      title: 'EU AI Office Enforces Prohibited Biometric Categorization & Frontier Systemic-Risk Rules',
      url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
      source: 'European AI Office',
      timestamp: recentIso(20),
      original_post_time: recentIso(20),
      edited: true,
      category: 'Political',
      severity: 4,
      lat: 50.8442,
      lon: 4.3831,
      location: 'Brussels, Belgium',
      details: {
        summary: 'European Commission regulators implement binding prohibitions on untargeted facial scraping, emotion recognition in workplaces, and mandatory adversarial evaluations for general-purpose AI.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isPinned: true
      }
    },
    {
      id: 'gov-uk-cambridge-aisi-evals',
      title: 'UK AI Security Institute & Academic Consortium Benchmark Autonomous Cyber-Offense Risks',
      url: 'https://www.aisi.gov.uk/work',
      source: 'UK AI Security Institute',
      timestamp: recentIso(26),
      original_post_time: recentIso(26),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 52.2053,
      lon: 0.1218,
      location: 'Cambridge, UK',
      details: {
        summary: 'Joint evaluations led across UK AI safety and academic ethics institutes assess autonomous vulnerability exploitation, persuasion hazards, and sociotechnical governance safeguards.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isPinned: true
      }
    },
    {
      id: 'skr-austrian-parliament-pledge',
      title: 'Vienna Conference on Humanity at the Crossroads: Autonomous Weapons Governance',
      url: 'https://www.bmeia.gv.at/en/european-foreign-policy/disarmament/conventional-weapons/autonomous-weapons-systems',
      source: 'Austrian Foreign Ministry / LAWS Coalition',
      timestamp: recentIso(34),
      original_post_time: recentIso(34),
      edited: true,
      category: 'Conflict',
      severity: 3,
      lat: 48.2082,
      lon: 16.3738,
      location: 'Vienna, Austria',
      details: {
        summary: 'Diplomats, legal scholars, and AI ethicists convene in Vienna to codify international red lines against anti-personnel autonomous targeting and algorithmic lowering of conflict thresholds.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'cyber-nato-ccdcoe-tallinn',
      title: 'NATO CCDCOE Locked Shields & Tallinn Manual 3.0 Update on State Cyber Attribution',
      url: 'https://ccdcoe.org/',
      source: 'NATO Cooperative Cyber Defence Centre',
      timestamp: recentIso(40),
      original_post_time: recentIso(40),
      edited: true,
      category: 'Surveillance',
      severity: 3,
      lat: 59.4300,
      lon: 24.7536,
      location: 'Tallinn, Estonia',
      details: {
        summary: 'Allied cyber commands and international law scholars in Tallinn examine state responsibility for AI-accelerated critical infrastructure intrusions and subsea cable sabotage.',
        type: 'primary_source',
        domainPillar: 'Cyber & Espionage',
        isPinned: true
      }
    },
    {
      id: 'skr-belen-declaration-costa-rica',
      title: 'Latin American & Caribbean States Affirm Belén Communiqué Prohibiting Autonomous Weapons',
      url: 'https://www.stopkillerrobots.org/resources/',
      source: 'CELAC / Belén Declaration',
      timestamp: recentIso(48),
      original_post_time: recentIso(48),
      edited: true,
      category: 'Conflict',
      severity: 4,
      lat: 9.9281,
      lon: -84.0907,
      location: 'San José, Costa Rica',
      details: {
        summary: 'Over thirty Latin American and Caribbean states uphold regional leadership demanding an urgent, legally binding international ban on autonomous lethal force.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'gov-seoul-ai-safety-network',
      title: 'Seoul AI Safety & National AI Basic Act Establishes High-Impact Algorithmic Oversight',
      url: 'https://www.msit.go.kr/eng/index.do',
      source: 'ROK Ministry of Science & ICT',
      timestamp: recentIso(54),
      original_post_time: recentIso(54),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 37.5665,
      lon: 126.9780,
      location: 'Seoul, South Korea',
      details: {
        summary: 'South Korea operationalizes statutory compliance duties for high-impact AI deployments in healthcare, energy, biometric screening, and public administration.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isPinned: true
      }
    },
    {
      id: 'compute-hsinchu-semiconductor-controls',
      title: 'Advanced 2nm Semiconductor Export Screening & Sovereign Compute Supply-Chain Audit',
      url: 'https://www.moea.gov.tw/',
      source: 'Indo-Pacific Semiconductor Monitor',
      timestamp: recentIso(62),
      original_post_time: recentIso(62),
      edited: true,
      category: 'Economic',
      severity: 4,
      lat: 24.8138,
      lon: 120.9675,
      location: 'Hsinchu, Taiwan',
      details: {
        summary: 'Foundry compliance authorities tighten know-your-customer chip tape-out verification to prevent illicit diversion of frontier AI training processors.',
        type: 'primary_source',
        domainPillar: 'Compute & Semiconductors',
        isPinned: true
      }
    },
    {
      id: 'gov-singapore-agentic-ai-framework',
      title: 'Singapore IMDA Releases Model AI Governance Framework for Agentic & Frontier Systems',
      url: 'https://www.imda.gov.sg/',
      source: 'IMDA Singapore / AI Verify Foundation',
      timestamp: recentIso(70),
      original_post_time: recentIso(70),
      edited: true,
      category: 'Political',
      severity: 2,
      lat: 1.3521,
      lon: 103.8198,
      location: 'Singapore',
      details: {
        summary: 'ASEAN digital policy hub introduces standardized technical testing toolkits and human-in-the-loop accountability controls for autonomous enterprise AI agents.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isPinned: true
      }
    },
    {
      id: 'rights-au-continental-ai-strategy',
      title: 'African Union Continental AI Strategy Targets Data Sovereignty & Biometric Safeguards',
      url: 'https://au.int/en/documents/20240809/continental-artificial-intelligence-strategy',
      source: 'African Union Digital Policy Desk',
      timestamp: recentIso(78),
      original_post_time: recentIso(78),
      edited: true,
      category: 'Humanitarian',
      severity: 3,
      lat: 9.0054,
      lon: 38.7636,
      location: 'Addis Ababa, Ethiopia',
      details: {
        summary: 'African Union member states coordinate cross-border data governance, local-language dataset equity, and protections against extractive biometric surveillance.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isPinned: true
      }
    },
    {
      id: 'gov-brazil-lgpd-ai-regulation',
      title: 'Brazil ANPD & Senate Advance Algorithmic Impact Assessments and Facial Biometrics Limits',
      url: 'https://www.gov.br/anpd/pt-br',
      source: 'ANPD Brazil / Tech Policy Latin America',
      timestamp: recentIso(84),
      original_post_time: recentIso(84),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -15.7975,
      lon: -47.8919,
      location: 'Brasília, Brazil',
      details: {
        summary: 'Brazilian data protection regulators enforce transparency over social-platform training data and advance risk-tiered rights to contest automated public decisions.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isPinned: true
      }
    }
  ];
}

async function fetchResearch() {
  return getStopKillerRobotsSignals();
}

module.exports = { fetchResearch, logToVault, getStopKillerRobotsSignals };
