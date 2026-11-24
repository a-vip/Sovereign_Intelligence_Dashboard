/**
 * Sovereign Observatory — Curated AI Ethics & Society Geospatial Datasets
 * 1. Environmental Justice: Hyperscale AI Compute Water Stress & Grid Carbon Intensity
 * 2. AI Supply Chain: Critical Minerals Extraction -> EUV Lithography -> Foundry -> Packaging
 * 3. Algorithmic Welfare, Biometric Borders & Surveillance Governance
 * 4. AI Data-Labeling, RLHF & Content-Moderation Global Labor Hubs
 */

export const ENVIRONMENTAL_JUSTICE_NODES = [
  {
    id: 'env-queretaro-mx',
    name: 'Querétaro Cloud & AI Compute Corridor',
    country: 'Mexico',
    lat: 20.5888,
    lon: -100.3899,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 435,
    powerLoadMw: 420,
    severity: 5,
    color: '#ef4444',
    summary: 'Severe groundwater depletion and municipal drought tension around expanding AWS, Microsoft, and Google data-center campuses in central Mexico.',
    source: 'WRI Aqueduct / Data Center Dynamics',
    url: 'https://www.datacenterdynamics.com/'
  },
  {
    id: 'env-johor-my',
    name: 'Johor–Singapore Hyperscale AI Compute Belt',
    country: 'Malaysia',
    lat: 1.4927,
    lon: 103.7414,
    waterStress: 'High (40-80%)',
    carbonIntensity: 560,
    powerLoadMw: 1650,
    severity: 5,
    color: '#ef4444',
    summary: 'Multi-gigawatt ASEAN AI compute buildout triggering municipal denials on water-heavy evaporative cooling clusters amid coal/gas baseload grid emissions.',
    source: 'Malaysia NAIO / Data Center Dynamics',
    url: 'https://www.datacenterdynamics.com/'
  },
  {
    id: 'env-dublin-ie',
    name: 'Greater Dublin Hyperscale Grid Cluster',
    country: 'Ireland',
    lat: 53.3498,
    lon: -6.2603,
    waterStress: 'Low (<10%)',
    carbonIntensity: 295,
    powerLoadMw: 1400,
    severity: 4,
    color: '#f97316',
    summary: 'Data centers consume over 21% of national Irish electricity, prompting EirGrid connection restrictions to protect residential grid stability.',
    source: 'CSO Ireland / EirGrid',
    url: 'https://www.eirgrid.ie/'
  },
  {
    id: 'env-phoenix-us',
    name: 'Phoenix / Mesa Desert AI Mega-Campuses',
    country: 'United States',
    lat: 33.4484,
    lon: -112.0740,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 365,
    powerLoadMw: 1150,
    severity: 5,
    color: '#ef4444',
    summary: 'Arid Colorado River basin mega-campuses balancing semiconductor fab expansion (TSMC Arizona) and hyperscale AI training cooling demand.',
    source: 'WRI Aqueduct / USGS',
    url: 'https://www.wri.org/aqueduct'
  },
  {
    id: 'env-memphis-us',
    name: 'Memphis xAI Colossus Training Cluster',
    country: 'United States',
    lat: 35.1495,
    lon: -90.0490,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 485,
    powerLoadMw: 300,
    severity: 4,
    color: '#f97316',
    summary: 'Rapid 100k+ GPU deployment paired with temporary methane gas turbines raised municipal air-quality & NOₓ environmental-justice complaints in South Memphis.',
    source: 'Southern Environmental Law Center / EPA',
    url: 'https://www.southernenvironment.org/'
  },
  {
    id: 'env-montevideo-uy',
    name: 'Canelones / Montevideo Cloud Water Dispute',
    country: 'Uruguay',
    lat: -34.9011,
    lon: -56.1645,
    waterStress: 'High (Seasonal Drought)',
    carbonIntensity: 68,
    powerLoadMw: 110,
    severity: 3,
    color: '#facc15',
    summary: 'Historic freshwater drought sparked civil-society litigation forcing redesign of potable-water cooling into closed-loop air-cooled compute infrastructure.',
    source: 'ObservaTIC Uruguay / Data Center Dynamics',
    url: 'https://www.datacenterdynamics.com/'
  },
  {
    id: 'env-santiago-cl',
    name: 'Santiago Maipo Basin AI Cooling Zone',
    country: 'Chile',
    lat: -33.4489,
    lon: -70.6693,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 245,
    powerLoadMw: 280,
    severity: 4,
    color: '#f97316',
    summary: 'Chile environmental courts upheld community water-rights review for hyperscale cloud permitting under the multi-year central Chile megadrought.',
    source: 'Chile Environmental Court / Derechos Digitales',
    url: 'https://www.derechosdigitales.org/'
  },
  {
    id: 'env-ashburn-us',
    name: 'Northern Virginia (Ashburn) Data Center Alley',
    country: 'United States',
    lat: 39.0438,
    lon: -77.4874,
    waterStress: 'Medium-High (20-40%)',
    carbonIntensity: 330,
    powerLoadMw: 3800,
    severity: 4,
    color: '#f97316',
    summary: 'World\'s densest compute concentration (>3.8 GW load) driving high-voltage transmission corridor opposition and delayed coal plant retirements.',
    source: 'Dominion Energy / JLARC Virginia',
    url: 'https://jlarc.virginia.gov/'
  },
  {
    id: 'env-mumbai-in',
    name: 'Mumbai–Navi Mumbai Sovereign AI & Cloud Hub',
    country: 'India',
    lat: 19.0760,
    lon: 72.8777,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 690,
    powerLoadMw: 950,
    severity: 5,
    color: '#ef4444',
    summary: 'High-carbon coal-dominant state grid combined with coastal monsoon variability challenges India\'s flagship sovereign AI training expansion.',
    source: 'CEA India / MediaNama',
    url: 'https://www.medianama.com/'
  },
  {
    id: 'env-lulea-se',
    name: 'Luleå / Northern Sweden Hydro AI Corridor',
    country: 'Sweden',
    lat: 65.5848,
    lon: 22.1567,
    waterStress: 'Low (<10%)',
    carbonIntensity: 18,
    powerLoadMw: 450,
    severity: 2,
    color: '#10b981',
    summary: 'Sub-arctic free-air cooling and near-zero-carbon hydroelectricity benchmark low-impact frontier compute siting.',
    source: 'RISE Research Institutes of Sweden',
    url: 'https://www.ri.se/'
  },
  {
    id: 'env-keflavik-is',
    name: 'Reykjavik–Keflavik Geothermal Compute Zone',
    country: 'Iceland',
    lat: 64.0000,
    lon: -22.5500,
    waterStress: 'Low (<10%)',
    carbonIntensity: 12,
    powerLoadMw: 220,
    severity: 2,
    color: '#10b981',
    summary: '100% geothermal and hydro renewable baseload hosting low-emission AI training workloads.',
    source: 'Orkustofnun Iceland',
    url: 'https://nea.is/'
  },
  {
    id: 'env-abudhabi-ae',
    name: 'Abu Dhabi / Khalifa AI Supercomputing Hub',
    country: 'UAE',
    lat: 24.4539,
    lon: 54.3773,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 410,
    powerLoadMw: 1000,
    severity: 4,
    color: '#f97316',
    summary: 'Reliance on seawater desalination and nuclear/solar pairing for multi-gigawatt Gulf sovereign AI clusters under extreme ambient desert heat.',
    source: 'UAE MOEI / Epoch AI',
    url: 'https://epoch.ai/'
  },
  {
    id: 'env-tokyo-jp',
    name: 'Tokyo–Inzai Hyperscale AI Corridor',
    country: 'Japan',
    lat: 35.8330,
    lon: 140.1450,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 465,
    powerLoadMw: 880,
    severity: 3,
    color: '#facc15',
    summary: 'LNG-heavy post-Fukushima grid prompts Japan\'s Watt-Bit Coordination Committee to incentivize Hokkaido green compute migration.',
    source: 'METI Japan',
    url: 'https://www.meti.go.jp/'
  },
  {
    id: 'env-saopaulo-br',
    name: 'São Paulo–Campinas Hydro Compute Cluster',
    country: 'Brazil',
    lat: -22.9099,
    lon: -47.0626,
    waterStress: 'Medium-High (20-40%)',
    carbonIntensity: 92,
    powerLoadMw: 640,
    severity: 2,
    color: '#10b981',
    summary: 'Hydro/wind-majority Brazilian grid offers low training emissions per FLOP while competing with agricultural water reserves in São Paulo interior.',
    source: 'EPE Brazil',
    url: 'https://www.epe.gov.br/'
  }
];

