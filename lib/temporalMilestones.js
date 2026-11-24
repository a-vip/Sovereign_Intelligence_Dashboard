/**
 * Sovereign Observatory — Longitudinal Temporal Replay & Compute–Regulation Milestones (2020–2026+)
 * Tracks statutory enactments ('law'), AI safety institutes ('institute'), and frontier compute clusters ('compute').
 */

export const MONTHS_2020_2026 = (() => {
  const out = [];
  for (let y = 2020; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthLabel(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '';
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[Number(m) - 1] || m} ${y}`;
}

export const TEMPORAL_MILESTONES = [
  // ── 2020 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-comp-azure-2020',
    date: '2020-05',
    track: 'compute',
    title: 'Microsoft–OpenAI 285k-Core AI Supercomputer (Iowa)',
    location: 'Des Moines, USA',
    lat: 41.5868,
    lon: -93.6250,
    country: 'United States',
    powerMw: 15,
    coveredByBindingLaw: false,
    severity: 2,
    source: 'Microsoft Build / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Early mega-scale transformer training cluster (10,000 V100 GPUs) pre-dating any statutory frontier AI safety law.'
  },
  // ── 2021 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-comp-tpuv4-2021',
    date: '2021-06',
    track: 'compute',
    title: 'Google Cloud TPU v4 Supercomputer Pod Cluster (Oklahoma)',
    location: 'Pryor, Oklahoma, USA',
    lat: 36.3084,
    lon: -95.3169,
    country: 'United States',
    powerMw: 40,
    coveredByBindingLaw: false,
    severity: 2,
    source: 'Google / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Optical-circuit-switched TPU v4 pod infrastructure accelerating foundation-model scaling.'
  },
  {
    id: 'tm-inst-unesco-2021',
    date: '2021-11',
    track: 'institute',
    title: 'UNESCO Recommendation on the Ethics of AI (193 States)',
    location: 'Paris, France',
    lat: 48.8566,
    lon: 2.3522,
    country: 'Multilateral (UNESCO)',
    severity: 3,
    source: 'UNESCO',
    url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics',
    summary: 'First global normative instrument setting human-rights, environmental, and non-discrimination guardrails across 193 member states.'
  },
  // ── 2022 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-comp-meta-rsc-2022',
    date: '2022-01',
    track: 'compute',
    title: 'Meta AI Research SuperCluster (RSC) Online',
    location: 'Fort Worth / US Cluster',
    lat: 32.7555,
    lon: -97.3308,
    country: 'United States',
    powerMw: 25,
    coveredByBindingLaw: false,
    severity: 2,
    source: 'Meta AI / Epoch AI',
    url: 'https://epoch.ai/',
    summary: '6,080–16,000 A100 GPU research cluster deployed ahead of national AI safety evaluation institutes.'
  },
  {
    id: 'tm-law-cn-algo-2022',
    date: '2022-03',
    track: 'law',
    title: 'China CAC Algorithmic Recommendation Regulations Enforced',
    location: 'Beijing, China',
    lat: 39.9042,
    lon: 116.4074,
    country: 'China',
    severity: 4,
    source: 'Cyberspace Administration of China / DigiChina',
    url: 'https://digichina.stanford.edu/',
    summary: 'First major national binding statute requiring algorithmic filing registries, opt-out rights, and anti-price-discrimination rules.'
  },
  {
    id: 'tm-law-us-eo-pre-2022',
    date: '2022-10',
    track: 'law',
    title: 'White House Blueprint for an AI Bill of Rights',
    location: 'Washington D.C., USA',
    lat: 38.9072,
    lon: -77.0369,
    country: 'United States',
    severity: 2,
    source: 'White House OSTP',
    url: 'https://www.whitehouse.gov/',
    summary: 'Non-binding US federal principles outlining algorithmic fairness, notice, privacy, and human fallback rights.'
  },
  // ── 2023 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-law-cn-deep-2023',
    date: '2023-01',
    track: 'law',
    title: 'China Deep Synthesis (Synthetic Media) Regulations Live',
    location: 'Beijing, China',
    lat: 39.9042,
    lon: 116.4074,
    country: 'China',
    severity: 4,
    source: 'CAC / Stanford DigiChina',
    url: 'https://digichina.stanford.edu/',
    summary: 'Mandatory cryptographic watermarking and consent rules targeting deepfakes and generative synthesis.'
  },
  {
    id: 'tm-comp-msft-gpt4-2023',
    date: '2023-03',
    track: 'compute',
    title: 'GPT-4 Class Frontier Training Infrastructure Scaled',
    location: 'Cheyenne / West Des Moines, USA',
    lat: 41.1400,
    lon: -104.8202,
    country: 'United States',
    powerMw: 55,
    coveredByBindingLaw: false,
    severity: 3,
    source: 'Epoch AI / Microsoft',
    url: 'https://epoch.ai/',
    summary: 'Multi-dozen-MW A100 supercomputing era ushering in >10²⁵ FLOP frontier models without mandatory pre-deployment safety testing.'
  },
  {
    id: 'tm-law-pe-31814-2023',
    date: '2023-07',
    track: 'law',
    title: 'Peru Enacts National AI Law No. 31814',
    location: 'Lima, Peru',
    lat: -12.0464,
    lon: -77.0428,
    country: 'Peru',
    severity: 3,
    source: 'Congreso del Perú / Hiperderecho',
    url: 'https://hiperderecho.org/',
    summary: 'Latin America\'s earliest standalone statutory AI governance legislation.'
  },
  {
    id: 'tm-comp-uae-condor-2023',
    date: '2023-07',
    track: 'compute',
    title: 'UAE G42 Condor Galaxy AI Supercomputer Online',
    location: 'Abu Dhabi, UAE',
    lat: 24.4539,
    lon: 54.3773,
    country: 'UAE',
    powerMw: 48,
    coveredByBindingLaw: false,
    severity: 3,
    source: 'G42 / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Gulf sovereign AI training buildout spotlighting US-UAE semiconductor export governance.'
  },
  {
    id: 'tm-law-cn-genai-2023',
    date: '2023-08',
    track: 'law',
    title: 'China Interim Generative AI Measures Take Effect',
    location: 'Hangzhou, China',
    lat: 30.2741,
    lon: 120.1551,
    country: 'China',
    severity: 4,
    source: 'CAC / Zhejiang Regulatory Filing',
    url: 'https://digichina.stanford.edu/',
    summary: 'Establishes pre-release safety evaluations and training-data accountability across commercial Chinese LLMs.'
  },
  {
    id: 'tm-law-us-eo14110-2023',
    date: '2023-10',
    track: 'law',
    title: 'US Executive Order 14110 (10²⁶ FLOP Compute Reporting)',
    location: 'Washington D.C., USA',
    lat: 38.9072,
    lon: -77.0369,
    country: 'United States',
    severity: 4,
    source: 'White House',
    url: 'https://www.nist.gov/aisi',
    summary: 'Invoked Defense Production Act reporting for frontier training runs exceeding 10²⁶ FLOP and dual-use CBRN/cyber red-teaming.'
  },
  {
    id: 'tm-inst-bletchley-2023',
    date: '2023-11',
    track: 'institute',
    title: 'Bletchley Declaration & UK AI Safety Institute Launch',
    location: 'Bletchley Park / Cambridge, UK',
    lat: 51.9977,
    lon: -0.7407,
    country: 'United Kingdom',
    severity: 5,
    source: 'UK DSIT / AI Safety Institute',
    url: 'https://www.aisi.gov.uk/',
    summary: 'First international Frontier AI Safety Summit (28 states + EU) launching the world\'s first state-backed technical safety evaluation institute.'
  },
  // ── 2024 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-inst-us-caisi-2024',
    date: '2024-02',
    track: 'institute',
    title: 'US AI Safety Institute (NIST) & AISIC Consortium Launch',
    location: 'Washington D.C., USA',
    lat: 39.1400,
    lon: -77.2200,
    country: 'United States',
    severity: 4,
    source: 'NIST US AISI',
    url: 'https://www.nist.gov/aisi',
    summary: 'Over 200 member labs and evaluators align on federal frontier safety benchmarking and pre-release voluntary evaluations.'
  },
  {
    id: 'tm-inst-jp-aisi-2024',
    date: '2024-02',
    track: 'institute',
    title: 'Japan AI Safety Institute (J-AISI) Established',
    location: 'Tokyo, Japan',
    lat: 35.6895,
    lon: 139.6917,
    country: 'Japan',
    severity: 3,
    source: 'IPA Japan / METI',
    url: 'https://aisi.go.jp/',
    summary: 'Leads G7 Hiroshima AI Process international evaluation benchmarks under IPA Japan.'
  },
  {
    id: 'tm-inst-eu-office-2024',
    date: '2024-05',
    track: 'institute',
    title: 'European AI Office & Seoul International Network of AISIs',
    location: 'Brussels / Seoul',
    lat: 50.8503,
    lon: 4.3517,
    country: 'European Union',
    severity: 4,
    source: 'European Commission / MSIT Korea',
    url: 'https://digital-strategy.ec.europa.eu/',
    summary: 'EU AI Office formalizes GPAI systemic-risk enforcement alongside 10-nation Seoul AI Summit safety network.'
  },
  {
    id: 'tm-law-usco-2024',
    date: '2024-05',
    track: 'law',
    title: 'Colorado AI Act (SB 24-205) High-Risk Discrimination Statute',
    location: 'Denver, Colorado, USA',
    lat: 39.7392,
    lon: -104.9903,
    country: 'United States',
    severity: 3,
    source: 'Colorado General Assembly',
    url: 'https://leg.colorado.gov/',
    summary: 'First US state comprehensive statute regulating high-risk algorithmic consequential decisions.'
  },
  {
    id: 'tm-inst-sg-aisi-2024',
    date: '2024-06',
    track: 'institute',
    title: 'Singapore AI Safety Red-Teaming & Digital Trust Centre',
    location: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    country: 'Singapore',
    severity: 3,
    source: 'IMDA Singapore',
    url: 'https://www.imda.gov.sg/',
    summary: 'Hosts Global South & multilingual ASEAN frontier safety evaluations (Moonshot / AI Verify).'
  },
  {
    id: 'tm-comp-cn-guizhou-2024',
    date: '2024-06',
    track: 'compute',
    title: 'China East-Data-West-Compute National Cluster Expansion',
    location: 'Guiyang, Guizhou, China',
    lat: 26.6470,
    lon: 106.6302,
    country: 'China',
    powerMw: 260,
    coveredByBindingLaw: true,
    severity: 3,
    source: 'NDRC China / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Hydro-powered western sovereign compute corridor bound by CAC generative AI & algorithm registry rules.'
  },
  {
    id: 'tm-law-euaiact-2024',
    date: '2024-08',
    track: 'law',
    title: 'EU AI Act (Regulation (EU) 2024/1689) Enters Into Force',
    location: 'Brussels, Belgium',
    lat: 50.8503,
    lon: 4.3517,
    country: 'European Union',
    severity: 5,
    source: 'EUR-Lex',
    url: 'https://eur-lex.europa.eu/',
    summary: 'World\'s first binding horizontal AI statute across 27 EU member states, introducing >10²⁵ FLOP GPAI systemic risk tiers.'
  },
  {
    id: 'tm-inst-au-addis-2024',
    date: '2024-08',
    track: 'institute',
    title: 'African Union Continental AI Strategy Adopted (55 Member States)',
    location: 'Addis Ababa, Ethiopia',
    lat: 9.0054,
    lon: 38.7636,
    country: 'African Union',
    severity: 4,
    source: 'African Union Commission',
    url: 'https://au.int/',
    summary: 'AU Executive Council ratifies continent-wide roadmap for sovereign African compute, data governance, and ethical AI protection.'
  },
  {
    id: 'tm-law-coe-sign-2024',
    date: '2024-09',
    track: 'law',
    title: 'Council of Europe Framework Convention on AI (CETS 225) Opened',
    location: 'Strasbourg, France',
    lat: 48.5734,
    lon: 7.7521,
    country: 'Multilateral (CoE)',
    severity: 4,
    source: 'Council of Europe',
    url: 'https://www.coe.int/en/web/artificial-intelligence',
    summary: 'First legally binding international treaty on AI, human rights, democracy, and rule of law signed by EU, US, UK, Japan, Israel & LATAM observers.'
  },
  {
    id: 'tm-comp-colossus1-2024',
    date: '2024-09',
    track: 'compute',
    title: 'xAI Colossus Memphis 100k-GPU Cluster Online (150 MW)',
    location: 'Memphis, Tennessee, USA',
    lat: 35.1495,
    lon: -90.0490,
    country: 'United States',
    powerMw: 150,
    coveredByBindingLaw: false,
    severity: 4,
    source: 'Epoch AI / Memphis Light',
    url: 'https://epoch.ai/',
    summary: 'Record-speed 122-day 100k H100 buildout marking the transition past 100 MW single-site training clusters.'
  },
  {
    id: 'tm-comp-meta-ohio-2024',
    date: '2024-10',
    track: 'compute',
    title: 'Meta New Albany & Temple Hyperscale AI Training Builds',
    location: 'New Albany, Ohio, USA',
    lat: 40.0812,
    lon: -82.8088,
    country: 'United States',
    powerMw: 220,
    coveredByBindingLaw: false,
    severity: 3,
    source: 'Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Llama-4 era hyperscale training cluster buildout powered under regional nuclear/grid PPAs.'
  },
  {
    id: 'tm-inst-ca-kr-aisi-2024',
    date: '2024-11',
    track: 'institute',
    title: 'Canada AISI & Korea AI Safety Institute Inaugural Convening',
    location: 'Ottawa / Seoul',
    lat: 45.4215,
    lon: -75.6972,
    country: 'Canada / South Korea',
    severity: 3,
    source: 'ISED Canada / MSIT Korea',
    url: 'https://ised-isde.canada.ca/',
    summary: 'Global safety institute network expands to San Francisco ministerial across 10 partner states.'
  },
  {
    id: 'tm-law-kr-basic-2024',
    date: '2024-12',
    track: 'law',
    title: 'South Korea National Assembly Enacts AI Basic Act',
    location: 'Seoul, South Korea',
    lat: 37.5665,
    lon: 126.9780,
    country: 'South Korea',
    severity: 4,
    source: 'National Assembly of South Korea',
    url: 'https://www.msit.go.kr/',
    summary: 'Asia\'s first comprehensive national AI statute governing high-impact systems, generative AI watermarking, and compute safety.'
  },
  // ── 2025 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-inst-india-aisi-2025',
    date: '2025-01',
    track: 'institute',
    title: 'IndiaAI Safety Institute Launched in Bengaluru & New Delhi',
    location: 'Bengaluru, India',
    lat: 12.9716,
    lon: 77.5946,
    country: 'India',
    severity: 4,
    source: 'MeitY India',
    url: 'https://indiaai.gov.in/',
    summary: 'Hub-and-spoke safety institute testing multilingual Indic foundation models and DPI safeguards.'
  },
  {
    id: 'tm-law-eu-prohib-2025',
    date: '2025-02',
    track: 'law',
    title: 'EU AI Act Article 5 Prohibited AI & AI Literacy Mandatory',
    location: 'Brussels, Belgium',
    lat: 50.8503,
    lon: 4.3517,
    country: 'European Union',
    severity: 5,
    source: 'European Commission',
    url: 'https://eur-lex.europa.eu/',
    summary: 'Binding bans enter enforcement covering social scoring, untargeted facial scraping, and emotion surveillance.'
  },
  {
    id: 'tm-inst-paris-summit-2025',
    date: '2025-02',
    track: 'institute',
    title: 'Paris AI Action Summit & France INESIA Safety Institute',
    location: 'Paris, France',
    lat: 48.8566,
    lon: 2.3522,
    country: 'France / Multilateral',
    severity: 4,
    source: 'France INESIA / ROOST',
    url: 'https://www.elysee.fr/',
    summary: 'Establishes Current AI public-interest fund and French national evaluation agency INESIA.'
  },
  {
    id: 'tm-comp-rainier-2025',
    date: '2025-03',
    track: 'compute',
    title: 'Amazon–Anthropic Project Rainier (Indiana 450 MW)',
    location: 'New Carlisle, Indiana, USA',
    lat: 41.7050,
    lon: -86.5100,
    country: 'United States',
    powerMw: 450,
    coveredByBindingLaw: false,
    severity: 4,
    source: 'AWS / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Hundreds of thousands of Trainium2 accelerators built outside comprehensive US federal AI safety legislation.'
  },
  {
    id: 'tm-law-jp-act-2025',
    date: '2025-05',
    track: 'law',
    title: 'Japan Enacts AI Promotion & Investigation Act',
    location: 'Tokyo, Japan',
    lat: 35.6895,
    lon: 139.6917,
    country: 'Japan',
    severity: 3,
    source: 'Cabinet Office Japan',
    url: 'https://www8.cao.go.jp/',
    summary: 'Creates statutory authority for government investigation of serious AI rights violations and transparency reporting.'
  },
  {
    id: 'tm-law-vn-digital-2025',
    date: '2025-06',
    track: 'law',
    title: 'Vietnam Enacts Law on Digital Technology Industry (Risk-Tiered AI)',
    location: 'Hanoi, Vietnam',
    lat: 21.0285,
    lon: 105.8542,
    country: 'Vietnam',
    severity: 4,
    source: 'National Assembly Vietnam',
    url: 'https://e.vnexpress.net/',
    summary: 'ASEAN\'s first statutory risk-based AI regulation including synthetic-content watermarking and compute incentives.'
  },
  {
    id: 'tm-law-eu-gpai-2025',
    date: '2025-08',
    track: 'law',
    title: 'EU AI Act GPAI Systemic-Risk Model Duties Effective',
    location: 'Brussels, Belgium',
    lat: 50.8503,
    lon: 4.3517,
    country: 'European Union',
    severity: 5,
    source: 'European AI Office',
    url: 'https://digital-strategy.ec.europa.eu/',
    summary: 'Binding training-data summaries, adversarial red-teaming, and incident reporting take effect for frontier foundation models.'
  },
  {
    id: 'tm-comp-johor-2025',
    date: '2025-08',
    track: 'compute',
    title: 'Johor–Singapore Hyperscale AI Cluster Milestone (420 MW)',
    location: 'Johor Bahru, Malaysia',
    lat: 1.4927,
    lon: 103.7414,
    country: 'Malaysia',
    powerMw: 420,
    coveredByBindingLaw: false,
    severity: 4,
    source: 'Data Center Dynamics / NAIO',
    url: 'https://www.datacenterdynamics.com/',
    summary: 'Southeast Asia\'s fastest-scaling AI compute cluster ahead of binding ASEAN statutory enforcement.'
  },
  {
    id: 'tm-law-ca-sb53-2025',
    date: '2025-09',
    track: 'law',
    title: 'California Enacts SB 53 (Frontier AI Transparency & Whistleblower Law)',
    location: 'Sacramento, California, USA',
    lat: 38.5816,
    lon: -121.4944,
    country: 'United States (California)',
    severity: 5,
    source: 'California Legislature',
    url: 'https://leginfo.legislature.ca.gov/',
    summary: 'First binding US statutory duty requiring frontier safety frameworks, catastrophic-incident disclosure, and insider whistleblower shield.'
  },
  {
    id: 'tm-comp-stargate-tx-2025',
    date: '2025-09',
    track: 'compute',
    title: 'Stargate Abilene Campus Phase 1 Energized (1.2 GW Scale)',
    location: 'Abilene, Texas, USA',
    lat: 32.4487,
    lon: -99.7331,
    country: 'United States',
    powerMw: 1200,
    coveredByBindingLaw: false,
    severity: 5,
    source: 'Epoch AI / OpenAI',
    url: 'https://epoch.ai/',
    summary: 'Gigawatt-scale frontier AI training campus exceeding 1 GW single-site power capacity.'
  },
  {
    id: 'tm-inst-un-panel-2025',
    date: '2025-09',
    track: 'institute',
    title: 'UN Establishes Independent International Scientific Panel on AI',
    location: 'New York / UNGA',
    lat: 40.7489,
    lon: -73.9680,
    country: 'Multilateral (UN)',
    severity: 4,
    source: 'United Nations Pact for the Future',
    url: 'https://news.un.org/',
    summary: 'UN Global Digital Compact institutionalizes an IPCC-style global scientific AI risk panel and Global Dialogue on AI Governance.'
  },
  {
    id: 'tm-comp-saudi-humain-2025',
    date: '2025-10',
    track: 'compute',
    title: 'Saudi Arabia Sovereign AI Compute Buildout (500 MW)',
    location: 'Riyadh / Dammam, Saudi Arabia',
    lat: 24.7136,
    lon: 46.6753,
    country: 'Saudi Arabia',
    powerMw: 500,
    coveredByBindingLaw: false,
    severity: 4,
    source: 'SDAIA / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Gulf sovereign GPU deployment coupling PDPL data-transfer mandates with US-Saudi compute export understandings.'
  },
  {
    id: 'tm-law-za-ng-2025',
    date: '2025-11',
    track: 'law',
    title: 'Nigeria NAIS & South Africa National AI Policy Enforcement',
    location: 'Abuja / Pretoria',
    lat: 9.0765,
    lon: 7.3986,
    country: 'Nigeria / South Africa',
    severity: 3,
    source: 'NITDA / DCDT',
    url: 'https://nitda.gov.ng/',
    summary: 'Africa\'s largest digital economies anchor data-protection automated-decision enforcement alongside sovereign AI strategies.'
  },
  // ── 2026 ────────────────────────────────────────────────────────────────────
  {
    id: 'tm-law-kr-eff-2026',
    date: '2026-01',
    track: 'law',
    title: 'South Korea AI Basic Act Enters Binding Force',
    location: 'Seoul, South Korea',
    lat: 37.5665,
    lon: 126.9780,
    country: 'South Korea',
    severity: 5,
    source: 'MSIT South Korea',
    url: 'https://www.msit.go.kr/',
    summary: 'Full statutory enforcement covering >10²⁶ FLOP lifecycle safety obligations, impact assessments, and watermarking.'
  },
  {
    id: 'tm-comp-cn-innermong-2026',
    date: '2026-01',
    track: 'compute',
    title: 'Hohhot / Ulanqab Sovereign AI Compute Hub (340 MW)',
    location: 'Hohhot, Inner Mongolia, China',
    lat: 40.8414,
    lon: 111.7519,
    country: 'China',
    powerMw: 340,
    coveredByBindingLaw: true,
    severity: 3,
    source: 'Epoch AI / CAC Registry',
    url: 'https://epoch.ai/',
    summary: 'Cold-climate wind-powered AI training corridor regulated under national CAC algorithmic filing statutes.'
  },
  {
    id: 'tm-comp-uae-stargate-2026',
    date: '2026-02',
    track: 'compute',
    title: 'Abu Dhabi 1 GW UAE–US Frontier AI Campus Buildout',
    location: 'Abu Dhabi, UAE',
    lat: 24.4539,
    lon: 54.3773,
    country: 'UAE',
    powerMw: 1000,
    coveredByBindingLaw: false,
    severity: 5,
    source: 'UAE AI Office / Epoch AI',
    url: 'https://epoch.ai/',
    summary: 'Gigawatt-scale Middle East AI compute hub operating under bilateral export-control charters outside binding statutory risk law.'
  },
  {
    id: 'tm-comp-eu-giga-2026',
    date: '2026-03',
    track: 'compute',
    title: 'EU AI Gigafactories & EuroHPC Frontier Deployment (380 MW)',
    location: 'Jülich / Barcelona, EU',
    lat: 50.9050,
    lon: 6.4120,
    country: 'European Union',
    powerMw: 380,
    coveredByBindingLaw: true,
    severity: 4,
    source: 'EuroHPC / European Commission',
    url: 'https://eurohpc-ju.europa.eu/',
    summary: 'Sovereign European AI training infrastructure fully governed by EU AI Act Article 51–55 systemic-risk compliance.'
  },
  {
    id: 'tm-law-br-2338-2026',
    date: '2026-03',
    track: 'law',
    title: 'Brazil PL 2338 Risk & Algorithmic Rights Framework Operationalized',
    location: 'Brasília / São Paulo, Brazil',
    lat: -15.7975,
    lon: -47.8919,
    country: 'Brazil',
    severity: 4,
    source: 'Senado Federal / ANPD',
    url: 'https://www25.senado.leg.br/',
    summary: 'Establishes ANPD coordinated AI oversight, high-risk algorithmic impact assessments, and civil liability protections across South America.'
  },
  {
    id: 'tm-comp-uk-culham-2026',
    date: '2026-04',
    track: 'compute',
    title: 'UK Culham AI Growth Zone Compute Cluster (260 MW)',
    location: 'Oxfordshire / Culham, UK',
    lat: 51.6530,
    lon: -1.2330,
    country: 'United Kingdom',
    powerMw: 260,
    coveredByBindingLaw: false,
    severity: 3,
    source: 'UK DSIT',
    url: 'https://www.gov.uk/',
    summary: 'Flagship UK sovereign compute corridor linked to UK AISI evaluation protocols.'
  },
  {
    id: 'tm-law-coe-ratified-2026',
    date: '2026-05',
    track: 'law',
    title: 'Council of Europe AI Treaty (CETS 225) Ratified by EU',
    location: 'Strasbourg, France',
    lat: 48.5734,
    lon: 7.7521,
    country: 'European Union / CoE',
    severity: 5,
    source: 'Council of Europe',
    url: 'https://www.coe.int/',
    summary: 'Ratification locks binding international human-rights obligations for public & private AI deployments.'
  },
  {
    id: 'tm-comp-in-jamnagar-2026',
    date: '2026-05',
    track: 'compute',
    title: 'Jamnagar & Navi Mumbai Sovereign AI Park (350 MW)',
    location: 'Jamnagar / Navi Mumbai, India',
    lat: 22.4707,
    lon: 70.0577,
    country: 'India',
    powerMw: 350,
    coveredByBindingLaw: false,
    severity: 4,
    source: 'IndiaAI Mission / Epoch AI',
    url: 'https://indiaai.gov.in/',
    summary: 'Massive domestic GPU training capacity expanding Global South compute sovereignty.'
  },
  {
    id: 'tm-inst-gm-2026',
    date: '2026-06',
    track: 'institute',
    title: 'Global Majority AI Safety Network Alignment Convening',
    location: 'Nairobi, Kenya',
    lat: -1.2921,
    lon: 36.8219,
    country: 'Kenya / AU',
    severity: 4,
    source: 'CIPESA / AU Commission',
    url: 'https://cipesa.org/',
    summary: 'Bridges African, ASEAN, and Latin American safety institutes with G7 red-teaming standards.'
  },
  {
    id: 'tm-law-eu-art50-2026',
    date: '2026-08',
    track: 'law',
    title: 'EU AI Act Art. 50 Transparency & Digital Omnibus Timeline Live',
    location: 'Brussels, Belgium',
    lat: 50.8503,
    lon: 4.3517,
    country: 'European Union',
    severity: 5,
    source: 'EUR-Lex',
    url: 'https://eur-lex.europa.eu/',
    summary: 'Binding machine-readable synthetic-content marking & deepfake disclosure applies across EU single market.'
  }
];

export function computeTemporalSnapshot(currentYm = '2026-11', baselineYm = '2020-01', activeTracks = { law: true, institute: true, compute: true }) {
  const milestones = TEMPORAL_MILESTONES.filter((m) => activeTracks[m.track] !== false && m.date <= currentYm).map((m) => ({
    ...m,
    isPostBaseline: Boolean(baselineYm && m.date > baselineYm)
  }));

  const currentAll = TEMPORAL_MILESTONES.filter((m) => m.date <= currentYm);
  const baseAll = baselineYm ? TEMPORAL_MILESTONES.filter((m) => m.date <= baselineYm) : [];

  const laws = currentAll.filter((m) => m.track === 'law').length;
  const institutes = currentAll.filter((m) => m.track === 'institute').length;
  const computeList = currentAll.filter((m) => m.track === 'compute');
  const totalMw = computeList.reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0);
  const coveredMw = computeList.filter((c) => c.coveredByBindingLaw).reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0);
  const coveredPct = totalMw > 0 ? Math.round((coveredMw / totalMw) * 100) : 0;

  const baseLaws = baseAll.filter((m) => m.track === 'law').length;
  const baseInstitutes = baseAll.filter((m) => m.track === 'institute').length;
  const baseComputeMw = baseAll.filter((m) => m.track === 'compute').reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0);
  const baseCoveredMw = baseAll.filter((m) => m.track === 'compute' && c.coveredByBindingLaw).reduce((acc, c) => acc + (Number(c.powerMw) || 0), 0);
  const baseCoveredPct = baseComputeMw > 0 ? Math.round((baseCoveredMw / baseComputeMw) * 100) : 0;

  return {
    milestones,
    metrics: {
      laws,
      institutes,
      totalGw: Number((totalMw / 1000).toFixed(2)),
      totalMw,
      coveredPct,
      deltaLaws: laws - baseLaws,
      deltaInstitutes: institutes - baseInstitutes,
      deltaGw: Number(((totalMw - baseComputeMw) / 1000).toFixed(2)),
      deltaCoveredPct: coveredPct - baseCoveredPct
    }
  };
}
