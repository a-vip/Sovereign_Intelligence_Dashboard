/**
 * Sovereign Observatory — Flagship Global AI Governance Jurisdiction Registry
 *
 * Pure isomorphic module (zero Node built-ins) powering:
 *  - /jurisdictions (Global Atlas)
 *  - /jurisdiction/[iso] (Sovereign Dossier SSR Pages)
 *  - Cross-linking from globe pins and country overlays
 */

export const JURISDICTION_REGIONS = [
  'Multilateral',
  'Europe',
  'Americas',
  'Indo-Pacific',
  'MENA & Africa'
];

export const JURISDICTIONS = [
  {
    slug: 'eu',
    iso: 'EU',
    name: 'European Union',
    region: 'Europe',
    capital: 'Brussels / Strasbourg',
    lat: 50.8503,
    lon: 4.3517,
    posture: 'Binding Comprehensive Statute',
    postureColor: '#10b981',
    treatyStatus: 'Ratified Council of Europe AI Convention (CETS No. 225) — May 15, 2026',
    regulator: 'European AI Office (DG CONNECT) & National Market Surveillance Authorities',
    flagshipInstruments: [
      {
        name: 'EU AI Act (Regulation (EU) 2024/1689)',
        status: 'In Phased Enforcement',
        effectiveDate: '2024-08-01 → 2028-08-02',
        summary: 'Risk-tiered binding statute covering prohibited AI practices (effective Feb 2025), GPAI systemic-risk model duties (Aug 2025), Article 50 transparency/watermarking (Aug 2026), and high-risk AI obligations.'
      },
      {
        name: 'Digital Omnibus on AI (Regulation (EU) 2026/1744)',
        status: 'Enacted Adjustment',
        effectiveDate: '2026',
        summary: 'Adjusted compliance deadlines for standalone high-risk AI systems to Dec 2, 2027 and embedded high-risk product systems to Aug 2, 2028 while retaining strict prohibited-AI and GPAI oversight.'
      },
      {
        name: 'Digital Services Act (DSA) & GDPR Article 22',
        status: 'In Force',
        effectiveDate: '2024-02-17',
        summary: 'Mandatory algorithmic risk assessments for Very Large Online Platforms (VLOPs), researcher data access, and automated decision-making safeguards.'
      }
    ],
    matchPatterns: ['european union', 'brussels', 'eu ai act', 'eu ai office', 'strasbourg', 'digital services act', 'digital markets act', 'edpb', 'european commission', 'european parliament', 'eu regulators']
  },
  {
    slug: 'gb',
    iso: 'GB',
    name: 'United Kingdom',
    region: 'Europe',
    capital: 'London / Cambridge',
    lat: 51.5074,
    lon: -0.1278,
    posture: 'Frontier Safety Institute & Sectoral Regime',
    postureColor: '#38bdf8',
    treatyStatus: 'Signatory — Council of Europe Framework Convention on AI (CETS No. 225)',
    regulator: 'UK AI Security Institute (AISI), ICO, Ofcom & NCSC',
    flagshipInstruments: [
      {
        name: 'UK AI Security Institute (AISI) Pre-Deployment Evaluations',
        status: 'Operational',
        effectiveDate: '2023-11 → Ongoing',
        summary: 'Government-backed technical testing of frontier models for cyber offense, autonomous replication, and chemical/biological misuse safeguards alongside Bletchley Declaration leadership.'
      },
      {
        name: 'Online Safety Act & ICO Biometric Governance',
        status: 'In Force',
        effectiveDate: '2024–2026',
        summary: 'Statutory duties covering synthetic media harms, deepfakes, non-consensual imagery, and UK GDPR enforcement over facial recognition & training data scraping.'
      }
    ],
    matchPatterns: ['united kingdom', 'london', 'cambridge, uk', 'oxford, uk', 'uk aisi', 'ncsc', 'westminster', 'bletchley', 'britain', 'british', 'scotland', 'edinburgh', 'ofcom', 'whitehall']
  },
  {
    slug: 'us',
    iso: 'US',
    name: 'United States (Federal)',
    region: 'Americas',
    capital: 'Washington D.C.',
    lat: 38.9072,
    lon: -77.0369,
    posture: 'Sectoral Agency Rules & Export Controls',
    postureColor: '#38bdf8',
    treatyStatus: 'Signatory — Council of Europe Framework Convention on AI (CETS No. 225)',
    regulator: 'NIST / US CAISI, BIS (Commerce), FTC, DOJ & CISA',
    flagshipInstruments: [
      {
        name: 'BIS Advanced Semiconductor & Compute Export Controls',
        status: 'In Force',
        effectiveDate: '2022–2026',
        summary: 'Extraterritorial licensing restrictions on advanced AI accelerators (H100/B200 class), HBM, and EUV/lithography supply chains affecting global frontier cluster distribution.'
      },
      {
        name: 'NIST AI Risk Management Framework (RMF) & CAISI Evaluations',
        status: 'Active Standard',
        effectiveDate: '2023 → Ongoing',
        summary: 'Federal safety benchmarking, GenAI risk profiles, CISA critical-infrastructure AI cybersecurity guidelines, and defense autonomy Directive 3000.09 oversight.'
      }
    ],
    matchPatterns: ['united states', 'washington d.c.', 'white house', 'pentagon', 'cisa', 'nist', 'congress', 'u.s.', 'usa', 'new york', 'virginia', 'austin', 'seattle', 'boston', 'chicago']
  },
  {
    slug: 'us-ca',
    iso: 'US-CA',
    name: 'California (USA)',
    region: 'Americas',
    capital: 'Sacramento / Silicon Valley',
    lat: 38.5816,
    lon: -121.4944,
    posture: 'Frontier Safety Statute (State Lead)',
    postureColor: '#10b981',
    treatyStatus: 'Sub-national Jurisdiction (De Facto US Frontier Lab Benchmark)',
    regulator: 'California Attorney General, CalOES & California Privacy Protection Agency (CPPA)',
    flagshipInstruments: [
      {
        name: 'California SB 53 — Transparency in Frontier AI Act',
        status: 'Enacted Statute',
        effectiveDate: '2025–2026',
        summary: 'First US frontier AI safety statute requiring large foundation model developers to publish safety frameworks, report critical safety/cyber incidents, and protect internal lab whistleblowers.'
      },
      {
        name: 'AB 2013 & CPPA Automated Decisionmaking Technology (ADMT) Rules',
        status: 'In Effect',
        effectiveDate: '2026',
        summary: 'Mandates high-level training dataset summaries, algorithmic impact assessments, and opt-out/notice rights for automated workplace and consumer profiling.'
      }
    ],
    matchPatterns: ['california', 'sacramento', 'san francisco', 'silicon valley', 'palo alto', 'sb 53', 'sb 1047', 'menlo park', 'mountain view']
  },
  {
    slug: 'kr',
    iso: 'KR',
    name: 'South Korea',
    region: 'Indo-Pacific',
    capital: 'Seoul',
    lat: 37.5665,
    lon: 126.9780,
    posture: 'Binding Comprehensive Statute',
    postureColor: '#10b981',
    treatyStatus: 'Host of 2024 Seoul AI Summit & International AI Safety Network Member',
    regulator: 'Ministry of Science and ICT (MSIT), National AI Committee & Korea AI Safety Institute',
    flagshipInstruments: [
      {
        name: 'AI Basic Act (Framework Act on AI Development & Trust) + Decree No. 36053',
        status: 'In Force',
        effectiveDate: '2026-01-22',
        summary: 'Comprehensive national law pairing industrial compute promotion with mandatory high-impact AI risk assessments, Korean-language generative AI labeling, and domestic representative rules for foreign providers.'
      }
    ],
    matchPatterns: ['south korea', 'seoul', 'msit', 'kisa', 'pipc', 'ai basic act', 'busan']
  },
  {
    slug: 'cn',
    iso: 'CN',
    name: 'China',
    region: 'Indo-Pacific',
    capital: 'Beijing / Shenzhen / Shanghai',
    lat: 39.9042,
    lon: 116.4074,
    posture: 'Binding Vertical Algorithmic & GenAI Regime',
    postureColor: '#10b981',
    treatyStatus: 'Global AI Governance Initiative; UN Scientific Dialogue Participant',
    regulator: 'Cyberspace Administration of China (CAC), MIIT & MPS',
    flagshipInstruments: [
      {
        name: 'Interim Measures for Generative AI Services',
        status: 'In Force',
        effectiveDate: '2023-08-15',
        summary: 'Requires public-facing LLMs to complete algorithm registry filings, security assessments, synthetic content watermarking, and training-data legality reviews.'
      },
      {
        name: 'Algorithm Recommendation & Deep Synthesis Regulations',
        status: 'In Force',
        effectiveDate: '2022–2023',
        summary: 'Enforces mandatory synthetic media labeling, recommendation opt-outs, and strict filing oversight across recommendation, voice cloning, and video generation services.'
      }
    ],
    matchPatterns: ['china', 'beijing', 'shenzhen', 'shanghai', 'hangzhou', 'xinjiang', 'hong kong', 'cac', 'miit', 'prc', 'chinese', 'deepseek']
  },
  {
    slug: 'jp',
    iso: 'JP',
    name: 'Japan',
    region: 'Indo-Pacific',
    capital: 'Tokyo',
    lat: 35.6895,
    lon: 139.6917,
    posture: 'Innovation-Forward Statutory + AISI',
    postureColor: '#38bdf8',
    treatyStatus: 'Signatory — Council of Europe AI Convention & Hiroshima AI Process Chair',
    regulator: 'Cabinet Office AI Strategy Council, METI & Japan AI Safety Institute',
    flagshipInstruments: [
      {
        name: 'AI Promotion Act & Hiroshima AI Process Code of Conduct',
        status: 'Enacted Framework',
        effectiveDate: '2025–2026',
        summary: 'Combines R&D incentives with government investigation powers into severe rights/safety incidents and international alignment via Japan AISI.'
      }
    ],
    matchPatterns: ['japan', 'tokyo', 'meti', 'hiroshima', 'osaka', 'kyoto', 'japanese']
  },
  {
    slug: 'sg',
    iso: 'SG',
    name: 'Singapore',
    region: 'Indo-Pacific',
    capital: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    posture: 'Technical Testing & Agentic Governance',
    postureColor: '#38bdf8',
    treatyStatus: 'ASEAN AI Governance Guide Lead & International AISI Network Partner',
    regulator: 'Infocomm Media Development Authority (IMDA) & PDPC',
    flagshipInstruments: [
      {
        name: 'Model AI Governance Framework for Agentic & Generative AI + AI Verify',
        status: 'Operational Framework',
        effectiveDate: '2024–2026',
        summary: 'Open-source evaluation toolkit and practical risk-bounding guardrails for autonomous tool-using AI agents, red-teaming, and cross-border trusted data flows.'
      }
    ],
    matchPatterns: ['singapore', 'imda', 'singaporean']
  },
  {
    slug: 'tw',
    iso: 'TW',
    name: 'Taiwan',
    region: 'Indo-Pacific',
    capital: 'Taipei / Hsinchu',
    lat: 25.0330,
    lon: 121.5654,
    posture: 'Semiconductor Chokepoint & Basic AI Framework',
    postureColor: '#facc15',
    treatyStatus: 'Global Compute Supply-Chain Anchor (TSMC / Hsinchu Corridor)',
    regulator: 'National Science and Technology Council (NSTC) & Ministry of Digital Affairs (MODA)',
    flagshipInstruments: [
      {
        name: 'Taiwan AI Basic Act Framework & Export-Control Compliance',
        status: 'Active Policy',
        effectiveDate: '2025–2026',
        summary: 'Establishes national AI risk governance principles alongside strict wafer-foundry customer due diligence and critical subsea-cable resilience.'
      }
    ],
    matchPatterns: ['taiwan', 'taipei', 'hsinchu', 'tsmc', 'taiwanese']
  },
  {
    slug: 'in',
    iso: 'IN',
    name: 'India',
    region: 'Indo-Pacific',
    capital: 'New Delhi / Bengaluru',
    lat: 28.6139,
    lon: 77.2090,
    posture: 'Digital Public Infrastructure & Cyber Rules',
    postureColor: '#facc15',
    treatyStatus: 'Global Partnership on AI (GPAI) & New Delhi AI Summit Hub',
    regulator: 'Ministry of Electronics and Information Technology (MeitY) & CERT-In',
    flagshipInstruments: [
      {
        name: 'IT Rules (Synthetic Media / Platform Duties) & Digital Personal Data Protection Act',
        status: 'In Force',
        effectiveDate: '2023–2026',
        summary: 'Governs deepfake takedown obligations, CERT-In 6-hour cyber incident reporting, Aadhaar/biometric data protections, and sovereign IndiaAI compute subsidies.'
      }
    ],
    matchPatterns: ['india', 'new delhi', 'bengaluru', 'bangalore', 'mumbai', 'meity', 'cert-in', 'aadhaar', 'indian']
  },
  {
    slug: 'ca',
    iso: 'CA',
    name: 'Canada',
    region: 'Americas',
    capital: 'Ottawa / Toronto / Montreal',
    lat: 45.4215,
    lon: -75.6972,
    posture: 'Safety Research & Statutory Reform',
    postureColor: '#38bdf8',
    treatyStatus: 'Signatory — Council of Europe Framework Convention on AI (CETS No. 225)',
    regulator: 'Canadian AI Safety Institute (CAISI), ISED & Office of the Privacy Commissioner',
    flagshipInstruments: [
      {
        name: 'Canadian AI Safety Institute & Voluntary Generative AI Code',
        status: 'Operational',
        effectiveDate: '2023–2026',
        summary: 'Anchors frontier safety research via Mila/Vector academic consortia and advances domestic alignment with the Council of Europe AI Convention.'
      }
    ],
    matchPatterns: ['canada', 'ottawa', 'toronto', 'montreal', 'vancouver', 'canadian', 'citizen lab', 'mila']
  },
  {
    slug: 'br',
    iso: 'BR',
    name: 'Brazil',
    region: 'Americas',
    capital: 'Brasília / São Paulo',
    lat: -15.7975,
    lon: -47.8919,
    posture: 'Rights-Based Statute & Biometric Enforcement',
    postureColor: '#10b981',
    treatyStatus: 'Global South AI Rights Leader & G20 Digital Governance Architect',
    regulator: 'National Data Protection Authority (ANPD) & SIA',
    flagshipInstruments: [
      {
        name: 'Brazilian AI Regulatory Framework (PL 2338) & ANPD Enforcement Actions',
        status: 'Active Enforcement / Legislative Rollout',
        effectiveDate: '2024–2026',
        summary: 'Establishes strict biometric consent suspensions (including Worldcoin/training-data orders under LGPD), algorithmic impact rights, and tiered risk governance.'
      }
    ],
    matchPatterns: ['brazil', 'brasília', 'brasilia', 'são paulo', 'sao paulo', 'anpd', 'lgpd', 'brazilian']
  },
  {
    slug: 'ch',
    iso: 'CH',
    name: 'Switzerland',
    region: 'Europe',
    capital: 'Bern / Geneva',
    lat: 46.9480,
    lon: 7.4474,
    posture: 'Treaty Alignment & Sectoral Oversight',
    postureColor: '#38bdf8',
    treatyStatus: 'Signatory — Council of Europe AI Convention (CETS No. 225) Domestic Bill',
    regulator: 'Federal Department of Justice & Police (FDJP), OFCOM & FDPIC',
    flagshipInstruments: [
      {
        name: 'Swiss Federal AI Convention Implementation Package',
        status: 'Legislative Alignment',
        effectiveDate: '2025–2026',
        summary: 'Adapts Swiss sectoral law to ratify the Council of Europe AI Convention while hosting UNOG Geneva multilateral AI & LAWS diplomacy.'
      }
    ],
    matchPatterns: ['switzerland', 'bern', 'zurich', 'swiss', 'geneva']
  },
  {
    slug: 'un',
    iso: 'UN',
    name: 'United Nations (Multilateral)',
    region: 'Multilateral',
    capital: 'Geneva / New York',
    lat: 46.2227,
    lon: 6.1428,
    posture: 'Multilateral Scientific & Treaty Forum',
    postureColor: '#a855f7',
    treatyStatus: 'Global Digital Compact & Independent International Scientific Panel on AI',
    regulator: 'UN Office for Disarmament Affairs (UNODA), UNESCO & ITU',
    flagshipInstruments: [
      {
        name: 'UN Independent International Scientific Panel on AI & Global Dialogue',
        status: 'Operational',
        effectiveDate: '2025–2026',
        summary: 'Co-chaired multilateral scientific body producing global risk assessments to anchor the Geneva UN Global Dialogue on AI Governance.'
      },
      {
        name: 'UN CCW GGE on Lethal Autonomous Weapons Systems (LAWS)',
        status: 'Ongoing Treaty Negotiations',
        effectiveDate: '2017 → 2026',
        summary: 'Multilateral negotiations toward a legally binding two-tier treaty prohibiting autonomous weapons lacking meaningful human control.'
      }
    ],
    matchPatterns: ['united nations', 'unog', 'unga', 'un general assembly', 'un security council', 'unesco', 'unoda', 'ccw', 'lethal autonomous', 'killer robot']
  },
  {
    slug: 'au-continent',
    iso: 'AU',
    name: 'African Union',
    region: 'MENA & Africa',
    capital: 'Addis Ababa',
    lat: 9.0320,
    lon: 38.7469,
    posture: 'Continental Strategy & Digital Sovereignty',
    postureColor: '#a855f7',
    treatyStatus: 'AU Continental AI Strategy (55 Member States)',
    regulator: 'AU Commission (ESTI) & Smart Africa',
    flagshipInstruments: [
      {
        name: 'African Union Continental Artificial Intelligence Strategy',
        status: 'Adopted Continental Framework',
        effectiveDate: '2024–2026',
        summary: 'Coordinates member-state AI readiness, local language datasets, fair data/mineral value capture, and protection against imported biometric surveillance harms.'
      }
    ],
    matchPatterns: ['african union', 'addis ababa', 'kenya', 'nairobi', 'nigeria', 'lagos', 'south africa', 'johannesburg', 'cape town', 'ghana', 'accra', 'rwanda', 'kigali', 'egypt', 'cairo']
  },
  {
    slug: 'ee',
    iso: 'EE',
    name: 'Estonia',
    region: 'Europe',
    capital: 'Tallinn',
    lat: 59.4370,
    lon: 24.7536,
    posture: 'EU AI Act + NATO Cyber Doctrine Hub',
    postureColor: '#10b981',
    treatyStatus: 'EU Member (CoE AI Convention Ratified) & Host of NATO CCDCOE',
    regulator: 'Consumer Protection and Technical Regulatory Authority (TTJA) & RIA',
    flagshipInstruments: [
      {
        name: 'Tallinn Manual 3.0 & NATO CCDCOE Cyber Operations Jurisprudence',
        status: 'Authoritative Doctrine Update',
        effectiveDate: '2025–2026',
        summary: 'Defines international law applicability for state-sponsored cyber operations, AI-accelerated intrusion campaigns, and critical infrastructure defense.'
      }
    ],
    matchPatterns: ['estonia', 'tallinn', 'ccdcoe', 'estonian']
  },
  {
    slug: 'at',
    iso: 'AT',
    name: 'Austria',
    region: 'Europe',
    capital: 'Vienna',
    lat: 48.2082,
    lon: 16.3738,
    posture: 'EU AI Act + Autonomous Weapons Diplomacy',
    postureColor: '#10b981',
    treatyStatus: 'EU Member & UNGA First Committee LAWS Sponsor',
    regulator: 'Austrian Regulatory Authority (RTR) & Federal Chancellery',
    flagshipInstruments: [
      {
        name: 'Vienna Declaration ("Humanity at the Crossroads") & UNGA 78/241 Coalition',
        status: 'Diplomatic Coalition',
        effectiveDate: '2024–2026',
        summary: 'Spearheads 150+ state diplomatic momentum for binding legal rules restricting dehumanizing algorithmic targeting and autonomous weapons.'
      }
    ],
    matchPatterns: ['austria', 'vienna', 'austrian', 'osce']
  },
  {
    slug: 'cr',
    iso: 'CR',
    name: 'Costa Rica',
    region: 'Americas',
    capital: 'San José',
    lat: 9.9281,
    lon: -84.0907,
    posture: 'Regional Disarmament & AI Ethics Lead',
    postureColor: '#a855f7',
    treatyStatus: 'Belén Communiqué on Autonomous Weapons (33+ LAC States)',
    regulator: 'MICITT & Ministry of Foreign Affairs',
    flagshipInstruments: [
      {
        name: 'Belén Declaration on Lethal Autonomous Weapons Systems',
        status: 'Regional Diplomatic Instrument',
        effectiveDate: '2023–2026',
        summary: 'Latin American and Caribbean consensus calling for urgent legally binding IHL prohibitions and regulations on autonomous weapon systems.'
      }
    ],
    matchPatterns: ['costa rica', 'san josé', 'san jose, costa rica', 'belén', 'belen', 'latin america']
  },
  {
    slug: 'se',
    iso: 'SE',
    name: 'Sweden',
    region: 'Europe',
    capital: 'Stockholm',
    lat: 59.3293,
    lon: 18.0686,
    posture: 'EU AI Act + Arms Control Research',
    postureColor: '#10b981',
    treatyStatus: 'EU Member (CoE AI Convention Ratified)',
    regulator: 'Swedish Authority for Privacy Protection (IMY) & PTS',
    flagshipInstruments: [
      {
        name: 'EU AI Act National Implementation & SIPRI Military AI Monitoring',
        status: 'Operational',
        effectiveDate: '2024–2026',
        summary: 'Enforces EU AI Act transparency and privacy mandates while hosting SIPRI global research on military AI proliferation.'
      }
    ],
    matchPatterns: ['sweden', 'stockholm', 'sipri', 'swedish']
  },
  {
    slug: 'fr',
    iso: 'FR',
    name: 'France',
    region: 'Europe',
    capital: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
    posture: 'EU Enforcement & Frontier Compute Hub',
    postureColor: '#10b981',
    treatyStatus: 'EU Member (CoE AI Convention Ratified) & Paris AI Action Summit Host',
    regulator: 'CNIL, ANSSI & PEReN',
    flagshipInstruments: [
      {
        name: 'CNIL AI Development Guidance & Paris AI Action Summit Charter',
        status: 'In Force',
        effectiveDate: '2024–2026',
        summary: 'Combines strict GDPR training-data enforcement via CNIL with European open-weights/sovereign-compute initiatives.'
      }
    ],
    matchPatterns: ['france', 'paris', 'cnil', 'anssi', 'mistral', 'french']
  },
  {
    slug: 'de',
    iso: 'DE',
    name: 'Germany',
    region: 'Europe',
    capital: 'Berlin',
    lat: 52.5200,
    lon: 13.4050,
    posture: 'EU Enforcement & Critical Cyber Security',
    postureColor: '#10b981',
    treatyStatus: 'EU Member (CoE AI Convention Ratified)',
    regulator: 'Bundesnetzagentur (BNetzA) & BSI',
    flagshipInstruments: [
      {
        name: 'German AI Act Market Surveillance & BSI AI Cybersecurity Guidelines',
        status: 'In Force',
        effectiveDate: '2025–2026',
        summary: 'Integrates EU AI Act oversight under BNetzA with strict BSI security standards for critical industrial, energy, and telecom AI deployments.'
      }
    ],
    matchPatterns: ['germany', 'berlin', 'bsi', 'bundestag', 'frankfurt', 'munich', 'german']
  },
  {
    slug: 'au',
    iso: 'AUS',
    name: 'Australia',
    region: 'Indo-Pacific',
    capital: 'Canberra / Sydney',
    lat: -35.2809,
    lon: 149.1300,
    posture: 'Mandatory High-Risk Guardrails Consultation',
    postureColor: '#facc15',
    treatyStatus: 'Quad Cyber & Critical Infrastructure Partner',
    regulator: 'Department of Industry, Science & Resources (DISR), OAIC & ASD/ACSC',
    flagshipInstruments: [
      {
        name: 'Voluntary AI Safety Standard & High-Risk Guardrails Framework',
        status: 'Active Policy',
        effectiveDate: '2024–2026',
        summary: 'Establishes 10 mandatory-style guardrails for testing, transparency, and human accountability in high-risk AI alongside OAIC privacy enforcement.'
      }
    ],
    matchPatterns: ['australia', 'canberra', 'sydney', 'melbourne', 'australian', 'acsc']
  },
  {
    slug: 'il',
    iso: 'IL',
    name: 'Israel',
    region: 'MENA & Africa',
    capital: 'Tel Aviv / Jerusalem',
    lat: 32.0853,
    lon: 34.7818,
    posture: 'Sectoral Regulation & Defense Tech Oversight',
    postureColor: '#facc15',
    treatyStatus: 'Signatory — Council of Europe Framework Convention on AI (CETS No. 225)',
    regulator: 'Privacy Protection Authority (PPA) & Israel Innovation Authority',
    flagshipInstruments: [
      {
        name: 'CoE AI Convention Alignment & Algorithmic Targeting IHL Debates',
        status: 'Policy & International Review',
        effectiveDate: '2024–2026',
        summary: 'Centers global debate on military AI decision-support systems ("Lavender", "Habsora") under International Humanitarian Law alongside commercial privacy rules.'
      }
    ],
    matchPatterns: ['israel', 'tel aviv', 'jerusalem', 'gaza', 'west bank', 'lavender', 'nso group', 'pegasus']
  },
  {
    slug: 'ae',
    iso: 'AE',
    name: 'United Arab Emirates',
    region: 'MENA & Africa',
    capital: 'Abu Dhabi / Dubai',
    lat: 24.4539,
    lon: 54.3773,
    posture: 'Sovereign Compute & Strategic AI Governance',
    postureColor: '#facc15',
    treatyStatus: 'US–UAE Compute Security & Sovereign Cloud Partnerships',
    regulator: 'UAE Artificial Intelligence Office & DIFC Data Protection Commissioner',
    flagshipInstruments: [
      {
        name: 'UAE AI Charter & DIFC Autonomous/Semi-Autonomous Processing Rules',
        status: 'In Force',
        effectiveDate: '2024–2026',
        summary: 'Balances hyperscale frontier compute investment with DIFC binding human-oversight rights and strict export-compliance agreements.'
      }
    ],
    matchPatterns: ['united arab emirates', 'uae', 'abu dhabi', 'dubai', 'g42', 'emirati']
  },
  {
    slug: 'za',
    iso: 'ZA',
    name: 'South Africa',
    region: 'MENA & Africa',
    capital: 'Pretoria / Cape Town',
    lat: -25.7479,
    lon: 28.2293,
    posture: 'POPIA Algorithmic Safeguards & National AI Framework',
    postureColor: '#10b981',
    treatyStatus: 'AU Continental AI Strategy Lead & GPAI / BRICS Governance Participant',
    regulator: 'Information Regulator (POPIA Section 71) & DCDT AI Policy Desk',
    flagshipInstruments: [
      {
        name: 'South Africa National AI Policy Framework & POPIA Section 71',
        status: 'In Enforcement & Policy Rollout',
        effectiveDate: '2024–2026',
        summary: 'Couples statutory Protection of Personal Information Act Section 71 protections against sole automated decisions with national ethical AI, local compute access, and constitutional surveillance oversight.'
      }
    ],
    matchPatterns: ['south africa', 'pretoria', 'johannesburg', 'cape town', 'popia', 'dcdt']
  },
  {
    slug: 'ke',
    iso: 'KE',
    name: 'Kenya',
    region: 'MENA & Africa',
    capital: 'Nairobi',
    lat: -1.2921,
    lon: 36.8219,
    posture: 'Biometric Data Sovereignty & Robotics/AI Strategy',
    postureColor: '#10b981',
    treatyStatus: 'AU Continental AI Strategy & UN AI Advisory Engagement',
    regulator: 'Office of the Data Protection Commissioner (ODPC) & Ministry of ICT',
    flagshipInstruments: [
      {
        name: 'Kenya National AI Strategy (2025–2030) & Data Protection Act Sec. 35',
        status: 'In Effect / Statutory Biometrics Orders',
        effectiveDate: '2024–2026',
        summary: 'Landmark East African regulatory hub combining strict ODPC enforcement against unlawful iris/facial biometric harvesting with sovereign digital public infrastructure rules.'
      }
    ],
    matchPatterns: ['kenya', 'nairobi', 'odpc', 'kenyan']
  },
  {
    slug: 'ng',
    iso: 'NG',
    name: 'Nigeria',
    region: 'MENA & Africa',
    capital: 'Abuja / Lagos',
    lat: 9.0765,
    lon: 7.3986,
    posture: 'National AI Strategy & Statutory Data Protection',
    postureColor: '#38bdf8',
    treatyStatus: 'AU Continental AI Strategy & ECOWAS Cyber Directive',
    regulator: 'NITDA / NCAIR & Nigeria Data Protection Commission (NDPC)',
    flagshipInstruments: [
      {
        name: 'Nigeria National AI Strategy (NAIS) & Nigeria Data Protection Act',
        status: 'In Effect / Strategy Operational',
        effectiveDate: '2024–2026',
        summary: 'Establishes sovereign multilingual AI infrastructure (N-ATLAS), fintech algorithmic fairness rules, and mandatory NDPC automated processing impact assessments.'
      }
    ],
    matchPatterns: ['nigeria', 'abuja', 'lagos', 'nitda', 'ndpc', 'ncair']
  },
  {
    slug: 'eg',
    iso: 'EG',
    name: 'Egypt',
    region: 'MENA & Africa',
    capital: 'Cairo',
    lat: 30.0444,
    lon: 31.2357,
    posture: 'National AI Strategy (2nd Ed.) & Responsible AI Charter',
    postureColor: '#38bdf8',
    treatyStatus: 'Arab League AI Working Group & African Union AI Strategy',
    regulator: 'National Council for Artificial Intelligence (NCAI)',
    flagshipInstruments: [
      {
        name: 'Egyptian Charter for Responsible AI & Second National AI Strategy (2025–2030)',
        status: 'Active National Policy',
        effectiveDate: '2025–2030',
        summary: 'Sets transparency, explainability, and Arabic NLP equity commitments alongside critical-infrastructure cybersecurity directives.'
      }
    ],
    matchPatterns: ['egypt', 'cairo', 'egyptian', 'ncai']
  },
  {
    slug: 'rw',
    iso: 'RW',
    name: 'Rwanda',
    region: 'MENA & Africa',
    capital: 'Kigali',
    lat: -1.9441,
    lon: 30.0619,
    posture: 'Agile AI Regulatory Sandbox & Data Protection Law',
    postureColor: '#38bdf8',
    treatyStatus: 'AU AI Strategy & UN Secretary-General AI Governance Coalition',
    regulator: 'Ministry of ICT & Innovation / Centre for the Fourth Industrial Revolution Rwanda',
    flagshipInstruments: [
      {
        name: 'National AI Policy & C4IR Agile Governance Framework',
        status: 'Operational',
        effectiveDate: '2023–2026',
        summary: 'Pairs a risk-tiered algorithmic regulatory sandbox in Kigali with statutory personal data localization and public healthcare AI standards.'
      }
    ],
    matchPatterns: ['rwanda', 'kigali', 'rwandan']
  },
  {
    slug: 'sa',
    iso: 'SA',
    name: 'Saudi Arabia',
    region: 'MENA & Africa',
    capital: 'Riyadh',
    lat: 24.7136,
    lon: 46.6753,
    posture: 'Sovereign Compute & Generative AI Ethics Mandate',
    postureColor: '#facc15',
    treatyStatus: 'UNESCO AI Ethics Champion & UN AI Capacity Partnerships',
    regulator: 'Saudi Data & Artificial Intelligence Authority (SDAIA)',
    flagshipInstruments: [
      {
        name: 'SDAIA Generative AI Guidelines, Deepfake Rules & PDPL',
        status: 'Active Guidelines + Binding PDPL',
        effectiveDate: '2024–2026',
        summary: 'Governs massive sovereign GPU cluster expansion (HUMAIN / NEOM) alongside PDPL data transfer rules and mandatory deepfake disclosures.'
      }
    ],
    matchPatterns: ['saudi arabia', 'riyadh', 'sdaia', 'saudi', 'neom']
  },
  {
    slug: 'id',
    iso: 'ID',
    name: 'Indonesia',
    region: 'Indo-Pacific',
    capital: 'Jakarta',
    lat: -6.2088,
    lon: 106.8456,
    posture: 'Personal Data Protection Enforcement & Ethical AI Circular',
    postureColor: '#10b981',
    treatyStatus: 'ASEAN Guide on AI Governance & Ethics Co-Chair',
    regulator: 'Ministry of Communication and Digital Affairs (Komdigi)',
    flagshipInstruments: [
      {
        name: 'UU PDP (Law No. 27/2022) & Circular Letter No. 9/2023 on AI Ethics',
        status: 'In Full Legal Force (Oct 2024+)',
        effectiveDate: '2024–2026',
        summary: 'Enforces binding consent, algorithmic profiling objections, and sovereign cloud accountability across ASEAN\'s largest digital economy alongside draft Presidential AI Regulation.'
      }
    ],
    matchPatterns: ['indonesia', 'jakarta', 'komdigi', 'kominfo', 'uu pdp', 'indonesian']
  },
  {
    slug: 'my',
    iso: 'MY',
    name: 'Malaysia',
    region: 'Indo-Pacific',
    capital: 'Kuala Lumpur / Putrajaya',
    lat: 3.1390,
    lon: 101.6869,
    posture: 'National AI Office & Compute Infrastructure Governance',
    postureColor: '#38bdf8',
    treatyStatus: 'ASEAN AI Safety Network Host Leadership (2025–2026)',
    regulator: 'National Artificial Intelligence Office (NAIO) & Ministry of Digital',
    flagshipInstruments: [
      {
        name: 'National Guidelines on AI Governance & Ethics (AIGE) + NAIO Mandate',
        status: 'Operational Policy Framework',
        effectiveDate: '2024–2026',
        summary: 'Coordinates ethical AI impact standards, OSAT semiconductor export integrity, and water/grid compliance for hyperscale ASEAN data centers in Johor and Kuala Lumpur.'
      }
    ],
    matchPatterns: ['malaysia', 'kuala lumpur', 'putrajaya', 'johor', 'naio', 'malaysian']
  },
  {
    slug: 'vn',
    iso: 'VN',
    name: 'Vietnam',
    region: 'Indo-Pacific',
    capital: 'Hanoi',
    lat: 21.0285,
    lon: 105.8542,
    posture: 'Digital Technology Industry Law & Sovereign Data Controls',
    postureColor: '#10b981',
    treatyStatus: 'ASEAN AI Governance Working Group Member',
    regulator: 'Ministry of Information and Communications & Ministry of Science and Technology',
    flagshipInstruments: [
      {
        name: 'Law on Digital Technology Industry & Risk-Classified AI Rules',
        status: 'Enacted (Effective 2026)',
        effectiveDate: '2026-01-01',
        summary: 'Enacts ASEAN\'s first standalone statutory risk classification for AI systems, mandatory AI-generated content labeling, and strict cybersecurity localization obligations.'
      }
    ],
    matchPatterns: ['vietnam', 'hanoi', 'ho chi minh', 'vietnamese']
  },
  {
    slug: 'ph',
    iso: 'PH',
    name: 'Philippines',
    region: 'Indo-Pacific',
    capital: 'Manila',
    lat: 14.5995,
    lon: 120.9842,
    posture: 'Data Privacy Automated Processing Oversight & National AI Roadmap 2.0',
    postureColor: '#38bdf8',
    treatyStatus: 'ASEAN AI Guide & UNESCO AI Ethics Partner',
    regulator: 'National Privacy Commission (NPC) & DICT',
    flagshipInstruments: [
      {
        name: 'NPC Advisory on Personal Data in AI Systems & National AI Strategy 2.0',
        status: 'Active Regulatory Guidance',
        effectiveDate: '2024–2026',
        summary: 'Establishes binding Data Privacy Act compliance requirements for model training transparency, automated employment screening, and deepfake consumer protections.'
      }
    ],
    matchPatterns: ['philippines', 'manila', 'philippine', 'dict']
  },
  {
    slug: 'cl',
    iso: 'CL',
    name: 'Chile',
    region: 'Americas',
    capital: 'Santiago',
    lat: -33.4489,
    lon: -70.6693,
    posture: 'Neuro-Rights Constitutional Mandate & Risk-Tiered AI Bill',
    postureColor: '#10b981',
    treatyStatus: 'Belén Communiqué on LAWS & CENIA ILIA Latin America Benchmark Lead',
    regulator: 'Ministry of Science (MinCiencia) & Personal Data Protection Agency',
    flagshipInstruments: [
      {
        name: 'Constitutional Neuro-Rights Amendment & Chilean Risk-Based AI Bill + ILIA Index',
        status: 'Constitutional Law + Legislative Advancement',
        effectiveDate: '2021–2026',
        summary: 'World\'s first constitutional protection for mental privacy against exploitative neuro-AI paired with EU-inspired risk tiers and CENIA\'s annual Latin American AI Index.'
      }
    ],
    matchPatterns: ['chile', 'santiago', 'chilean', 'cenia', 'ilia']
  },
  {
    slug: 'co',
    iso: 'CO',
    name: 'Colombia',
    region: 'Americas',
    capital: 'Bogotá',
    lat: 4.7110,
    lon: -74.0721,
    posture: 'CONPES National AI Policy & Constitutional Judicial Guidelines',
    postureColor: '#38bdf8',
    treatyStatus: 'Cartagena Declaration Lead & OECD AI Principles Adherent',
    regulator: 'MinTIC, SIC (Data Authority) & Constitutional Court Algorithmic Rulings',
    flagshipInstruments: [
      {
        name: 'CONPES National AI Policy & Constitutional Court Ruling T-323/2024',
        status: 'Active Judicial & Executive Rules',
        effectiveDate: '2024–2026',
        summary: 'Establishes binding judicial non-delegation and human-verification safeguards for AI used in courts alongside comprehensive public-sector algorithmic transparency.'
      }
    ],
    matchPatterns: ['colombia', 'bogota', 'bogotá', 'colombian', 'mintic']
  },
  {
    slug: 'mx',
    iso: 'MX',
    name: 'Mexico',
    region: 'Americas',
    capital: 'Mexico City',
    lat: 19.4326,
    lon: -99.1332,
    posture: 'Federal AI Bills, Anti-Spyware Oversight & OECD Alignment',
    postureColor: '#38bdf8',
    treatyStatus: 'UNESCO RAM Assessment & Belén LAWS Coalition Signatory',
    regulator: 'National AI Alliance & Mexican Federal Telecom / Data Authorities',
    flagshipInstruments: [
      {
        name: 'Mexican Senate Ethical AI Legislative Package & Commercial Spyware Audit Directives',
        status: 'Pending Statutory Reform',
        effectiveDate: '2024–2026',
        summary: 'Addresses biometric surveillance governance, automated platform deepfakes, and civil-society accountability following documented mercenary spyware abuses.'
      }
    ],
    matchPatterns: ['mexico', 'mexico city', 'mexican', 'cdmx']
  },
  {
    slug: 'ua',
    iso: 'UA',
    name: 'Ukraine',
    region: 'Europe',
    capital: 'Kyiv',
    lat: 50.4501,
    lon: 30.5234,
    posture: 'EU AI Act Alignment Roadmap & Battlefield Defense AI Proving Ground',
    postureColor: '#fb923c',
    treatyStatus: 'CoE Framework Convention Signatory & Brave1 Autonomy Standards',
    regulator: 'Ministry of Digital Transformation (MinDigital) & Brave1 Defense Cluster',
    flagshipInstruments: [
      {
        name: 'White Paper on AI Regulation (Bottom-Up EU Convergence) & Defense Autonomy Doctrine',
        status: 'Active Roadmap + Wartime Field Protocols',
        effectiveDate: '2024–2026',
        summary: 'Navigates pre-accession convergence toward EU AI Act compliance while serving as the world\'s primary testing ground for AI terminal-guidance drones, acoustic swarms, and cyber-defense.'
      }
    ],
    matchPatterns: ['ukraine', 'kyiv', 'kharkiv', 'dnipro', 'odesa', 'ukrainian', 'brave1']
  }
];