export const SUPPLY_CHAIN_NODES = [
  // Extractive Critical Minerals
  { id: 'sc-drc-kolwezi', name: 'Kolwezi Cobalt & Copper Belt', stage: 'extraction', mineral: 'Cobalt (~70% global supply)', country: 'DR Congo', lat: -10.7148, lon: 25.4667, color: '#ef4444', summary: 'Critical cobalt for server UPS batteries, heat-resistant turbine alloys & chip interconnects; documented artisanal-mining child labor & water pollution risks.', source: 'USGS / Amnesty International', url: 'https://www.amnesty.org/' },
  { id: 'sc-cl-atacama', name: 'Salar de Atacama Lithium Brine', stage: 'extraction', mineral: 'Lithium', country: 'Chile', lat: -23.5000, lon: -68.3333, color: '#f97316', summary: 'Hyper-arid lithium extraction supplying grid-scale backup batteries amid Indigenous Atacameño freshwater rights disputes.', source: 'COCHILCO Chile', url: 'https://www.cochilco.cl/' },
  { id: 'sc-id-morowali', name: 'Morowali Nickel & Smelting Hub', stage: 'extraction', mineral: 'Class-1 Nickel', country: 'Indonesia', lat: -2.8167, lon: 122.1500, color: '#f97316', summary: 'Captive coal-powered nickel refining central to data-center backup storage supply chains and deforestation concerns.', source: 'Climate Rights International', url: 'https://cri.org/' },
  { id: 'sc-cn-yunnan-gallium', name: 'Southwest China Gallium & Germanium', stage: 'extraction', mineral: 'Gallium / Germanium (>80%)', country: 'China', lat: 25.0406, lon: 102.7123, color: '#ef4444', summary: 'Primary source of gallium & germanium subject to Beijing export licensing affecting GaN RF chips and fiber optics.', source: 'CSIS / USGS', url: 'https://www.csis.org/' },
  { id: 'sc-cn-baotou-re', name: 'Baotou Rare Earth Refining Complex', stage: 'refining', mineral: 'Neodymium / Dysprosium', country: 'China', lat: 40.6574, lon: 109.8404, color: '#f97316', summary: 'World\'s largest rare-earth separation cluster used in high-efficiency server cooling fans, lithography actuators, and precision optics.', source: 'IEA Critical Minerals', url: 'https://www.iea.org/' },
  { id: 'sc-au-greenbushes', name: 'Greenbushes Spodumene Lithium', stage: 'extraction', mineral: 'Hard-Rock Lithium', country: 'Australia', lat: -33.8500, lon: 116.0500, color: '#facc15', summary: 'Leading OECD-allied hard-rock lithium reserve feeding Asia-Pacific battery & backup power refining.', source: 'Geoscience Australia', url: 'https://www.ga.gov.au/' },
  // Lithography & Equipment Chokepoints
  { id: 'sc-nl-veldhoven-asml', name: 'ASML EUV Lithography HQ (Veldhoven)', stage: 'lithography', mineral: 'Extreme UV Scanners (100% Monopoly)', country: 'Netherlands', lat: 51.4196, lon: 5.4126, color: '#38bdf8', summary: 'Sole global manufacturer of Extreme Ultraviolet (EUV & High-NA EUV) photolithography systems enabling sub-5nm AI GPUs.', source: 'ASML / Dutch Export Licensing', url: 'https://www.asml.com/' },
  { id: 'sc-de-oberkochen-zeiss', name: 'ZEISS SMT EUV Precision Mirrors', stage: 'lithography', mineral: 'EUV Bragg Optics', country: 'Germany', lat: 48.7847, lon: 10.0989, color: '#38bdf8', summary: 'Produces the world\'s flattest multi-layer reflective mirrors essential to every ASML EUV chipmaking machine.', source: 'ZEISS SMT', url: 'https://www.zeiss.com/' },
  { id: 'sc-jp-kumamoto-tel', name: 'Tokyo Electron & Photoresist Supply', stage: 'lithography', mineral: 'EUV Coaters / Developers (90%+)', country: 'Japan', lat: 35.6762, lon: 139.6503, color: '#38bdf8', summary: 'Japanese semiconductor equipment and ultra-pure EUV photoresist chemicals essential for leading-edge AI logic.', source: 'METI Japan / CSET', url: 'https://cset.georgetown.edu/' },
  // Leading-Edge Foundries & HBM Memory
  { id: 'sc-tw-hsinchu-tsmc', name: 'TSMC Fab 12 / 20 & CoWoS Packaging', stage: 'foundry', mineral: 'Leading-Edge AI Logic (<3nm)', country: 'Taiwan', lat: 24.7736, lon: 121.0108, color: '#a855f7', summary: 'Manufactures >90% of global frontier AI accelerators (NVIDIA H100/B200, AMD, Google TPU, Apple Silicon).', source: 'TSMC / Georgetown CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-kr-pyeongtaek-hbm', name: 'SK Hynix & Samsung HBM3e Memory Cluster', stage: 'foundry', mineral: 'High-Bandwidth Memory (HBM)', country: 'South Korea', lat: 37.0189, lon: 127.0642, color: '#a855f7', summary: 'Produces over 85% of global High-Bandwidth Memory stacked alongside every frontier AI training GPU.', source: 'TrendForce / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-us-phoenix-fab21', name: 'TSMC Arizona Fab 21 & Intel Ocotillo', stage: 'foundry', mineral: '4nm / 18A Sovereign Logic', country: 'United States', lat: 33.7136, lon: -112.1445, color: '#a855f7', summary: 'CHIPS Act onshore leading-edge foundry expansion aimed at reducing single-strait fabrication dependency.', source: 'US CHIPS Program Office', url: 'https://www.chips.gov/' },
  { id: 'sc-cn-shanghai-smic', name: 'SMIC Shanghai Advanced Logic Complex', stage: 'foundry', mineral: '7nm DUV Multi-Patterning', country: 'China', lat: 31.2131, lon: 121.6223, color: '#a855f7', summary: 'Focus of indigenous DUV multi-patterning chip fabrication efforts for domestic Ascend-class AI accelerators under export controls.', source: 'DigiChina / BIS', url: 'https://digichina.stanford.edu/' },
  // Assembly, Testing & Packaging (ATP)
  { id: 'sc-my-penang-atp', name: 'Penang Semiconductor Packaging Hub', stage: 'packaging', mineral: 'OSAT / Advanced Packaging', country: 'Malaysia', lat: 5.2974, lon: 100.2782, color: '#10b981', summary: 'Accounts for ~13% of global backend chip assembly, testing, and AI accelerator substrate packaging.', source: 'MIDA Malaysia', url: 'https://www.mida.gov.my/' },
  { id: 'sc-vn-bacninh-atp', name: 'Northern Vietnam Electronics & IC Packaging', stage: 'packaging', mineral: 'IC Assembly & Test', country: 'Vietnam', lat: 21.1861, lon: 106.0763, color: '#10b981', summary: 'Rapidly scaling ASEAN assembly/packaging node integrating US/Korean chipmakers into diversified Friendshoring routes.', source: 'Vietnam MPI', url: 'https://www.chinhphu.vn/' }
];

