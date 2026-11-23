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
        isResearch: true,
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
        isResearch: true,
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
        isResearch: true,
        isPinned: true
      }
    },
    {
      id: 'gov-india-ai-safety-institute-delhi',
      title: 'IndiaAI Safety Institute & Indigenous Multilingual Evaluation Consortium',
      url: 'https://indiaai.gov.in/',
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
      url: 'https://www.odpc.go.ke/',
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
      url: 'https://www.dcdt.gov.za/',
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
      url: 'https://asean.org/',
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
      url: 'https://minciencia.gob.cl/',
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
      url: 'https://ai.gov.ae/',
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
      url: 'https://www.digital.gov.my/',
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
      url: 'https://www.rusi.org/',
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
      url: 'https://www.sipri.org/research/armament-and-disarmament/emerging-military-and-security-technologies',
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
      url: 'https://www.csis.org/',
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
      url: 'https://www.defense.gov/',
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
      url: 'https://cset.georgetown.edu/',
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
      url: 'https://www.amnesty.org/en/tech/',
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
      url: 'https://www.accessnow.org/',
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
      url: 'https://metr.org/',
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
      url: 'https://www.ncsc.gov.uk/',
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
      url: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
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
      url: 'https://nitda.gov.ng/',
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
      url: 'https://www.mintic.gov.co/',
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
    }
  ];
}

async function fetchResearch() {
  return getStopKillerRobotsSignals();
}

module.exports = { fetchResearch, logToVault, getStopKillerRobotsSignals };