export function getJurisdictionBySlug(slugOrIso) {
  if (!slugOrIso) return null;
  const clean = String(slugOrIso).trim().toLowerCase();
  return (
    JURISDICTIONS.find(
      (j) =>
        j.slug.toLowerCase() === clean ||
        j.iso.toLowerCase() === clean ||
        j.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean
    ) || null
  );
}

export function resolveJurisdictionForLocation(locationOrCountry) {
  if (!locationOrCountry) return null;
  const text = String(locationOrCountry).toLowerCase();

  // Check exact jurisdiction names first
  for (const j of JURISDICTIONS) {
    if (text === j.name.toLowerCase() || text.includes(j.name.toLowerCase())) {
      return j;
    }
  }

  // Match against curated patterns (prioritize specific sub-national entries like us-ca before us)
  const ordered = [
    ...JURISDICTIONS.filter((j) => j.slug.includes('-')),
    ...JURISDICTIONS.filter((j) => !j.slug.includes('-'))
  ];
  for (const j of ordered) {
    for (const pat of j.matchPatterns) {
      const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
        return j;
      }
    }
  }
  return null;
}

export function eventMatchesJurisdiction(event, jurisdiction) {
  if (!event || !jurisdiction) return false;
  const haystack = `${event.location || ''} ${event.title || event.name || ''} ${event.details?.summary || event.summary || ''}`;
  for (const pat of jurisdiction.matchPatterns) {
    const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(haystack)) {
      return true;
    }
  }
  return false;
}