export const SUPPLY_CHAIN_ARCS = [
  { name: 'Cobalt Corridor: Kolwezi (DRC) → East Asia Battery & Chip Refining', from: [-10.7148, 25.4667], to: [31.2131, 121.6223], color: '#ef4444' },
  { name: 'Lithium Corridor: Atacama (Chile) → South Korea HBM & Power Electronics', from: [-23.5000, -68.3333], to: [37.0189, 127.0642], color: '#f97316' },
  { name: 'EUV Optics → Scanners: ZEISS Germany → ASML Veldhoven', from: [48.7847, 10.0989], to: [51.4196, 5.4126], color: '#38bdf8' },
  { name: 'EUV Scanners: ASML Netherlands → TSMC Hsinchu Foundry', from: [51.4196, 5.4126], to: [24.7736, 121.0108], color: '#38bdf8' },
  { name: 'EUV Scanners: ASML Netherlands → Pyeongtaek HBM & Logic', from: [51.4196, 5.4126], to: [37.0189, 127.0642], color: '#38bdf8' },
  { name: 'EUV Scanners: ASML Netherlands → Arizona Onshore Fab', from: [51.4196, 5.4126], to: [33.7136, -112.1445], color: '#38bdf8' },
  { name: 'Photoresists & Coaters: Tokyo → Hsinchu CoWoS Line', from: [35.6762, 139.6503], to: [24.7736, 121.0108], color: '#38bdf8' },
  { name: 'HBM3e Memory Integration: Pyeongtaek → Hsinchu CoWoS', from: [37.0189, 127.0642], to: [24.7736, 121.0108], color: '#a855f7' },
  { name: 'Rare Earths Supply: Baotou → East Asia Actuators & Optics', from: [40.6574, 109.8404], to: [35.6762, 139.6503], color: '#f97316' },
  { name: 'Backend OSAT Packaging: Hsinchu → Penang Packaging Hub', from: [24.7736, 121.0108], to: [5.2974, 100.2782], color: '#10b981' },
  { name: 'ASEAN Packaging & Server Integration: Penang → Northern Vietnam', from: [5.2974, 100.2782], to: [21.1861, 106.0763], color: '#10b981' }
];

