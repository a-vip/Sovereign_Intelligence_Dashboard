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
    matchPatterns: ['united states', 'united states of america', 'washington d.c.', 'white house', 'pentagon', 'cisa', 'nist', 'congress', 'u.s.', 'u.s.a.', 'usa', 'america', 'american', 'new york', 'virginia', 'austin', 'seattle', 'boston', 'chicago', 'san francisco', 'california', 'colorado', 'texas']
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
  },
  // ── PHASE 19: GLOBAL COVERAGE EXPANSION (22 ADDITIONAL JURISDICTIONS → 60 TOTAL) ──
  {
    slug: 'us-co',
    iso: 'US-CO',
    name: 'Colorado (USA)',
    region: 'Americas',
    capital: 'Denver, Colorado',
    lat: 39.7392,
    lon: -104.9903,
    posture: 'High-Risk Algorithmic Anti-Discrimination Statute',
    postureColor: '#10b981',
    treatyStatus: 'Sub-national US Comprehensive Statute (SB 24-205)',
    regulator: 'Colorado Attorney General (Consumer Protection & Civil Rights Division)',
    flagshipInstruments: [
      {
        name: 'Colorado AI Act (SB 24-205)',
        status: 'Enacted Statute',
        effectiveDate: '2026-06-30',
        summary: 'Requires developers and deployers of high-risk AI systems making consequential decisions (housing, employment, credit, healthcare) to exercise reasonable care against algorithmic discrimination and provide impact assessments.'
      }
    ],
    matchPatterns: ['colorado', 'sb 24-205', 'sb21-169', 'denver']
  },
  {
    slug: 'us-ny',
    iso: 'US-NY',
    name: 'New York (USA)',
    region: 'Americas',
    capital: 'Albany / New York City',
    lat: 40.7128,
    lon: -74.0060,
    posture: 'Hiring Audit Mandate & Frontier Safety Legislative Lead',
    postureColor: '#38bdf8',
    treatyStatus: 'Sub-national Jurisdiction (RAISE Act & NYC Local Law 144)',
    regulator: 'NY Department of Financial Services (NYDFS), NYC DCWP & NY Attorney General',
    flagshipInstruments: [
      {
        name: 'NYC Local Law 144 (AEDT) & New York RAISE Act Proposals',
        status: 'Local Law Enforced + State Frontier Bill',
        effectiveDate: '2023-07 → Ongoing',
        summary: 'Mandates independent annual bias audits for automated employment decision tools in NYC alongside state legislative safety-protocol duties for frontier AI labs.'
      }
    ],
    matchPatterns: ['new york', 'nyc', 'local law 144', 'raise act', 'albany', 'nydfs']
  },
  {
    slug: 'us-tx',
    iso: 'US-TX',
    name: 'Texas (USA)',
    region: 'Americas',
    capital: 'Austin, Texas',
    lat: 30.2672,
    lon: -97.7431,
    posture: 'Statutory Biometric Enforcement & Responsible AI Act (TRAIGA)',
    postureColor: '#10b981',
    treatyStatus: 'Sub-national US Enforcement Hub (CUBI & TRAIGA)',
    regulator: 'Texas Attorney General & Texas Department of Information Resources',
    flagshipInstruments: [
      {
        name: 'Texas Responsible AI Governance Act (TRAIGA) & Capture or Use of Biometric Identifier Act (CUBI)',
        status: 'In Force / Active Enforcement',
        effectiveDate: '2025–2026',
        summary: 'Prohibits behavioral manipulation, unconstitutional social scoring, and unconsented commercial facial/biometric capture backed by multi-billion-dollar AG civil settlements.'
      }
    ],
    matchPatterns: ['texas', 'traiga', 'austin', 'dallas', 'cubi']
  },
  {
    slug: 'ar',
    iso: 'AR',
    name: 'Argentina',
    region: 'Americas',
    capital: 'Buenos Aires',
    lat: -34.6037,
    lon: -58.3816,
    posture: 'Rights-Based Guidelines & Public-Sector Transparency',
    postureColor: '#38bdf8',
    treatyStatus: 'UNESCO RAM Partner & CoE Observer',
    regulator: 'Access to Public Information Agency (AAIP) & Secretariat of Innovation',
    flagshipInstruments: [
      {
        name: 'AAIP Program for Transparency & Protection of Personal Data in the Use of AI',
        status: 'Active Guidance & Legislative Bills',
        effectiveDate: '2023–2026',
        summary: 'Integrates algorithmic impact accountability and data-subject contestability rights into Argentina\'s Personal Data Protection Act framework.'
      }
    ],
    matchPatterns: ['argentina', 'buenos aires', 'aaip', 'argentinian']
  },
  {
    slug: 'pe',
    iso: 'PE',
    name: 'Peru',
    region: 'Americas',
    capital: 'Lima',
    lat: -12.0464,
    lon: -77.0428,
    posture: 'Binding National AI Law (Law No. 31814)',
    postureColor: '#10b981',
    treatyStatus: 'Latin America First Standalone Binding AI Statute',
    regulator: 'Presidency of the Council of Ministers — Secretariat of Government & Digital Transformation (SGTD)',
    flagshipInstruments: [
      {
        name: 'Law No. 31814 Promoting the Use of Artificial Intelligence & Supreme Decree Regulation',
        status: 'Binding Statute',
        effectiveDate: '2023-07 → 2026',
        summary: 'Establishes human oversight, algorithmic transparency, risk tiers, and sovereign digital-infrastructure mandates across Peruvian public and private deployments.'
      }
    ],
    matchPatterns: ['peru', 'lima', '31814', 'peruvian', 'sgtd']
  },
  {
    slug: 'nl',
    iso: 'NL',
    name: 'Netherlands',
    region: 'Europe',
    capital: 'The Hague / Amsterdam',
    lat: 52.0705,
    lon: 4.3007,
    posture: 'Algorithmic Registry & EU AI Act Supervision',
    postureColor: '#10b981',
    treatyStatus: 'EU Member State (Reg. 2024/1689) & CoE Signatory',
    regulator: 'Dutch Data Protection Authority (AP — Algorithmic Coordination Directorate) & RDI',
    flagshipInstruments: [
      {
        name: 'Dutch National Algorithm Register & AP AI Supervision Directorate',
        status: 'In Active Operation',
        effectiveDate: '2023 → Ongoing',
        summary: 'Following the Toeslagenaffaire welfare scandal, mandates public disclosure of government AI algorithms and strict GDPR/AI Act enforcement over credit and fraud scoring.'
      }
    ],
    matchPatterns: ['netherlands', 'dutch', 'amsterdam', 'the hague', 'autoriteit persoonsgegevens']
  },
  {
    slug: 'es',
    iso: 'ES',
    name: 'Spain',
    region: 'Europe',
    capital: 'Madrid / A Coruña',
    lat: 40.4168,
    lon: -3.7038,
    posture: 'First EU Member State with Dedicated National AI Supervisory Agency (AESIA)',
    postureColor: '#10b981',
    treatyStatus: 'EU Member State (Reg. 2024/1689) & Regulatory Sandbox Pioneer',
    regulator: 'Spanish Agency for the Supervision of Artificial Intelligence (AESIA) & AEPD',
    flagshipInstruments: [
      {
        name: 'AESIA Statutory Oversight & Royal Decree AI Regulatory Sandbox',
        status: 'Operational Agency',
        effectiveDate: '2023 → Ongoing',
        summary: 'Spain established AESIA in A Coruña as Europe\'s first dedicated national AI supervisor, coordinating high-risk compliance pilots alongside AEPD biometric enforcement.'
      }
    ],
    matchPatterns: ['spain', 'madrid', 'aesia', 'aepd', 'spanish', 'coruña', 'barcelona']
  },
  {
    slug: 'it',
    iso: 'IT',
    name: 'Italy',
    region: 'Europe',
    capital: 'Rome',
    lat: 41.9028,
    lon: 12.4964,
    posture: 'National AI Law Complementing EU AI Act + Garante Enforcement',
    postureColor: '#10b981',
    treatyStatus: 'EU Member State (Reg. 2024/1689) & G7 Hiroshima Coordinator',
    regulator: 'Agenzia per l\'Italia Digitale (AgID), ACN (Cybersecurity) & Garante Privacy',
    flagshipInstruments: [
      {
        name: 'Italian National Artificial Intelligence Law & Garante Foundation-Model Orders',
        status: 'Binding National Statute + Active DPA Orders',
        effectiveDate: '2024–2026',
        summary: 'Pairs criminal deepfake sanctions, copyright safeguards, and healthcare/justice AI rules with Garante GDPR orders against unlawful LLM training and age-gating failures.'
      }
    ],
    matchPatterns: ['italy', 'rome', 'garante', 'italian', 'agid', 'milan']
  },
  {
    slug: 'pl',
    iso: 'PL',
    name: 'Poland',
    region: 'Europe',
    capital: 'Warsaw',
    lat: 52.2297,
    lon: 21.0122,
    posture: 'EU AI Act National Implementation & Sovereign Compute Factories',
    postureColor: '#38bdf8',
    treatyStatus: 'EU Member State (Reg. 2024/1689)',
    regulator: 'Commission for Artificial Intelligence Development & Safety (Ministry of Digital Affairs)',
    flagshipInstruments: [
      {
        name: 'Polish Act on Artificial Intelligence Systems & PLGrid / Baltic AI Factory Strategy',
        status: 'Enactment & EU AI Act Enforcement',
        effectiveDate: '2025–2026',
        summary: 'Establishes national AI market surveillance, SME compliance sandboxes, and Polish-language sovereign LLM infrastructure.'
      }
    ],
    matchPatterns: ['poland', 'warsaw', 'polish']
  },
  {
    slug: 'ie',
    iso: 'IE',
    name: 'Ireland',
    region: 'Europe',
    capital: 'Dublin',
    lat: 53.3498,
    lon: -6.2603,
    posture: 'Lead EU GDPR Authority for Hyperscale AI Labs',
    postureColor: '#10b981',
    treatyStatus: 'EU Member State (Reg. 2024/1689)',
    regulator: 'Irish Data Protection Commission (DPC) & Department of Enterprise EU AI Act Authorities',
    flagshipInstruments: [
      {
        name: 'Irish DPC Cross-Border GDPR AI Training Investigations & EU AI Act Competent Authority Designations',
        status: 'Active Lead Enforcement',
        effectiveDate: '2024–2026',
        summary: 'Serves as lead EU supervisory authority over European headquarters of Meta, Google, X, OpenAI Ireland, and Apple on LLM training-data lawfulness and DPIAs.'
      }
    ],
    matchPatterns: ['ireland', 'dublin', 'irish dpc', 'irish']
  },
  {
    slug: 'no',
    iso: 'NO',
    name: 'Norway',
    region: 'Europe',
    capital: 'Oslo',
    lat: 59.9139,
    lon: 10.7522,
    posture: 'EEA EU AI Act Adoption, Regulatory Sandbox & Hydro-Compute Lead',
    postureColor: '#10b981',
    treatyStatus: 'EEA Member Incorporating EU AI Act & CoE AI Convention Signatory',
    regulator: 'Norwegian Communications Authority (Nkom) & Datatilsynet',
    flagshipInstruments: [
      {
        name: 'EEA EU AI Act Transposition & Datatilsynet Responsible AI Regulatory Sandbox',
        status: 'Active Alignment',
        effectiveDate: '2024–2026',
        summary: 'Pairs low-carbon hydroelectric compute infrastructure with pioneering privacy/fairness sandboxes and municipal algorithmic oversight.'
      }
    ],
    matchPatterns: ['norway', 'oslo', 'datatilsynet', 'norwegian']
  },
  {
    slug: 'fi',
    iso: 'FI',
    name: 'Finland',
    region: 'Europe',
    capital: 'Helsinki',
    lat: 60.1699,
    lon: 24.9384,
    posture: 'EU AI Act Supervision & LUMI Exascale AI Hub',
    postureColor: '#10b981',
    treatyStatus: 'EU Member State (Reg. 2024/1689)',
    regulator: 'Finnish Transport and Communications Agency (Traficom) & Office of the Data Protection Ombudsman',
    flagshipInstruments: [
      {
        name: 'Finnish EU AI Act Market Surveillance Act & EuroHPC LUMI AI Factory',
        status: 'Active Implementation',
        effectiveDate: '2025–2026',
        summary: 'Designates Traficom and sectoral authorities for EU AI Act enforcement while hosting Kajaani\'s LUMI zero-carbon supercomputing AI Factory.'
      }
    ],
    matchPatterns: ['finland', 'helsinki', 'traficom', 'lumi', 'kajaani', 'finnish']
  },
  {
    slug: 'th',
    iso: 'TH',
    name: 'Thailand',
    region: 'Indo-Pacific',
    capital: 'Bangkok',
    lat: 13.7563,
    lon: 100.5018,
    posture: 'ASEAN AI Governance Alignment, PDPA & Risk-Based Draft AI Bills',
    postureColor: '#38bdf8',
    treatyStatus: 'ASEAN Guide on AI Governance Co-Architect',
    regulator: 'Electronic Transactions Development Agency (ETDA — AI Governance Center) & PDPC',
    flagshipInstruments: [
      {
        name: 'ETDA AI Governance Guidelines, GenAI Ethics Code & Royal Decree Principles on AI System Service Business',
        status: 'Active Guidance & Draft Statutory Regime',
        effectiveDate: '2023–2026',
        summary: 'Coordinates ASEAN risk-based AI self-assessment tools with Personal Data Protection Act (PDPA) automated-decision enforcement.'
      }
    ],
    matchPatterns: ['thailand', 'bangkok', 'etda', 'thai']
  },
  {
    slug: 'pk',
    iso: 'PK',
    name: 'Pakistan',
    region: 'Indo-Pacific',
    capital: 'Islamabad',
    lat: 33.6844,
    lon: 73.0479,
    posture: 'National AI Policy & Regulatory Directorate Rollout',
    postureColor: '#facc15',
    treatyStatus: 'UNESCO RAM Assessment Participant',
    regulator: 'Ministry of IT & Telecommunication (MoITT) & National AI Directorate',
    flagshipInstruments: [
      {
        name: 'National Artificial Intelligence Policy & AI Regulation Framework Bills',
        status: 'Policy Rollout',
        effectiveDate: '2025–2026',
        summary: 'Targets national AI R&D centers, algorithmic fairness standards, and public-sector cybersecurity across 240M+ citizens.'
      }
    ],
    matchPatterns: ['pakistan', 'islamabad', 'karachi', 'lahore', 'pakistani', 'moitt']
  },
  {
    slug: 'kz',
    iso: 'KZ',
    name: 'Kazakhstan',
    region: 'Indo-Pacific',
    capital: 'Astana',
    lat: 51.1605,
    lon: 71.4704,
    posture: 'Dedicated National AI Law & Alem.AI Center',
    postureColor: '#10b981',
    treatyStatus: 'Central Asia Statutory AI Pioneer',
    regulator: 'Ministry of Digital Development, Innovations & Aerospace Industry (MCRIAP)',
    flagshipInstruments: [
      {
        name: 'Law of the Republic of Kazakhstan on Artificial Intelligence & Concept for AI Development 2024–2029',
        status: 'Statutory Framework',
        effectiveDate: '2024–2026',
        summary: 'Establishes national risk categorization, mandatory synthetic-media labeling, data-localization safeguards, and sovereign Kazakh-language compute infrastructure.'
      }
    ],
    matchPatterns: ['kazakhstan', 'astana', 'almaty', 'kazakh']
  },
  {
    slug: 'uz',
    iso: 'UZ',
    name: 'Uzbekistan',
    region: 'Indo-Pacific',
    capital: 'Tashkent',
    lat: 41.2995,
    lon: 69.2401,
    posture: 'Statutory AI Definition Law & AI Strategy 2030',
    postureColor: '#38bdf8',
    treatyStatus: 'CIS & UNESCO AI Ethics Partner',
    regulator: 'Ministry of Digital Technologies of Uzbekistan',
    flagshipInstruments: [
      {
        name: 'AI Technologies Strategy through 2030 & Law Amending Information Law for AI Labeling',
        status: 'Enacted Amendment + National Strategy',
        effectiveDate: '2024–2026',
        summary: 'Codifies legal definitions for AI systems, mandates labeling of synthetic outputs, and restricts unlawful automated personal-data harm.'
      }
    ],
    matchPatterns: ['uzbekistan', 'tashkent', 'uzbek']
  },
  {
    slug: 'nz',
    iso: 'NZ',
    name: 'New Zealand',
    region: 'Indo-Pacific',
    capital: 'Wellington',
    lat: -41.2865,
    lon: 174.7762,
    posture: 'Public Algorithm Charter & Privacy Act Enforcement',
    postureColor: '#38bdf8',
    treatyStatus: 'OECD AI Principles & APEC CBPR Member',
    regulator: 'Office of the Privacy Commissioner (OPC), MBIE & Stats NZ',
    flagshipInstruments: [
      {
        name: 'Algorithm Charter for Aotearoa New Zealand & OPC Biometric Processing Privacy Code',
        status: 'Binding Code + Government Charter',
        effectiveDate: '2020 → 2026',
        summary: 'Requires central government agencies to explain high-impact algorithms and subjects biometric/facial AI to strict OPC proportionality rules.'
      }
    ],
    matchPatterns: ['new zealand', 'wellington', 'auckland', 'aotearoa', 'nz']
  },
  {
    slug: 'bd',
    iso: 'BD',
    name: 'Bangladesh',
    region: 'Indo-Pacific',
    capital: 'Dhaka',
    lat: 23.8103,
    lon: 90.4125,
    posture: 'Emerging National AI Policy & Digital Infrastructure Governance',
    postureColor: '#facc15',
    treatyStatus: 'Global South Digital Inclusion Partner',
    regulator: 'ICT Division & Bangladesh Computer Council (BCC)',
    flagshipInstruments: [
      {
        name: 'National Artificial Intelligence Policy & National Cyber Security Agency Governance Guidelines',
        status: 'Draft Policy & Sectoral Oversight',
        effectiveDate: '2024–2026',
        summary: 'Prioritizes Bangla-language model capacity, ethical public-administration automation, and algorithmic accountability.'
      }
    ],
    matchPatterns: ['bangladesh', 'dhaka', 'bangladeshi']
  },
  {
    slug: 'om',
    iso: 'OM',
    name: 'Oman',
    region: 'MENA & Africa',
    capital: 'Muscat',
    lat: 23.5880,
    lon: 58.3829,
    posture: 'National AI Program & Binding PDPL Framework',
    postureColor: '#38bdf8',
    treatyStatus: 'GCC AI Governance Alignment',
    regulator: 'Ministry of Transport, Communications & Information Technology (MTCIT)',
    flagshipInstruments: [
      {
        name: 'National Program for AI and Advanced Digital Technologies & Royal Decree 6/2022 PDPL',
        status: 'Enforced Privacy Law + National AI Policy',
        effectiveDate: '2023–2026',
        summary: 'Mandates explicit consent for automated personal profiling alongside public-sector generative AI adoption ethics.'
      }
    ],
    matchPatterns: ['oman', 'muscat', 'omani', 'mtcit']
  },
  {
    slug: 'qa',
    iso: 'QA',
    name: 'Qatar',
    region: 'MENA & Africa',
    capital: 'Doha',
    lat: 25.2854,
    lon: 51.5310,
    posture: 'National AI Guidelines, Cyber Safety & Arabic Sovereign LLMs (Fanar)',
    postureColor: '#38bdf8',
    treatyStatus: 'UNESCO Ethics Alignment & UN Global Digital Compact Partner',
    regulator: 'National Cyber Security Agency (NCSA) & Ministry of Communications and IT (MCIT)',
    flagshipInstruments: [
      {
        name: 'NCSA Artificial Intelligence Guidelines & Personal Data Privacy Protection Law (Law No. 13/2016)',
        status: 'Enforced PDPL + National Agency Guidance',
        effectiveDate: '2024–2026',
        summary: 'Governs Arabic sovereign foundation model Fanar deployment, healthcare/finance AI risk controls, and critical-infrastructure cyber resilience.'
      }
    ],
    matchPatterns: ['qatar', 'doha', 'qatari', 'fanar']
  },
  {
    slug: 'ma',
    iso: 'MA',
    name: 'Morocco',
    region: 'MENA & Africa',
    capital: 'Rabat',
    lat: 34.0209,
    lon: -6.8416,
    posture: 'Regional North African Data Protection & Digital Morocco 2030 Hub',
    postureColor: '#38bdf8',
    treatyStatus: 'UNESCO AI Ethics Lead & AU AI Strategy Member',
    regulator: 'Commission Nationale de Contrôle de la Protection des Données à Caractère Personnel (CNDP)',
    flagshipInstruments: [
      {
        name: 'CNDP Facial Recognition Moratorium & Digital Morocco 2030 Sovereign AI Strategy',
        status: 'Active Data-Protection Enforcement',
        effectiveDate: '2023–2026',
        summary: 'Coordinates Law 09-08 automated-processing controls with continental African AI sovereignty partnerships and Rabat UNESCO regional centers.'
      }
    ],
    matchPatterns: ['morocco', 'rabat', 'casablanca', 'cndp', 'moroccan']
  },
  {
    slug: 'gh',
    iso: 'GH',
    name: 'Ghana',
    region: 'MENA & Africa',
    capital: 'Accra',
    lat: 5.6037,
    lon: -0.1870,
    posture: '10-Year National AI Strategy & West African Ethics Hub',
    postureColor: '#10b981',
    treatyStatus: 'AU Continental AI Strategy Co-Lead',
    regulator: 'Ministry of Communications & Digitalisation + Data Protection Commission (DPC)',
    flagshipInstruments: [
      {
        name: 'Ghana National Artificial Intelligence Strategy (2023–2033) & Data Protection Act 843',
        status: 'Active Strategy + Statutory Data Law',
        effectiveDate: '2023–2033',
        summary: 'Pairs Responsible AI Lab (RAIL) ethical benchmarking with Data Protection Commission controls on public-sector biometrics and automated credit.'
      }
    ],
    matchPatterns: ['ghana', 'accra', 'ghanaian']
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
