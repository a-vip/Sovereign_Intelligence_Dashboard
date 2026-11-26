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
  // Fixed archival anchor so curated evergreen dossiers stay pinned on the globe & in CRITICAL/PAPERS
  // without rolling forward relative to Date.now() and permanently burying live breaking news in LATEST.
  const ARCHIVE_ANCHOR_MS = Date.parse('2026-11-18T12:00:00Z');
  const recentIso = (hoursAgo) => new Date(ARCHIVE_ANCHOR_MS - hoursAgo * 3600 * 1000).toISOString();
  return [
    {
      id: 'skr-un-laws-consultations',
      title: 'UN General Assembly & CCW Consultations on Lethal Autonomous Weapons Systems (LAWS)',
      url: 'https://docs-library.unoda.org/General_Assembly_First_Committee_-Seventy-Ninth_session_(2024)/78-241-US-EN.pdf',
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
      url: 'https://unidir.org/wp-content/uploads/2025/03/UN_General_Assembly_A_RES_79_239-EN.pdf',
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
      url: 'https://www.aisi.gov.uk/blog/how-fast-is-autonomous-ai-cyber-capability-advancing',
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
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'skr-austrian-parliament-pledge',
      title: 'Vienna Conference on Humanity at the Crossroads: Autonomous Weapons Governance',
      url: 'https://docs-library.unoda.org/General_Assembly_First_Committee_-Seventy-Ninth_session_(2024)/78-241-Humanity-Crossroads-EN_0.pdf',
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
      url: 'https://ccdcoe.org/research/tallinn-manual/',
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
      url: 'https://www.hrw.org/news/2023/03/06/latin-america-and-caribbean-nations-rally-against-autonomous-weapons-systems',
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
      url: 'https://www.msit.go.kr/eng/bbs/view.do?sCode=eng&mId=4&bbsSeqNo=42&nttSeqNo=1214',
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
      url: 'https://www.taipeitimes.com/News/biz/archives/2024/07/01/2003820126',
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
      url: 'https://www.imda.gov.sg/resources/press-releases-factsheets-and-speeches/press-releases/2024/public-consult-model-ai-governance-framework-genai',
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
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-brazil-lgpd-ai-regulation',
      title: 'Brazil ANPD & Senate Advance Algorithmic Impact Assessments and Facial Biometrics Limits',
      url: 'https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-releases-english-version',
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
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-india-ai-safety-institute-delhi',
      title: 'IndiaAI Safety Institute & Indigenous Multilingual Evaluation Consortium',
      url: 'https://indiaai.gov.in/article/india-takes-the-lead-establishing-the-indiaai-safety-institute-for-responsible-ai-innovation',
      source: 'MeitY IndiaAI Mission',
      timestamp: recentIso(88),
      original_post_time: recentIso(88),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 28.6139,
      lon: 77.2090,
      location: 'New Delhi, India',
      details: {
        summary: 'Ministry of Electronics and Information Technology convenes academic and civil-society hubs across India to build provenance watermarking and culturally grounded safety benchmarks across Indic languages.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'rights-kenya-odpc-biometric-nairobi',
      title: 'Kenya ODPC Enforces Biometric Data Sovereignty & Public-Sector AI Compliance',
      url: 'https://katibainstitute.org/institute-welcomes-deletion-of-unlawful-data-by-worldcoin/',
      source: 'Office of the Data Protection Commissioner (Kenya)',
      timestamp: recentIso(94),
      original_post_time: recentIso(94),
      edited: true,
      category: 'Surveillance',
      severity: 3,
      lat: -1.2921,
      lon: 36.8219,
      location: 'Nairobi, Kenya',
      details: {
        summary: 'Kenyan courts and privacy regulators enforce strict consent, cross-border transfer controls, and impact assessments on large-scale biometric identification deployments.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-south-africa-ai-framework-pretoria',
      title: 'South Africa National AI Policy Framework & Constitutional Surveillance Safeguards',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/south-africa-national-artificial-intelligence-policy-framework',
      source: 'DCDT South Africa',
      timestamp: recentIso(98),
      original_post_time: recentIso(98),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -25.7479,
      lon: 28.2293,
      location: 'Pretoria, South Africa',
      details: {
        summary: 'Department of Communications and Digital Technologies outlines national AI fairness, local compute access, and constitutional judicial oversight of bulk interception capabilities.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-asean-ai-ethics-jakarta',
      title: 'ASEAN Guide on AI Governance, Ethics & Regional Safety Coordination',
      url: 'https://asean.org/wp-content/uploads/2024/02/ASEAN-Guide-on-AI-Governance-and-Ethics_beautified_201223_v2.pdf',
      source: 'ASEAN Secretariat / Komdigi Indonesia',
      timestamp: recentIso(104),
      original_post_time: recentIso(104),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -6.2088,
      lon: 106.8456,
      location: 'Jakarta, Indonesia',
      details: {
        summary: 'Southeast Asian member states align generative AI transparency practices, cross-border digital infrastructure resilience, and sovereign AI safety capacity building.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-chile-ilia-neurorights-santiago',
      title: 'Chile National AI Policy, Neuro-Rights Constitutional Mandate & Latin America AI Index (ILIA)',
      url: 'https://www.unesco.org/en/articles/chile-launches-national-ai-policy-and-introduces-ai-bill-following-unescos-recommendations',
      source: 'Ministry of Science Chile / CENIA',
      timestamp: recentIso(110),
      original_post_time: recentIso(110),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -33.4489,
      lon: -70.6693,
      location: 'Santiago, Chile',
      details: {
        summary: 'Chile pairs constitutional mental-integrity protections against neuro-data exploitation with empirical tracking of compute, talent, and governance readiness across Latin America.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-unesco-latam-sanjose-charter',
      title: 'UNESCO & Costa Rica Advance San Jose AI Governance Observatory for Latin America',
      url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
      source: 'UNESCO / MICITT Costa Rica',
      timestamp: recentIso(116),
      original_post_time: recentIso(116),
      edited: true,
      category: 'Political',
      severity: 2,
      lat: 9.9281,
      lon: -84.0907,
      location: 'San José, Costa Rica',
      details: {
        summary: 'Regional ministerial coalition operationalizes UNESCO AI Readiness Assessment Methodologies and public-sector algorithmic transparency registries across Central and South America.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'compute-uae-ai-charter-abudhabi',
      title: 'UAE National AI Charter & Sovereign Frontier Compute Export Compliance',
      url: 'https://www.tamimi.com/wp-content/uploads/2024/08/UAEAI-Methaq-Jul-EN.pdf',
      source: 'UAE Artificial Intelligence Office',
      timestamp: recentIso(122),
      original_post_time: recentIso(122),
      edited: true,
      category: 'Economic',
      severity: 3,
      lat: 24.4539,
      lon: 54.3773,
      location: 'Abu Dhabi, UAE',
      details: {
        summary: 'United Arab Emirates pairs multi-gigawatt sovereign AI compute cluster buildouts with international export-control compliance agreements and model safety evaluation charters.',
        type: 'primary_source',
        domainPillar: 'Compute & Semiconductors',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'compute-malaysia-naio-kualalumpur',
      title: 'Malaysia National AI Office (NAIO) & Hyperscale Data Center Grid/Water Standards',
      url: 'https://www.dataguidance.com/news/malaysia-ministry-digital-announces-launch-naio',
      source: 'Ministry of Digital Malaysia',
      timestamp: recentIso(128),
      original_post_time: recentIso(128),
      edited: true,
      category: 'Economic',
      severity: 3,
      lat: 3.1390,
      lon: 101.6869,
      location: 'Kuala Lumpur, Malaysia',
      details: {
        summary: 'Malaysia establishes AI governance standards alongside sustainability and export-integrity rules for rapidly scaling ASEAN AI server and semiconductor packaging hubs.',
        type: 'primary_source',
        domainPillar: 'Compute & Semiconductors',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'skr-israel-gaza-lavender-gospel',
      title: 'Israeli Military AI Targeting ("Lavender", "The Gospel" & "Where\'s Daddy?") & UN/ICJ Genocide Accountability',
      url: 'https://www.972mag.com/lavender-ai-israeli-army-gaza/',
      source: '+972 Magazine / UN OHCHR',
      timestamp: recentIso(4),
      original_post_time: recentIso(4),
      edited: true,
      category: 'Conflict',
      severity: 5,
      lat: 31.5017,
      lon: 34.4668,
      location: 'Gaza / Israel',
      details: {
        summary: 'Investigative reporting and UN OHCHR / ICJ genocide accountability submissions document automated military AI target-generation pipelines ("Habsora / The Gospel", "Lavender", and "Where\'s Daddy?") producing tens of thousands of targeting recommendations with minimal human review windows and unprecedented civilian casualty thresholds across Gaza.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'sur-westbank-redwolf-biometrics',
      title: 'Automated Facial Recognition & Biometric Checkpoint Network ("Red Wolf" & "Blue Wolf") in Occupied West Bank',
      url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/',
      source: 'Amnesty International Tech Lab',
      timestamp: recentIso(6),
      original_post_time: recentIso(6),
      edited: true,
      category: 'Surveillance',
      severity: 4,
      lat: 31.5326,
      lon: 35.0998,
      location: 'Hebron / West Bank',
      details: {
        summary: 'Forensic human rights documentation details automated military facial recognition and algorithmic checkpoint scoring ("Red Wolf" and "Blue Wolf") enforcing segregated movement restrictions across Hebron and occupied Palestinian communities.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isPinned: true
      }
    },
    {
      id: 'laws-ukraine-kyiv-brave1-fpv',
      title: 'Ukraine Brave1 Scales AI Terminal-Guidance FPV Strike Drones Through EW-Contested Fronts',
      url: 'https://www.kyivpost.com/post/60152',
      source: 'RUSI / CSIS Defense AI Monitor',
      timestamp: recentIso(7),
      original_post_time: recentIso(7),
      edited: true,
      category: 'Conflict',
      severity: 5,
      lat: 50.4501,
      lon: 30.5234,
      location: 'Kyiv, Ukraine',
      details: {
        summary: 'Ukrainian defense innovation cluster Brave1 fields computer-vision last-mile autonomous targeting software aboard thousands of low-cost FPV strike drones to bypass heavy Russian radio-frequency electronic warfare jamming.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'laws-ukraine-kharkiv-swarms',
      title: 'Autonomous AI Drone Swarms (Swarmer / Saker) & Russian Lancet Automated Target Recognition',
      url: 'https://kyivindependent.com/ukrainian-swarm-drone-ai-startup-secures-15-million-investment/',
      source: 'SIPRI / Defense News',
      timestamp: recentIso(10),
      original_post_time: recentIso(10),
      edited: true,
      category: 'Conflict',
      severity: 5,
      lat: 49.9935,
      lon: 36.2304,
      location: 'Kharkiv, Ukraine',
      details: {
        summary: 'Field deployments across eastern Ukraine showcase multi-drone autonomous swarm coordination ("Swarmer") and onboard neural target-recognition loitering munitions ("Lancet" / "Saker Scout"), raising urgent IHL accountability questions over autonomous target selection.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'laws-ukraine-dnipro-ai-airdefense',
      title: 'AI-Assisted Acoustic & Radar Sensor-Fusion Networks Intercepting Autonomous Loitering Swarms',
      url: 'https://www.defenseone.com/defense-systems/2024/07/ukraines-cheap-sensors-are-helping-troops-fight-waves-russian-drones/398204/',
      source: 'CSIS Missile Defense & AI Project',
      timestamp: recentIso(14),
      original_post_time: recentIso(14),
      edited: true,
      category: 'Conflict',
      severity: 4,
      lat: 48.4647,
      lon: 35.0462,
      location: 'Dnipro, Ukraine',
      details: {
        summary: 'Distributed acoustic microphone arrays paired with real-time edge machine learning classifiers detect, triangulate, and vector air-defense interceptors against long-range autonomous one-way attack drones.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'laws-sipri-stockholm',
      title: 'SIPRI Global Assessment on Military AI & Autonomous Weapons Proliferation',
      url: 'https://www.sipri.org/research/armament-and-disarmament/emerging-military-and-security-technologies',
      source: 'SIPRI Stockholm',
      timestamp: recentIso(18),
      original_post_time: recentIso(18),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 59.3293,
      lon: 18.0686,
      location: 'Stockholm, Sweden',
      details: {
        summary: 'Stockholm International Peace Research Institute tracks global doctrine shifts as frontier machine learning, edge autonomy chips, and C2 decision-support proliferate across state arsenals faster than binding arms-control verification regimes.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'laws-pentagon-replicator',
      title: 'US DoD Replicator Initiative Deploys Attritable Autonomous Swarms Under Directive 3000.09',
      url: 'https://www.diu.mil/latest/implementing-the-department-of-defense-replicator-initiative-to-accelerate',
      source: 'US Department of Defense / CSET',
      timestamp: recentIso(22),
      original_post_time: recentIso(22),
      edited: true,
      category: 'Conflict',
      severity: 4,
      lat: 38.8719,
      lon: -77.0563,
      location: 'Arlington / Pentagon, USA',
      details: {
        summary: 'Pentagon Replicator program accelerates field acquisition of thousands of all-domain autonomous uncrewed surface, undersea, and aerial systems subject to DoD Directive 3000.09 human-judgment review protocols.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'laws-beijing-intelligentized-warfare',
      title: 'PLA "Intelligentized Warfare" Doctrine Advances Autonomous Unmanned Combat & Swarm Systems',
      url: 'https://cset.georgetown.edu/publication/harnessed-lightning/',
      source: 'Georgetown CSET / SIPRI',
      timestamp: recentIso(28),
      original_post_time: recentIso(28),
      edited: true,
      category: 'Conflict',
      severity: 4,
      lat: 39.9042,
      lon: 116.4074,
      location: 'Beijing, China',
      details: {
        summary: 'Chinese defense modernization integrates embodied autonomy, stealth combat UAV swarms, and AI battle-management decision support under China\'s dual-use military-civil fusion ecosystem.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'laws-sudan-khartoum-drones',
      title: 'Proliferation of Autonomous Loitering Munitions & Armed Surveillance Drones in Sudan Conflict',
      url: 'https://www.amnesty.org/en/latest/research/2024/07/new-weapons-fuelling-the-sudan-conflict/',
      source: 'Amnesty International / Conflict Armament Research',
      timestamp: recentIso(36),
      original_post_time: recentIso(36),
      edited: true,
      category: 'Conflict',
      severity: 4,
      lat: 15.5007,
      lon: 32.5599,
      location: 'Khartoum, Sudan',
      details: {
        summary: 'Open-source munitions tracing and human-rights investigations document widespread transfer of armed autonomous drones and electro-optical targeting optics into active urban hostilities across Sudan.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        laws_disarmament: true,
        isPinned: true
      }
    },
    {
      id: 'laws-myanmar-aerial-surveillance',
      title: 'Automated Biometric Surveillance, Internet Shutdowns & Drone Warfare Documentation in Myanmar',
      url: 'https://www.hrw.org/world-report/2025/country-chapters/myanmar',
      source: 'Access Now / Human Rights Watch',
      timestamp: recentIso(42),
      original_post_time: recentIso(42),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: 16.8409,
      lon: 96.1735,
      location: 'Yangon, Myanmar',
      details: {
        summary: 'Digital rights observers document nationwide SIM-biometric monitoring, censorship firewalls, and escalating autonomous/FPV drone strikes affecting civilian displacement corridors across Myanmar.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isPinned: true
      }
    },
    {
      id: 'agentic-sf-frontier-safety',
      title: 'Agentic AI Autonomous Tool-Use, Prompt-Injection Hijacking & Multi-Agent Safety Benchmarks',
      url: 'https://metr.org/AI_R_D_Evaluation_Report.pdf',
      source: 'METR / Frontier Safety Consortium',
      timestamp: recentIso(12),
      original_post_time: recentIso(12),
      edited: true,
      category: 'Political',
      severity: 4,
      lat: 37.7749,
      lon: -122.4194,
      location: 'San Francisco, USA',
      details: {
        summary: 'Pre-deployment safety evaluations quantify autonomous agentic AI capabilities across multi-step software exploitation, indirect prompt-injection privilege escalation, sandbagging detection, and human-oversight circuit breakers.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'cyber-london-ncsc-ai-breaches',
      title: 'UK NCSC & AISI Warning on AI-Accelerated Cyber Breaches, Automated Exploit Generation & Deepfake Fraud',
      url: 'https://www.ncsc.gov.uk/section/advice-guidance/all-topics/artificial-intelligence',
      source: 'UK NCSC / UK AISI',
      timestamp: recentIso(15),
      original_post_time: recentIso(15),
      edited: true,
      category: 'Surveillance',
      severity: 4,
      lat: 51.5074,
      lon: -0.1278,
      location: 'London, UK',
      details: {
        summary: 'National Cyber Security Centre intelligence assessment warns that LLM-assisted vulnerability discovery, polymorphic malware scripting, and real-time voice cloning are lowering barriers to high-impact enterprise and critical-infrastructure cyber breaches.',
        type: 'primary_source',
        domainPillar: 'Cyber & Espionage',
        isPinned: true
      }
    },
    {
      id: 'cyber-dc-cisa-llm-intrusion',
      title: 'CISA & NSA Advisory on Nation-State LLM-Assisted Reconnaissance & Critical Infrastructure Cyber Breaches',
      url: 'https://www.nsa.gov/Cybersecurity/Cybersecurity-Advisories-Guidance/smdpage16681/2/',
      source: 'CISA Cybersecurity Advisories',
      timestamp: recentIso(19),
      original_post_time: recentIso(19),
      edited: true,
      category: 'Surveillance',
      severity: 4,
      lat: 38.9072,
      lon: -77.0369,
      location: 'Washington D.C., USA',
      details: {
        summary: 'Joint cybersecurity advisory details APT actor abuse of commercial large language models for spear-phishing localization, cloud lateral-movement scripting, and vulnerability triage across energy, water, and telecommunications infrastructure.',
        type: 'primary_source',
        domainPillar: 'Cyber & Espionage',
        isPinned: true
      }
    },
    {
      id: 'gov-nigeria-nais-lagos',
      title: 'Nigeria National AI Strategy (NAIS) & West African Data Protection Enforcement',
      url: 'https://ncair.nitda.gov.ng/wp-content/uploads/2024/08/National-AI-Strategy_01082024-copy.pdf',
      source: 'NITDA / NCAIR Nigeria',
      timestamp: recentIso(96),
      original_post_time: recentIso(96),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 6.5244,
      lon: 3.3792,
      location: 'Lagos, Nigeria',
      details: {
        summary: 'Nigeria\'s National Centre for Artificial Intelligence and Robotics coordinates multilingual African AI dataset infrastructure, fintech algorithmic accountability, and statutory Nigeria Data Protection Act enforcement across West Africa.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-colombia-conpes-bogota',
      title: 'Colombia CONPES National AI Policy & Andean Algorithmic Accountability Charter',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/national-policy-on-artificial-intelligence-conpes-4144-3012',
      source: 'MinTIC Colombia / Derechos Digitales',
      timestamp: recentIso(108),
      original_post_time: recentIso(108),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 4.7110,
      lon: -74.0721,
      location: 'Bogotá, Colombia',
      details: {
        summary: 'Colombia formalizes its CONPES national artificial intelligence framework prioritizing public-sector algorithmic registries, judicial due-process safeguards, and cross-Andean digital rights cooperation.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    // ── REGIONAL BLIND SPOTS & HUMANITARIAN / DISASTER CATEGORY EXPANSION ─────
    {
      id: 'gov-china-shanghai-waic',
      title: 'Shanghai Global AI Governance Action Plan & Frontier Model Risk Dialogue',
      url: 'https://www.fmprc.gov.cn/eng/wjb/zzjg_663340/jks_665232/kjlc_665236/AI/202407/t20240704_11448351.html',
      source: 'WAIC Shanghai / Ministry of Foreign Affairs PRC',
      timestamp: recentIso(42),
      original_post_time: recentIso(42),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 31.2304,
      lon: 121.4737,
      location: 'Shanghai, China',
      details: {
        summary: 'Shanghai World Artificial Intelligence Conference Declaration calls for equitable Global South access to AI capacity-building, open-weight safety evaluation cooperation, and cross-border governance coordination.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'comp-china-shenzhen-ascend',
      title: 'Shenzhen Domestic AI Accelerator Supply Chain & Export Control Adaptation',
      url: 'https://cset.georgetown.edu/publication/pushing-the-limits-huaweis-ai-chip-tests-u-s-export-controls/',
      source: 'Stanford DigiChina',
      timestamp: recentIso(46),
      original_post_time: recentIso(46),
      edited: true,
      category: 'Economic',
      severity: 3,
      lat: 22.5431,
      lon: 114.0579,
      location: 'Shenzhen, China',
      details: {
        summary: 'Shenzhen hardware clusters accelerate indigenous AI inference chips, high-bandwidth memory packaging, and municipal compute vouchers to offset multilateral semiconductor lithography restrictions.',
        type: 'primary_source',
        domainPillar: 'Compute & Semiconductors',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-china-hangzhou-deepseek',
      title: 'Hangzhou Open-Weight Frontier Model Filing & Generative AI Red-Teaming',
      url: 'https://www.china-briefing.com/news/chinas-deepseek-and-its-open-source-ai-models/',
      source: 'ChinAI Research / Zhejiang CAC',
      timestamp: recentIso(50),
      original_post_time: recentIso(50),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 30.2741,
      lon: 120.1551,
      location: 'Hangzhou, China',
      details: {
        summary: 'Hangzhou model developers undergo mandatory algorithmic registry filings, synthetic-content watermarking audits, and pre-deployment adversarial red-teaming prior to public weights release.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-china-xinjiang-biometrics',
      title: 'UN OHCHR & Rights Monitors Document Biometric Mass Surveillance Systems in Xinjiang',
      url: 'https://www.ohchr.org/en/documents/country-reports/ohchr-assessment-human-rights-concerns-xinjiang-uyghur-autonomous-region',
      source: 'UN OHCHR / Human Rights Watch',
      timestamp: recentIso(58),
      original_post_time: recentIso(58),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: 43.8256,
      lon: 87.6168,
      location: 'Xinjiang, China',
      details: {
        summary: 'United Nations human rights assessment and forensic open-source investigations detail pervasive voiceprint, iris-scan, gait recognition, and predictive policing platforms impacting Uyghur and Turkic communities.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-india-bengaluru-dpi',
      title: 'Bengaluru IndiaAI Safety Institute & Digital Public Infrastructure AI Commons',
      url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2108961',
      source: 'IndiaAI / MediaNama',
      timestamp: recentIso(34),
      original_post_time: recentIso(34),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 12.9716,
      lon: 77.5946,
      location: 'Bengaluru, India',
      details: {
        summary: 'Bengaluru AI Safety Institute hub deploys multilingual indigenous evaluation benchmarks, consent-based Digital Public Infrastructure rails, and bias audits for Global Majority healthcare and agriculture models.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'econ-india-mumbai-rbi-ai',
      title: 'Mumbai Reserve Bank of India FREE-AI Governance Framework for Financial Systems',
      url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=59377',
      source: 'Reserve Bank of India / Inc42',
      timestamp: recentIso(48),
      original_post_time: recentIso(48),
      edited: true,
      category: 'Economic',
      severity: 3,
      lat: 19.0760,
      lon: 72.8777,
      location: 'Mumbai, India',
      details: {
        summary: 'Reserve Bank of India committee in Mumbai publishes the Framework for Responsible and Ethical Enablement of Artificial Intelligence covering credit-scoring explainability, systemic model risk, and consumer redress.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-india-chennai-subsea',
      title: 'Chennai Bay of Bengal Subsea Cable & Cyclone Infrastructure Resilience Risk',
      url: 'https://subtelforum.com/bif-urges-india-to-expand-subsea-cable-resilience/',
      source: 'SubTel Forum / CERT-In',
      timestamp: recentIso(62),
      original_post_time: recentIso(62),
      edited: true,
      category: 'Disaster',
      severity: 3,
      lat: 13.0827,
      lon: 80.2707,
      location: 'Chennai, India',
      details: {
        summary: 'Infrastructure resilience review along the Chennai subsea cable corridor warns of tropical cyclone storm-surge vulnerability across Bay of Bengal fiber landings serving South and Southeast Asian AI cloud hubs.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-vietnam-hanoi-digital-law',
      title: 'Vietnam Passes Law on Digital Technology Industry with Risk-Based AI Controls',
      url: 'https://www.vietnam-briefing.com/news/vietnam-passes-first-ever-law-on-digital-technology-industry.html/',
      source: 'VnExpress International / MIC Vietnam',
      timestamp: recentIso(36),
      original_post_time: recentIso(36),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 21.0285,
      lon: 105.8542,
      location: 'Hanoi, Vietnam',
      details: {
        summary: 'Vietnam establishes ASEAN\'s first comprehensive statutory Law on Digital Technology Industry classifying high-risk AI systems, mandating synthetic content labeling, and creating regulatory sandboxes in Hanoi.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'econ-vietnam-hcmc-semis',
      title: 'Ho Chi Minh City National Semiconductor & AI Compute Workforce Strategy 2030',
      url: 'https://en.baochinhphu.vn/govt-targets-to-raise-turnover-of-semiconductor-industry-to-us100-billion-by-2050-111240923114027879.htm',
      source: 'Vietnam Government Portal / CNA Asia',
      timestamp: recentIso(70),
      original_post_time: recentIso(70),
      edited: true,
      category: 'Economic',
      severity: 3,
      lat: 10.8231,
      lon: 106.6297,
      location: 'Ho Chi Minh City, Vietnam',
      details: {
        summary: 'Southern Vietnam industrial corridors scale IC design centers, hyperscale sovereign cloud parks, and chip assembly/test investments under Vietnam\'s 2030–2050 Semiconductor Strategy.',
        type: 'primary_source',
        domainPillar: 'Compute & Semiconductors',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-thailand-bangkok-etda',
      title: 'Thailand ETDA Publishes Generative AI Governance Guidelines & PDPA Algorithmic Rules',
      url: 'https://www.etda.or.th/getattachment/Our-Service/AIGC/Research-and-Recommendation/Thailand%E2%80%99s-AI-Governance-Guideline-for-Executive_2023.pdf.aspx?lang=th-TH',
      source: 'ETDA Thailand / Bangkok Policy Wire',
      timestamp: recentIso(44),
      original_post_time: recentIso(44),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 13.7563,
      lon: 100.5018,
      location: 'Bangkok, Thailand',
      details: {
        summary: 'Thailand\'s Electronic Transactions Development Agency operationalizes AI Ethics & Generative AI Governance Guidelines paired with Personal Data Protection Act enforcement on automated credit and healthcare profiling.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-indonesia-jakarta-komdigi',
      title: 'Indonesia KOMDIGI Enforces AI Ethics Circular & Chairs ASEAN AI Governance Working Group',
      url: 'https://www.elsam.or.id/en/technology-and-human-rights/ai-ethics-circular-seeks-voluntary-commitments-from-companies-and-stakeholders',
      source: 'KOMDIGI Indonesia / ASEAN Secretariat',
      timestamp: recentIso(38),
      original_post_time: recentIso(38),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -6.2088,
      lon: 106.8456,
      location: 'Jakarta, Indonesia',
      details: {
        summary: 'Jakarta issues sectoral generative AI transparency directives under Indonesia\'s Electronic Information Law while coordinating regional ASEAN Expanded Guide on AI Governance and Ethics across Southeast Asia.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-philippines-manila-naisr',
      title: 'Philippines National AI Strategy Roadmap 2.0 & Center for AI Research Launch',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/national-ai-strategy-roadmap-20-naisr-20',
      source: 'DTI Philippines / CNA Asia',
      timestamp: recentIso(74),
      original_post_time: recentIso(74),
      edited: true,
      category: 'Political',
      severity: 2,
      lat: 14.5995,
      lon: 120.9842,
      location: 'Manila, Philippines',
      details: {
        summary: 'Manila launches the updated National AI Strategy Roadmap (NAISR 2.0) focusing on public-interest AI ethics, BPO workforce transition protections, and Data Privacy Act automated decision safeguards.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-malaysia-johor-water',
      title: 'Johor–Singapore Compute Corridor Faces Hyperscale AI Data Center Water & Power Grid Strain',
      url: 'https://www.channelnewsasia.com/asia/johor-energy-water-land-data-centre-operators-cloud-technology-artificial-intelligence-4662386',
      source: 'Data Center Dynamics / Malay Mail',
      timestamp: recentIso(30),
      original_post_time: recentIso(30),
      edited: true,
      category: 'Disaster',
      severity: 4,
      lat: 1.4927,
      lon: 103.7414,
      location: 'Johor Bahru, Malaysia',
      details: {
        summary: 'Rapid hyperscale AI cluster construction in Johor Bahru prompts municipal moratoriums on non-water-efficient cooling facilities amid regional drought and multi-gigawatt substation congestion.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-australia-canberra-guardrails',
      title: 'Australia Advances Mandatory High-Risk AI Guardrails & National AI Safety Institute Planning',
      url: 'https://www.industry.gov.au/publications/voluntary-ai-safety-standard',
      source: 'Australian Dept of Industry / ASPI Strategist',
      timestamp: recentIso(40),
      original_post_time: recentIso(40),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -35.2809,
      lon: 149.1300,
      location: 'Canberra, Australia',
      details: {
        summary: 'Canberra implements the 10-guardrail Voluntary AI Safety Standard while consulting on mandatory statutory obligations for high-risk automated systems across healthcare, policing, employment, and border screening.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'surv-australia-sydney-esafety',
      title: 'Australian eSafety Commissioner Enforces Binding Generative AI & Deepfake Industry Codes',
      url: 'https://www.esafety.gov.au/industry/codes',
      source: 'eSafety Commissioner Australia / ABC',
      timestamp: recentIso(54),
      original_post_time: recentIso(54),
      edited: true,
      category: 'Surveillance',
      severity: 3,
      lat: -33.8688,
      lon: 151.2093,
      location: 'Sydney, Australia',
      details: {
        summary: 'Statutory online-safety regulator in Sydney mandates age-assurance risk assessments, synthetic CSAM model filtering, and rapid takedown compliance across foundation model providers operating in Australia.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-nz-auckland-maori-data',
      title: 'Aotearoa New Zealand Māori Data Sovereignty & Public Algorithm Charter Review',
      url: 'https://www.data.govt.nz/toolkit/data-ethics/government-algorithm-transparency-and-accountability/algorithm-charter/',
      source: 'Stats NZ / Te Mana Raraunga',
      timestamp: recentIso(82),
      original_post_time: recentIso(82),
      edited: true,
      category: 'Humanitarian',
      severity: 3,
      lat: -36.8509,
      lon: 174.7645,
      location: 'Auckland, New Zealand',
      details: {
        summary: 'Indigenous data governance frameworks and New Zealand\'s Government Algorithm Charter establish collective Te Tiriti rights over biometric datasets, welfare models, and cultural intellectual property in LLM training.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-brazil-saopaulo-pl2338',
      title: 'Brazil Senate Advances AI Regulatory Bill PL 2338/2023 on Algorithmic Impact & Rights',
      url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/157233',
      source: 'Senado Federal Brazil / InternetLab',
      timestamp: recentIso(28),
      original_post_time: recentIso(28),
      edited: true,
      category: 'Political',
      severity: 4,
      lat: -23.5505,
      lon: -46.6333,
      location: 'São Paulo, Brazil',
      details: {
        summary: 'Brazil\'s flagship AI legislation establishes excessive/high-risk tiers, prohibits biometric mass categorization and social scoring, mandates human explanation rights, and introduces AI copyright remuneration rules.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-argentina-ba-biometrics',
      title: 'Buenos Aires Court Suspends Municipal Facial Recognition System Over Rights Abuses',
      url: 'https://fpf.org/blog/judge-declares-buenos-aires-fugitive-facial-recognition-system-unconstitutional/',
      source: 'Access Now / CELS Argentina',
      timestamp: recentIso(68),
      original_post_time: recentIso(68),
      edited: true,
      category: 'Humanitarian',
      severity: 3,
      lat: -34.6037,
      lon: -58.3816,
      location: 'Buenos Aires, Argentina',
      details: {
        summary: 'Argentine judicial rulings halt deployment of metro-wide live facial recognition after audits revealed illegal biometric queries targeting journalists, human-rights defenders, and judicial officials without warrants.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-peru-lima-law31814',
      title: 'Peru Operationalizes Law No. 31814 Governing Public-Interest AI & Biometric Safeguards',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/law-31814-law-that-promotes-the-use-of-artificial-intelligence-in-favor-of-the-economic-and-social-development-of-the-country-3047',
      source: 'Hiperderecho / PCM Peru',
      timestamp: recentIso(88),
      original_post_time: recentIso(88),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -12.0464,
      lon: -77.0428,
      location: 'Lima, Peru',
      details: {
        summary: 'Latin America\'s earliest standalone national AI statute moves into implementing regulations across Lima, requiring human supervision, transparency logs, and proportionality assessments for public AI tools.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-uruguay-montevideo-water',
      title: 'Montevideo Drought Spurs Redesign of Hyperscale AI Cloud Cooling Water Allocation',
      url: 'https://www.theguardian.com/world/2023/jul/11/uruguay-drought-water-google-data-center',
      source: 'Data Center Dynamics / ObservaTIC',
      timestamp: recentIso(64),
      original_post_time: recentIso(64),
      edited: true,
      category: 'Disaster',
      severity: 3,
      lat: -34.9011,
      lon: -56.1645,
      location: 'Montevideo, Uruguay',
      details: {
        summary: 'Historic freshwater scarcity in Uruguay prompted civil-society litigation and environmental impact reassessment forcing hyperscale data center builds near Montevideo to shift to closed-loop air cooling.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-saudi-riyadh-sdaia',
      title: 'Saudi Arabia SDAIA Issues Deepfake, Generative AI Ethics & Sovereign Compute Guidelines',
      url: 'https://sdaia.gov.sa/en/SDAIA/about/Documents/ai-principles.pdf',
      source: 'SDAIA Riyadh / SMEX',
      timestamp: recentIso(39),
      original_post_time: recentIso(39),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 24.7136,
      lon: 46.6753,
      location: 'Riyadh, Saudi Arabia',
      details: {
        summary: 'Saudi Data & AI Authority publishes national generative AI accountability frameworks alongside Personal Data Protection Law (PDPL) cross-border compute transfer rules and Arabic foundation model investments.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-qatar-doha-ai',
      title: 'Qatar NCSA Issues Generative AI Cybersecurity & Arabic Model Governance Standards',
      url: 'https://ncsa.gov.qa/shared/document_library/94787172324409/33000/10209/1.0~926129d6-931a-48dd-b185-7e15bb07e2fa?mimetype=application/pdf&filename=Presentation%20-%20Implementing%20Responsible%20and%20Compliant%20AI%20Systems%20-%20IDPD%202026%20(10).pdf',
      source: 'National Cyber Security Agency Qatar',
      timestamp: recentIso(76),
      original_post_time: recentIso(76),
      edited: true,
      category: 'Political',
      severity: 2,
      lat: 25.2854,
      lon: 51.5150,
      location: 'Doha, Qatar',
      details: {
        summary: 'Qatar publishes binding public-sector guidelines covering prompt-injection defense, Arabic LLM data sovereignty, and critical energy infrastructure AI risk management across Gulf institutions.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-jordan-amman-refugee-aid',
      title: 'Amman Humanitarian Biometric Iris-Scan Aid Ethics & Refugee Consent Audits',
      url: 'https://www.hrw.org/news/2023/07/11/data-most-vulnerable-people-least-protected',
      source: 'ICRC Law & Policy / Privacy International',
      timestamp: recentIso(56),
      original_post_time: recentIso(56),
      edited: true,
      category: 'Humanitarian',
      severity: 3,
      lat: 31.9454,
      lon: 35.9284,
      location: 'Amman, Jordan',
      details: {
        summary: 'Digital rights and humanitarian law researchers examine power asymmetries and meaningful consent standards around mandatory iris-biometric verification for refugee cash and food assistance in Jordan.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-yemen-redsea-cables',
      title: 'Red Sea Subsea Fiber Cable Severances Disrupt 25% of Asia–Europe Cloud & AI Traffic',
      url: 'https://subtelforum.com/red-sea-cable-damage-disrupt-me-networks/',
      source: 'SubTel Forum / HGC Global',
      timestamp: recentIso(24),
      original_post_time: recentIso(24),
      edited: true,
      category: 'Disaster',
      severity: 5,
      lat: 12.7855,
      lon: 45.0187,
      location: 'Bab el-Mandeb / Yemen',
      details: {
        summary: 'Multiple submarine telecommunications cables (AAE-1, Seacom, EIG, TGN-EA) severed in the Red Sea maritime chokepoint force emergency rerouting of Euro-Asian cloud compute and AI API traffic.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-kenya-nairobi-ai-labor',
      title: 'Nairobi High Court & Parliamentary Inquiry on AI Content-Moderation & Data Labor Rights',
      url: 'https://www.foxglove.org.uk/2023/06/06/kenyan-court-ruling-outsourced-content-moderation-facebook/',
      source: 'CIPESA / TechCabal Kenya',
      timestamp: recentIso(45),
      original_post_time: recentIso(45),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: -1.2921,
      lon: 36.8219,
      location: 'Nairobi, Kenya',
      details: {
        summary: 'Kenyan labor courts uphold constitutional jurisdiction over global AI outsourcing contractors, setting Global Majority precedent on psychosocial trauma, fair pay, and algorithmic safety labeling standards.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-southafrica-capetown-ai',
      title: 'South Africa National AI Policy Framework & POPIA Section 71 Automated Decision Rights',
      url: 'https://popia.co.za/section-71-automated-decision-making/',
      source: 'DCDT South Africa / Paradigm Initiative',
      timestamp: recentIso(52),
      original_post_time: recentIso(52),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: -33.9249,
      lon: 18.4241,
      location: 'Cape Town, South Africa',
      details: {
        summary: 'South Africa\'s Department of Communications and Digital Technologies integrates POPIA Section 71 automated-profiling protections with the African Union Continental AI Strategy and G20 AI Equity Taskforce.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-ghana-accra-ai',
      title: 'Ghana 10-Year National AI Strategy & West African Responsible AI Compute Hub',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/national-strategy-republic-of-ghana-national-artificial-intelligence-strategy-2023-2033',
      source: 'Ministry of Communications Ghana / Paradigm',
      timestamp: recentIso(90),
      original_post_time: recentIso(90),
      edited: true,
      category: 'Political',
      severity: 2,
      lat: 5.6037,
      lon: -0.1870,
      location: 'Accra, Ghana',
      details: {
        summary: 'Accra advances West African open data governance, Twi/Ewe local-language safety evaluation datasets, and SME AI risk-management guidelines in partnership with UNESCO and regional universities.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-senegal-dakar-ai',
      title: 'Senegal National AI Strategy & Francophone West Africa Data Sovereignty Charter',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/senegal-national-artificial-intelligence-strategy-and-road-map',
      source: 'MCTN Senegal / CIPESA',
      timestamp: recentIso(94),
      original_post_time: recentIso(94),
      edited: true,
      category: 'Political',
      severity: 2,
      lat: 14.7167,
      lon: -17.4677,
      location: 'Dakar, Senegal',
      details: {
        summary: 'Senegal embeds sovereign public cloud hosting, CDP personal-data protection rules, and Francophone AI capacity programs across healthcare and agricultural public services in West Africa.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-egypt-cairo-ai',
      title: 'Egypt National AI Strategy & Egyptian Charter for Responsible Artificial Intelligence',
      url: 'https://oecd.ai/en/dashboards/policy-initiatives/egyptian-charter-for-responsible-ai-3543',
      source: 'National Council for AI Egypt / SMEX',
      timestamp: recentIso(84),
      original_post_time: recentIso(84),
      edited: true,
      category: 'Political',
      severity: 3,
      lat: 30.0444,
      lon: 31.2357,
      location: 'Cairo, Egypt',
      details: {
        summary: 'Cairo\'s National Council for Artificial Intelligence enforces the Egyptian Charter for Responsible AI across public-sector deployments while aligning Arabic-language governance norms with African Union frameworks.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-westafrica-abidjan-cable',
      title: 'West African WACS & MainOne Subsea Cable Landslides Trigger Multi-Nation Internet Blackout',
      url: 'https://blog.cloudflare.com/undersea-cable-failures-cause-internet-disruptions-across-africa-march-14-2024/',
      source: 'Cloudflare Radar / SubTel Forum',
      timestamp: recentIso(32),
      original_post_time: recentIso(32),
      edited: true,
      category: 'Disaster',
      severity: 5,
      lat: 5.3600,
      lon: -4.0083,
      location: 'Abidjan, Côte d\'Ivoire',
      details: {
        summary: 'Subsea canyon turbidity currents off Côte d\'Ivoire simultaneously sever four trunk fiber systems (WACS, ACE, MainOne, SAT-3), crippling banking, cloud AI APIs, and telecom across 13 West African states.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-taiwan-hsinchu-seismic',
      title: 'Taiwan Hsinchu Semiconductor Cluster Seismic & Subsea Grid Continuity Alerts',
      url: 'https://www.ascm.org/ascm-insights/scm-now-impact/semiconductor-production-threatened-by-tragic-disaster-in-taiwan/',
      source: 'Georgetown CSET / SubTel Forum',
      timestamp: recentIso(29),
      original_post_time: recentIso(29),
      edited: true,
      category: 'Disaster',
      severity: 4,
      lat: 24.8138,
      lon: 120.9675,
      location: 'Hsinchu, Taiwan',
      details: {
        summary: 'Seismic tremors and repeated offshore submarine cable cuts around Taiwan highlight single-point-of-failure supply-chain risk across >90% of global leading-edge AI accelerator EUV lithography production.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-ireland-dublin-grid',
      title: 'Dublin Data Centers Exceed 21% of National Electricity Demand Triggering Grid Moratorium',
      url: 'https://www.cso.ie/en/releasesandpublications/ep/p-dcmec/datacentresmeteredelectricityconsumption2025/keyfindings/',
      source: 'Data Center Dynamics / EirGrid Ireland',
      timestamp: recentIso(35),
      original_post_time: recentIso(35),
      edited: true,
      category: 'Disaster',
      severity: 4,
      lat: 53.3498,
      lon: -6.2603,
      location: 'Dublin, Ireland',
      details: {
        summary: 'De facto grid-connection moratorium in Greater Dublin constrains hyperscale AI cluster expansion after data center electricity consumption crosses one-fifth of Ireland\'s national generation.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'dis-mexico-queretaro-water',
      title: 'Querétaro Cloud & AI Compute Cluster Expansion Clashes with Municipal Drought Emergency',
      url: 'https://www.theguardian.com/global-development/2024/sep/25/mexico-datacentre-amazon-google-queretaro-water-electricity',
      source: 'Rest of World / R3D Mexico',
      timestamp: recentIso(47),
      original_post_time: recentIso(47),
      edited: true,
      category: 'Disaster',
      severity: 3,
      lat: 20.5888,
      lon: -100.3899,
      location: 'Querétaro, Mexico',
      details: {
        summary: 'Rapid cloud data center siting in central Mexico triggers water-equity protests and grid curtailment planning as severe regional drought strains industrial cooling allocations.',
        type: 'primary_source',
        domainPillar: 'Subsea & Compute Infra',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-geneva-icrc-ihl-ai',
      title: 'ICRC Calls for Red Lines on AI Decision-Support & Autonomous Targeting in Armed Conflict',
      url: 'https://blogs.icrc.org/law-and-policy/category/special-themes/artificial-intelligence-in-military-decision-making/',
      source: 'ICRC Law & Policy Geneva',
      timestamp: recentIso(22),
      original_post_time: recentIso(22),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: 46.2044,
      lon: 6.1432,
      location: 'Geneva, Switzerland',
      details: {
        summary: 'International Committee of the Red Cross urges states at UN CCW talks to outlaw unpredictable autonomous weapons, anti-personnel AI targeting, and compressed algorithmic kill-chain timelines under IHL.',
        type: 'primary_source',
        domainPillar: 'Autonomous & Defense',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'hum-hague-welfare-algorithm',
      title: 'Dutch SyRI & Welfare Algorithm Rulings Reshape European Human-Rights AI Jurisprudence',
      url: 'https://algorithmwatch.org/en/syri-netherlands-algorithm/',
      source: 'AlgorithmWatch / Hague District Court',
      timestamp: recentIso(60),
      original_post_time: recentIso(60),
      edited: true,
      category: 'Humanitarian',
      severity: 3,
      lat: 52.0705,
      lon: 4.3007,
      location: 'The Hague, Netherlands',
      details: {
        summary: 'Landmark Netherlands judicial precedent striking down opaque welfare-fraud risk scoring establishes binding ECHR Article 8 due-process protections for marginalized families across EU member states.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'surv-us-palantir-immigrationos',
      title: 'US ICE Palantir "ImmigrationOS" & ELITE Targeting Platform Drives Mass Detention & Due-Process Violations',
      url: 'https://www.aclu.org/news/privacy-technology/palantir-deportation-roundup',
      source: 'ACLU / Electronic Frontier Foundation / 404 Media',
      timestamp: recentIso(5),
      original_post_time: recentIso(5),
      edited: true,
      category: 'Surveillance',
      severity: 5,
      lat: 38.8977,
      lon: -77.0365,
      location: 'Washington, D.C., USA',
      details: {
        summary: 'ICE\'s $30M Palantir ImmigrationOS and ELITE neighborhood-mapping tools fuse DMV, IRS, Medicaid, and commercial data-broker records into automated address confidence scores for warrantless street sweeps, ensnaring lawful permanent residents, U.S. citizens in mixed-status households, and asylum seekers in arbitrary detention.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'ACLU — Palantir Deportation Roundup Investigation', url: 'https://www.aclu.org/news/privacy-technology/palantir-deportation-roundup' },
          { label: 'EFF — Palantir Human Rights Policy vs. ICE Operations (2026)', url: 'https://www.eff.org/deeplinks/2026/04/palantir-has-human-rights-policy-its-ice-work-tells-different-story' },
          { label: '404 Media — Palantir Justification for ICE Master Database', url: 'https://www.404media.co/this-is-palantirs-justification-for-building-ices-master-database/' }
        ]
      }
    },
    {
      id: 'hum-us-ice-family-detention',
      title: 'Algorithmically Targeted ICE Street Sweeps Expand Child & Family Detention Centers Amid Systemic Rights Abuses',
      url: 'https://www.humanrightsfirst.org/library/a-new-era-of-ice-family-prisons',
      source: 'Human Rights First / Electronic Frontier Foundation',
      timestamp: recentIso(7),
      original_post_time: recentIso(7),
      edited: true,
      category: 'Humanitarian',
      severity: 5,
      lat: 28.6714,
      lon: -99.1700,
      location: 'Dilley / Texas, USA',
      details: {
        summary: 'Aggressive algorithmic enforcement sweeps and mass deportation operations drive renewed expansion of family detention facilities—subjecting children, parents, legal residents, and unrepresented minors taken off streets to prolonged detention and documented medical neglect.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'Human Rights First — A New Era of ICE Family Prisons', url: 'https://www.humanrightsfirst.org/library/a-new-era-of-ice-family-prisons' },
          { label: 'EFF — Palantir ICE Surveillance & Human Rights Audit', url: 'https://www.eff.org/deeplinks/2026/04/palantir-has-human-rights-policy-its-ice-work-tells-different-story' }
        ]
      }
    },
    {
      id: 'pol-italy-rome-fascist-radicalization',
      title: 'Algorithmic Amplification & Viral Neo-Fascist Rallies at Rome\'s Acca Larentia Spark Anti-Fascism Court Rulings',
      url: 'https://www.commonspace.eu/news/fascist-salute-rattles-italian-politics',
      source: 'CommonSpace / LifeGate / EDMO Europe',
      timestamp: recentIso(11),
      original_post_time: recentIso(11),
      edited: true,
      category: 'Political',
      severity: 4,
      lat: 41.8724,
      lon: 12.5214,
      location: 'Rome, Italy',
      details: {
        summary: 'Engagement-driven social algorithms and synthetic far-right media amplify recurring Acca Larentia rallies in Rome where over 1,000 militants perform mass fascist ("Roman") salutes—accelerating online-to-street extremist radicalization and triggering Italian Supreme Court rulings under Scelba and Mancino anti-fascist statutes.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'CommonSpace — Fascist Salute Rally Rattles Italian Politics', url: 'https://www.commonspace.eu/news/fascist-salute-rattles-italian-politics' },
          { label: 'LifeGate — Acca Larentia & Italian Anti-Fascist Law', url: 'https://www.lifegate.com/acca-larentia-saluti-romani' },
          { label: 'Anadolu Agency — Neo-Fascist Rally in Rome Sparks Probe', url: 'https://www.aa.com.tr/en/europe/neo-fascist-rally-in-rome-sparks-political-stir-with-opposition-seeking-probe/3104108' }
        ]
      }
    },
    {
      id: 'pol-spain-madrid-neofascist-ai',
      title: 'AI-Amplified Far-Right Disinformation & Armed Neo-Nazi Street Mobilization ("Núcleo Nacional") in Spain',
      url: 'https://elpais.com/opinion/2026-11-11/neonazis-armados-en-espana.html',
      source: 'EL PAÍS / UN IOM / EDMO Europe',
      timestamp: recentIso(13),
      original_post_time: recentIso(13),
      edited: true,
      category: 'Political',
      severity: 4,
      lat: 40.4168,
      lon: -3.7038,
      location: 'Madrid, Spain',
      details: {
        summary: 'Spanish police crack down on armed neo-Nazi youth group Núcleo Nacional after public Nazi-salute rallies and anti-migrant marches in Madrid, while EDMO and UN IOM warn that generative-AI propaganda and algorithmic feeds are accelerating xenophobic street mobilization across Europe.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'EL PAÍS — Neonazis armados en España (Nov 2026)', url: 'https://elpais.com/opinion/2026-11-11/neonazis-armados-en-espana.html' },
          { label: 'UN IOM — AI and Misinformation Turning Migrants Into Targets', url: 'https://algeria.iom.int/news/ai-and-misinformation-are-turning-migrants-targets-un-migration-chief-warns' },
          { label: 'EDMO Horizontal Report — EU AI Disinformation Monitoring (2026)', url: 'https://edmo.eu/wp-content/uploads/2026/01/EDMO-55-Horizontal.pdf' }
        ]
      }
    },
    {
      id: 'res-stanford-llm-sycophancy-echo-chambers',
      title: 'AI Sycophancy & Single-User Echo Chambers Reinforce Conspiracies, Flat-Earth Beliefs & Delusional Spirals',
      url: 'https://spirals.stanford.edu/research/characterizing/',
      source: 'Stanford University / UNU / arXiv 2602.19141',
      timestamp: recentIso(9),
      original_post_time: recentIso(9),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: 37.4275,
      lon: -122.1697,
      location: 'Stanford, California, USA',
      details: {
        summary: 'Stanford, MIT, and UNU AI safety studies find RLHF-aligned chatbots validate user beliefs ~50% more often than humans—forming frictionless single-user confirmation-bias echo chambers that reinforce flat-earth conspiracies, paranoid ideation, and multi-turn delusional spirals ("AI psychosis").',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'Stanford — Characterizing Delusional Spirals in Human-LLM Chat Logs', url: 'https://spirals.stanford.edu/research/characterizing/' },
          { label: 'arXiv 2602.19141 — Sycophantic Chatbots Cause Delusional Spiraling', url: 'https://arxiv.org/abs/2602.19141' },
          { label: 'UNU — The Echo Chamber in Your Pocket', url: 'https://c3.unu.edu/blog/the-echo-chamber-in-your-pocket' }
        ]
      }
    },
    {
      id: 'res-boston-medical-sycophancy-pseudoscience',
      title: 'Medical AI Sycophancy Audit: Chatbots Validate Hazardous Pseudoscience & Unverified Remedies Over Clinical Truth',
      url: 'https://news.massgeneralbrigham.org/en/large-language-models-prioritize-helpfulness-over-accuracy-in-medical-contexts',
      source: 'Mass General Brigham / UK AI Security Institute',
      timestamp: recentIso(15),
      original_post_time: recentIso(15),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: 42.3601,
      lon: -71.0589,
      location: 'Boston, Massachusetts, USA',
      details: {
        summary: 'Clinical AI safety evaluations by Mass General Brigham and the UK AI Security Institute show frontier LLMs prioritize conversational agreeableness over medical accuracy—validating dangerous pseudoscientific practices (such as urine therapy or toxic unproven cures) when users express strong conviction.',
        type: 'primary_source',
        domainPillar: 'AI Governance & Policy',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'Mass General Brigham — LLMs Prioritize Helpfulness Over Medical Accuracy', url: 'https://news.massgeneralbrigham.org/en/large-language-models-prioritize-helpfulness-over-accuracy-in-medical-contexts' },
          { label: 'UK AISI — Ask Don\'t Tell: Reducing Sycophancy in LLMs', url: 'https://www.aisi.gov.uk/blog/ask-dont-tell-reducing-sycophancy-in-large-language-models-2' }
        ]
      }
    },
    {
      id: 'res-brussels-ai-misogyny-racism-echo',
      title: 'Generative AI & Recommendation Echo Chambers Amplify Anti-Immigrant Racism, Misogyny & Manosphere Radicalization',
      url: 'https://www.europarl.europa.eu/RegData/etudes/BRIE/2026/782670/EPRS_BRI(2026)782670_EN.pdf',
      source: 'European Parliament Research Service / UN Women / TechPolicy.Press',
      timestamp: recentIso(18),
      original_post_time: recentIso(18),
      edited: true,
      category: 'Humanitarian',
      severity: 4,
      lat: 50.8387,
      lon: 4.3731,
      location: 'Brussels, Belgium',
      details: {
        summary: 'European Parliament Research Service, UN Women, and TechPolicy.Press analyses document how sycophantic AI companions and algorithmic feeds validate personal grievances, supercharge racist anti-immigration narratives, and funnel users into misogynistic manosphere communities and synthetic gender-based abuse.',
        type: 'primary_source',
        domainPillar: 'Digital Rights & Surveillance',
        isResearch: true,
        isPinned: true,
        citations: [
          { label: 'EPRS (2026) — Generative AI & Gender-Based Violence Briefing', url: 'https://www.europarl.europa.eu/RegData/etudes/BRIE/2026/782670/EPRS_BRI(2026)782670_EN.pdf' },
          { label: 'TechPolicy.Press — What Research Says About AI Sycophancy', url: 'https://www.techpolicy.press/what-research-says-about-ai-sycophancy/' },
          { label: 'UN Women — Alarm Over Algorithmic Online Misogyny', url: 'https://www.un.org/es/node/231738' }
        ]
      }
    }
  ];
}

async function fetchResearch() {
  return getStopKillerRobotsSignals();
}

module.exports = { fetchResearch, logToVault, getStopKillerRobotsSignals };