export const BIOMETRIC_WELFARE_NODES = [
  {
    id: 'bio-eu-art5',
    name: 'EU AI Act Art. 5 Biometric & Emotion Bans',
    country: 'European Union',
    lat: 50.8503,
    lon: 4.3517,
    status: 'Banned / Prohibited',
    domain: 'Biometric Categorization & Real-Time FRT',
    color: '#10b981',
    severity: 3,
    summary: 'Prohibits untargeted facial scraping, workplace/school emotion inference, biometric sensitive-trait categorization, and predictive policing based solely on profiling.',
    source: 'Official Journal of the EU',
    url: 'https://eur-lex.europa.eu/'
  },
  {
    id: 'bio-nl-syri',
    name: 'Hague District Court SyRI Welfare Ruling',
    country: 'Netherlands',
    lat: 52.0705,
    lon: 4.3007,
    status: 'Struck Down (ECHR Art. 8)',
    domain: 'Algorithmic Welfare Fraud Detection',
    color: '#10b981',
    severity: 3,
    summary: 'Landmark ruling invalidated the opaque SyRI public-benefits risk model for discriminating against low-income neighborhoods.',
    source: 'AlgorithmWatch / Rechtspraak NL',
    url: 'https://algorithmwatch.org/en/'
  },
  {
    id: 'bio-ar-buenosaires',
    name: 'Buenos Aires CABA Metro FRT Suspension',
    country: 'Argentina',
    lat: -34.6037,
    lon: -58.3816,
    status: 'Judicially Suspended',
    domain: 'Live Public Facial Recognition',
    color: '#10b981',
    severity: 3,
    summary: 'Judicial injunction halted live biometric commuter surveillance after audit revealed warrantless searches against journalists and activists.',
    source: 'Access Now / CELS',
    url: 'https://www.accessnow.org/'
  },
  {
    id: 'bio-in-aadhaar',
    name: 'India Aadhaar Biometric Welfare & AI Rails',
    country: 'India',
    lat: 28.6139,
    lon: 77.2090,
    status: 'Active / Contested',
    domain: 'National Biometric Welfare Authentication',
    color: '#f97316',
    severity: 4,
    summary: 'World\'s largest biometric ID infrastructure (>1.3B residents) underpinning welfare rations and digital payments, debated over fingerprint exclusion errors.',
    source: 'Internet Freedom Foundation / Supreme Court',
    url: 'https://internetfreedom.in/'
  },
  {
    id: 'bio-jo-iris',
    name: 'UNHCR / WFP Refugee Iris-Biometric Aid',
    country: 'Jordan',
    lat: 31.9454,
    lon: 35.9284,
    status: 'Active / Humanitarian Review',
    domain: 'Humanitarian Biometric Cash Disbursement',
    color: '#facc15',
    severity: 3,
    summary: 'Mandatory iris-scanning at refugee camps raises ethics debates on meaningful consent when survival food/cash aid depends on biometric enrollment.',
    source: 'ICRC / Privacy International',
    url: 'https://privacyinternational.org/'
  },
  {
    id: 'bio-il-redwolf',
    name: 'Occupied West Bank Automated Biometrics',
    country: 'Palestine / Israel',
    lat: 31.5326,
    lon: 35.0998,
    status: 'Active Deployment',
    domain: 'Checkpoints Facial Recognition (Red Wolf)',
    color: '#ef4444',
    severity: 5,
    summary: 'Automated checkpoint facial recognition enrolling Palestinians into color-coded movement restriction matrices without consent or judicial oversight.',
    source: 'Amnesty International',
    url: 'https://www.amnesty.org/en/latest/news/2023/05/israel-opt-israeli-authorities-are-using-facial-recognition-technology-to-entrench-apartheid/'
  },
  {
    id: 'bio-us-border',
    name: 'US-Mexico Border AI Towers & CBP One',
    country: 'United States / Mexico',
    lat: 31.7619,
    lon: -106.4850,
    status: 'Active Deployment',
    domain: 'Autonomous Border Surveillance & Asylum FRT',
    color: '#f97316',
    severity: 4,
    summary: 'Sensor-fusion autonomous surveillance towers and mandatory asylum-seeker mobile facial-recognition liveness checks along the southern border.',
    source: 'EFF / Mijente',
    url: 'https://www.eff.org/'
  },
  {
    id: 'bio-eu-frontex',
    name: 'Aegean Sea Automated Border Drones & Eurodac',
    country: 'Greece / EU',
    lat: 37.9838,
    lon: 23.7275,
    status: 'Active / Litigated',
    domain: 'Maritime AI Borders & Biometric Screening',
    color: '#f97316',
    severity: 4,
    summary: 'Drone surveillance, acoustic/thermal border towers, and expanded biometric asylum screening regulated under the EU Migration Pact.',
    source: 'Statewatch / EDRi',
    url: 'https://edri.org/'
  },
  {
    id: 'bio-au-robodebt',
    name: 'Australia Robodebt Algorithmic Redress Benchmark',
    country: 'Australia',
    lat: -35.2809,
    lon: 149.1300,
    status: 'Abolished / Royal Commission',
    domain: 'Automated Income-Averaging Welfare Recovery',
    color: '#10b981',
    severity: 3,
    summary: 'Royal Commission documented severe unlawful human harm from automated welfare debt-recovery algorithms, becoming the global public-sector AI warning case.',
    source: 'Australian Royal Commission',
    url: 'https://robodebt.royalcommission.gov.au/'
  },
  {
    id: 'bio-cn-xinjiang',
    name: 'Xinjiang Predictive Policing & Voiceprint Grid',
    country: 'China',
    lat: 43.8256,
    lon: 87.6168,
    status: 'Active Deployment',
    domain: 'Multi-Modal Minority Biometric Surveillance',
    color: '#ef4444',
    severity: 5,
    summary: 'UN OHCHR & HRW documented integrated algorithmic policing (IJOP) combining gait, iris, DNA, and mobile metadata across Turkic populations.',
    source: 'UN OHCHR / HRW',
    url: 'https://www.ohchr.org/'
  },
  {
    id: 'bio-br-bahia',
    name: 'Salvador / Bahia Public Security Facial Rec',
    country: 'Brazil',
    lat: -12.9714,
    lon: -38.5014,
    status: 'Active / Rights Contested',
    domain: 'Police Real-Time Facial Recognition',
    color: '#f97316',
    severity: 4,
    summary: 'Federal court challenges highlight disproportionate false-match arrests of Black Brazilians under state public-security FRT cameras.',
    source: 'InternetLab / Rede de Observatórios',
    url: 'https://internetlab.org.br/'
  },
  {
    id: 'bio-ke-maisha',
    name: 'Kenya Maisha Namba Digital Biometric ID',
    country: 'Kenya',
    lat: -1.2921,
    lon: 36.8219,
    status: 'Court Monitored / Active',
    domain: 'Universal Digital Biometric ID',
    color: '#facc15',
    severity: 3,
    summary: 'High Court data-protection impact assessment mandates shaped Kenya\'s third-generation digital ID rollout after Huduma Namba challenges.',
    source: 'CIPESA / KICTANet',
    url: 'https://cipesa.org/'
  }
];

export const AI_LABOR_NODES = [
  {
    id: 'lab-ke-nairobi',
    name: 'Nairobi RLHF & Content Moderation Hub',
    country: 'Kenya',
    lat: -1.2921,
    lon: 36.8219,
    typicalHourlyUsd: '$1.50 – $2.50/hr',
    laborFocus: 'Safety Labeling, Toxic Content Filtering, RLHF',
    rightsStatus: 'Active Unionization & Landmark High Court Suits',
    color: '#ec4899',
    severity: 4,
    summary: 'Over 150 Nairobi workers sued major outsourcing contractors (Sama/Majorel) over undisclosed psychological trauma while filtering CSAM, suicide, and hate speech for frontier LLMs.',
    source: 'CIPESA / Kenya High Court / TIME',
    url: 'https://cipesa.org/'
  },
  {
    id: 'lab-ph-manila',
    name: 'Manila / Metro Cebu Trust & Safety BPO Belt',
    country: 'Philippines',
    lat: 14.5995,
    lon: 120.9842,
    typicalHourlyUsd: '$2.00 – $3.80/hr',
    laborFocus: 'AI Training Annotation & Social Platform Moderation',
    rightsStatus: 'Quota Pressure & Burnout Policy Scrutiny',
    color: '#ec4899',
    severity: 3,
    summary: 'Major global hub for English & multilingual generative-AI preference ranking and real-time moderation facing legislative calls for mental-health safeguards.',
    source: 'Rest of World / UNI Global Union',
    url: 'https://restofworld.org/'
  },
  {
    id: 'lab-in-bengaluru',
    name: 'Bengaluru–Tier 2 India Annotation Corridor',
    country: 'India',
    lat: 12.9716,
    lon: 77.5946,
    typicalHourlyUsd: '$1.80 – $4.20/hr',
    laborFocus: 'Autonomous Vehicle LiDAR Bounding & LLM Eval',
    rightsStatus: 'Platform Piece-Rate & Gig Law Debates',
    color: '#a855f7',
    severity: 3,
    summary: 'Large BPO & gig-worker networks label autonomous-driving computer vision frames and multilingual Indic RLHF datasets with minimal algorithmic wage transparency.',
    source: 'Fairwork India / MediaNama',
    url: 'https://www.medianama.com/'
  },
  {
    id: 'lab-ve-caracas',
    name: 'Venezuela Distributed Crowd-Work Annotation',
    country: 'Venezuela',
    lat: 10.4806,
    lon: -66.9036,
    typicalHourlyUsd: '$0.80 – $1.90/hr',
    laborFocus: '2D/3D Vision Labeling & Prompt Evaluation',
    rightsStatus: 'Unprotected Microtask Piece-Work',
    color: '#ef4444',
    severity: 4,
    summary: 'Economic crisis channeled hundreds of thousands of Venezuelan crowd workers into Remotasks/Toloka piecework with sudden de-platforming & withheld micro-payouts.',
    source: 'MIT Technology Review / Derechos Digitales',
    url: 'https://www.derechosdigitales.org/'
  },
  {
    id: 'lab-co-bogota',
    name: 'Bogotá Content Moderation & BPO Corridor',
    country: 'Colombia',
    lat: 4.7110,
    lon: -74.0721,
    typicalHourlyUsd: '$2.20 – $3.50/hr',
    laborFocus: 'Spanish/English Trust & Safety + AI Moderation',
    rightsStatus: 'Collective Bargaining & Psychosocial Audits',
    color: '#ec4899',
    severity: 3,
    summary: 'Colombian labor inspectors and worker collectives organized against rigid biometric keystroke surveillance and traumatic moderation quotas.',
    source: 'Rest of World / MinTrabajo Colombia',
    url: 'https://restofworld.org/'
  },
  {
    id: 'lab-gh-accra',
    name: 'Accra West African Data Annotation Centers',
    country: 'Ghana',
    lat: 5.6037,
    lon: -0.1870,
    typicalHourlyUsd: '$1.40 – $2.40/hr',
    laborFocus: 'NLP Localization & Vision Dataset Tagging',
    rightsStatus: 'Emerging Decent-Work Guidelines',
    color: '#a855f7',
    severity: 2,
    summary: 'Expanding West African outsourcing hubs highlight tension between youth digital employment opportunities and fair global value-chain compensation.',
    source: 'Fairwork / Oxford Internet Institute',
    url: 'https://www.oii.ox.ac.uk/'
  },
  {
    id: 'lab-ma-casablanca',
    name: 'Casablanca–Tunis Francophone RLHF Centers',
    country: 'Morocco',
    lat: 33.5731,
    lon: -7.5898,
    typicalHourlyUsd: '$2.50 – $4.00/hr',
    laborFocus: 'Arabic & French AI Alignment / Moderation',
    rightsStatus: 'Under-documented Contractor Supply Chain',
    color: '#a855f7',
    severity: 2,
    summary: 'North African BPO centers power French and Arabic safety red-teaming and automated moderation pipelines for European AI deployments.',
    source: 'Fairwork / SMEX',
    url: 'https://smex.org/'
  },
  {
    id: 'lab-bg-sofia',
    name: 'Sofia–Skopje Eastern European Moderation Hubs',
    country: 'Bulgaria',
    lat: 42.6977,
    lon: 23.3219,
    typicalHourlyUsd: '$5.50 – $8.50/hr',
    laborFocus: 'EU DSA Trust & Safety + Slavic/EU Compliance',
    rightsStatus: 'EU Platform Work Directive Transition',
    color: '#38bdf8',
    severity: 2,
    summary: 'Multi-lingual European moderation centers scaling under EU Digital Services Act transparency reporting and Platform Work Directive protections.',
    source: 'European Parliament / AlgorithmWatch',
    url: 'https://algorithmwatch.org/en/'
  }
];

export function getEthicsLayerPayload(layer) {
  switch (layer) {
    case 'environmental':
      return {
        layer,
        title: 'Environmental Justice: Compute Water Stress & Grid Carbon',
        items: ENVIRONMENTAL_JUSTICE_NODES,
        arcs: []
      };
    case 'supply_chain':
      return {
        layer,
        title: 'AI Supply Chain: Minerals, EUV Lithography & Foundries',
        items: SUPPLY_CHAIN_NODES,
        arcs: SUPPLY_CHAIN_ARCS
      };
    case 'biometric_welfare':
      return {
        layer,
        title: 'Biometric Borders, Surveillance & Algorithmic Welfare',
        items: BIOMETRIC_WELFARE_NODES,
        arcs: []
      };
    case 'ai_labor':
      return {
        layer,
        title: 'AI Data-Labeling, RLHF & Content-Moderation Labor Hubs',
        items: AI_LABOR_NODES,
        arcs: []
      };
    default:
      return null;
  }
}
