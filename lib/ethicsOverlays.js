/**
 * Sovereign Observatory — Empirical AI Ethics & Society Geospatial Datasets
 * 1. Environmental Justice: Compute Water Stress & Ember 2025 Grid Carbon Intensity (merged with live Epoch AI clusters)
 * 2. AI Supply Chain: 7-Stage Critical Minerals -> Refining -> Lithography -> Foundry -> Packaging -> Rack Assembly -> E-Waste
 * 3. Algorithmic Welfare, Biometric Borders & Surveillance Governance (44 documented global cases)
 * 4. AI Data-Labeling, RLHF & Content-Moderation Global Labor Hubs (34 documented global hubs)
 */

// Country carbon intensity (gCO2eq/kWh — Ember Global Electricity Review 2024/2025) & baseline water-stress tier (WRI Aqueduct 4.0)
const COUNTRY_ENV_PROFILE = {
  'United States': { carbonIntensity: 369, waterStress: 'Medium-High (20-40%)' },
  China: { carbonIntensity: 582, waterStress: 'High (40-80%)' },
  India: { carbonIntensity: 713, waterStress: 'Extreme (>80%)' },
  'United Kingdom': { carbonIntensity: 185, waterStress: 'Low-Medium (10-20%)' },
  Ireland: { carbonIntensity: 295, waterStress: 'Low (<10%)' },
  France: { carbonIntensity: 56, waterStress: 'Low-Medium (10-20%)' },
  Germany: { carbonIntensity: 344, waterStress: 'Medium-High (20-40%)' },
  Netherlands: { carbonIntensity: 268, waterStress: 'Low-Medium (10-20%)' },
  Sweden: { carbonIntensity: 36, waterStress: 'Low (<10%)' },
  Norway: { carbonIntensity: 28, waterStress: 'Low (<10%)' },
  Finland: { carbonIntensity: 68, waterStress: 'Low (<10%)' },
  Canada: { carbonIntensity: 128, waterStress: 'Low (<10%)' },
  Japan: { carbonIntensity: 462, waterStress: 'Low-Medium (10-20%)' },
  'South Korea': { carbonIntensity: 415, waterStress: 'Medium-High (20-40%)' },
  Taiwan: { carbonIntensity: 518, waterStress: 'Medium-High (20-40%)' },
  Singapore: { carbonIntensity: 492, waterStress: 'Extreme (>80%)' },
  Malaysia: { carbonIntensity: 560, waterStress: 'High (40-80%)' },
  Indonesia: { carbonIntensity: 645, waterStress: 'High (40-80%)' },
  Australia: { carbonIntensity: 525, waterStress: 'High (40-80%)' },
  'United Arab Emirates': { carbonIntensity: 488, waterStress: 'Extreme (>80%)' },
  'Saudi Arabia': { carbonIntensity: 615, waterStress: 'Extreme (>80%)' },
  Brazil: { carbonIntensity: 98, waterStress: 'Low-Medium (10-20%)' },
  Chile: { carbonIntensity: 245, waterStress: 'Extreme (>80%)' },
  Mexico: { carbonIntensity: 435, waterStress: 'Extreme (>80%)' },
  Uruguay: { carbonIntensity: 68, waterStress: 'High (Seasonal)' },
  Spain: { carbonIntensity: 165, waterStress: 'High (40-80%)' },
  Italy: { carbonIntensity: 318, waterStress: 'High (40-80%)' },
  Poland: { carbonIntensity: 615, waterStress: 'Low-Medium (10-20%)' },
  Kenya: { carbonIntensity: 92, waterStress: 'Medium-High (20-40%)' },
  'South Africa': { carbonIntensity: 745, waterStress: 'High (40-80%)' },
  Thailand: { carbonIntensity: 495, waterStress: 'High (40-80%)' },
  Vietnam: { carbonIntensity: 472, waterStress: 'Medium-High (20-40%)' }
};

export function enrichFrontierClusterEnvironment(c) {
  if (!c || typeof c.lat !== 'number' || typeof c.lon !== 'number' || isNaN(c.lat) || isNaN(c.lon)) return null;
  const profile = COUNTRY_ENV_PROFILE[c.country] || { carbonIntensity: 420, waterStress: 'Medium-High (20-40%)' };
  let waterStress = profile.waterStress;
  // Local arid-basin refinement (US Southwest / Central Mexico / Gulf)
  if (c.country === 'United States' && c.lon < -102 && c.lat < 39.5) {
    waterStress = 'Extreme (>80%)';
  } else if (c.country === 'United States' && (c.lat > 43 || (c.lon > -95 && c.lon < -80 && c.lat > 40))) {
    waterStress = 'Low (<10%)';
  }
  const powerMw = Number(c.powerMw) || 85;
  const carbonIntensity = profile.carbonIntensity;
  // Evaporative cooling estimate: ~72% avg capacity factor * 1.8 L/kWh -> ML/yr; CO2 kt/yr
  const estWaterMlYr = Math.round(powerMw * 8.76 * 0.72 * 1.8);
  const estKtCo2Yr = Math.round((powerMw * 8760 * 0.72 * carbonIntensity) / 1e6);
  const isExtreme = waterStress.startsWith('Extreme') || (powerMw >= 400 && carbonIntensity >= 450);
  const severity = isExtreme ? 5 : powerMw >= 300 || carbonIntensity >= 450 || waterStress.startsWith('High') ? 4 : carbonIntensity < 150 ? 2 : 3;
  const color = severity >= 5 ? '#ef4444' : severity >= 4 ? '#f97316' : severity === 3 ? '#38bdf8' : '#10b981';

  return {
    id: `env-epoch-${c.id}`,
    name: `${c.name} (${powerMw} MW)`,
    country: c.country || 'Global',
    address: c.address || '',
    owner: c.owner || 'Hyperscale Consortium',
    chipTypes: c.chipTypes || 'Frontier Accelerators',
    lat: c.lat,
    lon: c.lon,
    waterStress,
    carbonIntensity,
    powerLoadMw: powerMw,
    estWaterMlYr,
    estKtCo2Yr,
    severity,
    color,
    ethicsKind: 'environmental',
    summary: `Live Epoch AI frontier cluster (${c.owner || 'Undisclosed'}, ${powerMw} MW${c.h100Equivalents ? `, ~${Number(c.h100Equivalents).toLocaleString()} H100-eq` : ''}) on a ${carbonIntensity} gCO2/kWh grid (${c.country}) under ${waterStress} basin water stress (est. ${estWaterMlYr.toLocaleString()} ML/yr evaporative water draw, ~${estKtCo2Yr.toLocaleString()} kt CO2/yr).`,
    source: 'Epoch AI / Ember 2025 / WRI Aqueduct 4.0',
    url: c.sourceUrl || 'https://epoch.ai/data/data-centers'
  };
}

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
    estWaterMlYr: 4768,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Severe aquifer depletion and municipal drought conflict around expanding AWS, Microsoft, and Google campuses in central Mexico.',
    source: 'WRI Aqueduct 4.0 / Data Center Dynamics',
    url: 'https://www.datacenterdynamics.com/'
  },
  {
    id: 'env-johor-my',
    name: 'Johor–Singapore Hyperscale AI Belt',
    country: 'Malaysia',
    lat: 1.4927,
    lon: 103.7414,
    waterStress: 'High (40-80%)',
    carbonIntensity: 560,
    powerLoadMw: 1650,
    estWaterMlYr: 18732,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Multi-gigawatt ASEAN AI compute buildout triggering municipal denials on water-intensive evaporative cooling atop coal/gas baseload emissions.',
    source: 'Malaysia NAIO / Data Center Dynamics',
    url: 'https://www.datacenterdynamics.com/'
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
    estWaterMlYr: 13056,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Over-allocated Colorado River basin balancing TSMC fabs and hyperscale cloud water rights.',
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
    estWaterMlYr: 3406,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Rapid 100k+ GPU cluster using temporary methane gas turbines raised NOx and Clean Air Act environmental-justice complaints in South Memphis.',
    source: 'SELC / US EPA',
    url: 'https://www.southernenvironment.org/'
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
    estWaterMlYr: 11200,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Data centers consume >21% of national Irish electricity, prompting EirGrid metropolitan connection moratoriums.',
    source: 'CSO Ireland / EirGrid',
    url: 'https://www.eirgrid.ie/'
  },
  {
    id: 'env-ashburn-us',
    name: 'Northern Virginia Data Center Alley',
    country: 'United States',
    lat: 39.0438,
    lon: -77.4874,
    waterStress: 'Medium-High (20-40%)',
    carbonIntensity: 330,
    powerLoadMw: 3800,
    estWaterMlYr: 43140,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'World’s densest compute corridor (>3.8 GW load) driving 500kV transmission battles and delayed fossil plant retirements.',
    source: 'JLARC Virginia',
    url: 'https://jlarc.virginia.gov/'
  },
  {
    id: 'env-dalles-us',
    name: 'The Dalles Columbia Basin Cluster',
    country: 'United States',
    lat: 45.5946,
    lon: -121.1787,
    waterStress: 'High (Basin Allocation)',
    carbonIntensity: 140,
    powerLoadMw: 520,
    estWaterMlYr: 5904,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Hydro-powered campuses triggered landmark public-records water-consumption disclosure litigation.',
    source: 'The Oregonian / City of The Dalles',
    url: 'https://www.oregonlive.com/'
  },
  {
    id: 'env-montevideo-uy',
    name: 'Canelones / Montevideo Water Dispute',
    country: 'Uruguay',
    lat: -34.9011,
    lon: -56.1645,
    waterStress: 'High (Seasonal Drought)',
    carbonIntensity: 68,
    powerLoadMw: 110,
    estWaterMlYr: 980,
    severity: 3,
    color: '#facc15',
    ethicsKind: 'environmental',
    summary: 'Freshwater drought sparked litigation forcing Google to redesign potable-water cooling into air-cooled compute.',
    source: 'ObservaTIC / Data Center Dynamics',
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
    estWaterMlYr: 3179,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Chile environmental courts mandated aquifer-impact re-evaluation during central Chile’s 15-year megadrought.',
    source: 'Derechos Digitales / Chilean Courts',
    url: 'https://www.derechosdigitales.org/'
  },
  {
    id: 'env-mumbai-in',
    name: 'Navi Mumbai Sovereign AI & Cloud Belt',
    country: 'India',
    lat: 19.0760,
    lon: 72.8777,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 690,
    powerLoadMw: 950,
    estWaterMlYr: 10786,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Coal-heavy Maharashtra grid and seasonal water shortages challenge rapid sovereign GPU park scaling.',
    source: 'CEA India / MediaNama',
    url: 'https://www.medianama.com/'
  },
  {
    id: 'env-chennai-in',
    name: 'Chennai Ambattur Coastal Cloud Hub',
    country: 'India',
    lat: 13.0827,
    lon: 80.2707,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 705,
    powerLoadMw: 480,
    estWaterMlYr: 5450,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Subsea-cable landing cluster facing coastal groundwater salinization and thermal stress.',
    source: 'WRI India Aqueduct',
    url: 'https://www.wri.org/aqueduct'
  },
  {
    id: 'env-jakarta-id',
    name: 'Bekasi–Cikarang Hyperscale Grid Zone',
    country: 'Indonesia',
    lat: -6.2886,
    lon: 107.1419,
    waterStress: 'High (40-80%)',
    carbonIntensity: 660,
    powerLoadMw: 540,
    estWaterMlYr: 6131,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Java-Bali coal-reliant baseload grid and land subsidence heighten environmental costs of Southeast Asian cloud growth.',
    source: 'IEA / Ember Electricity Review',
    url: 'https://ember-energy.org/'
  },
  {
    id: 'env-batam-id',
    name: 'Batam Nongsa Cross-Border AI Park',
    country: 'Indonesia',
    lat: 1.1301,
    lon: 104.0529,
    waterStress: 'Medium-High (20-40%)',
    carbonIntensity: 620,
    powerLoadMw: 450,
    estWaterMlYr: 5109,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Singapore spillover compute zone racing to add solar/LNG microgrids for hyperscale tenant decarbonization pledges.',
    source: 'Nongsa Digital Park / DCD',
    url: 'https://www.datacenterdynamics.com/'
  },
  {
    id: 'env-jurong-sg',
    name: 'Jurong Island Green Data Center Park',
    country: 'Singapore',
    lat: 1.2667,
    lon: 103.6833,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 492,
    powerLoadMw: 780,
    estWaterMlYr: 6200,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Singapore IMDA Tropical Data Centre Standard raises operating temperatures (26°C+) and PUE <= 1.3 caps after lifting its DC moratorium.',
    source: 'IMDA Singapore',
    url: 'https://www.imda.gov.sg/'
  },
  {
    id: 'env-taipei-tw',
    name: 'Taiwan Semiconductor & AI Grid Strain',
    country: 'Taiwan',
    lat: 24.8138,
    lon: 120.9675,
    waterStress: 'High (Drought Cycles)',
    carbonIntensity: 518,
    powerLoadMw: 1250,
    estWaterMlYr: 14192,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'EUV fabs plus AI R&D centers strain reserve electricity margins and central Taiwan reservoirs during dry winters.',
    source: 'Taipower / IEA',
    url: 'https://www.iea.org/'
  },
  {
    id: 'env-ulanqab-cn',
    name: 'Ulanqab & Hohhot "East Data, West Compute"',
    country: 'China',
    lat: 40.9945,
    lon: 113.1145,
    waterStress: 'High (Semi-Arid)',
    carbonIntensity: 680,
    powerLoadMw: 1500,
    estWaterMlYr: 12400,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Massive Inner Mongolia AI training bases balancing cold-climate free air cooling against coal-heavy regional power and steppe water limits.',
    source: 'NDRC China / Greenpeace East Asia',
    url: 'https://www.greenpeace.org/eastasia/'
  },
  {
    id: 'env-guizhou-cn',
    name: 'Gui’an New Area Hydro-AI Cluster',
    country: 'China',
    lat: 26.4044,
    lon: 106.5648,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 290,
    powerLoadMw: 920,
    estWaterMlYr: 7800,
    severity: 3,
    color: '#38bdf8',
    ethicsKind: 'environmental',
    summary: 'China’s southern mountain compute hub leveraging karst caves and hydropower while encountering dry-season hydro shortfalls.',
    source: 'China NDRC',
    url: 'https://en.ndrc.gov.cn/'
  },
  {
    id: 'env-dubai-ae',
    name: 'UAE Abu Dhabi–Dubai Desalinated AI Clusters',
    country: 'United Arab Emirates',
    lat: 24.4539,
    lon: 54.3773,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 488,
    powerLoadMw: 1600,
    estWaterMlYr: 18164,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Desert mega-compute expansions rely on energy-intensive seawater desalination cooling paired with Barakah nuclear baseload.',
    source: 'Ember / IEA',
    url: 'https://ember-energy.org/'
  },
  {
    id: 'env-neom-sa',
    name: 'Saudi Oxagon / Riyadh AI Mega-Compute',
    country: 'Saudi Arabia',
    lat: 28.0000,
    lon: 35.2000,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 615,
    powerLoadMw: 850,
    estWaterMlYr: 9650,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Oil/gas grid and coastal Red Sea desalination pressures around planned multi-hundred-MW HUMAIN / Aramco AI buildouts.',
    source: 'Ember / Data Center Dynamics',
    url: 'https://www.datacenterdynamics.com/'
  },
  {
    id: 'env-johannesburg-za',
    name: 'Midrand–Johannesburg Coal Grid Cloud Hub',
    country: 'South Africa',
    lat: -25.9895,
    lon: 28.1284,
    waterStress: 'High (40-80%)',
    carbonIntensity: 745,
    powerLoadMw: 380,
    estWaterMlYr: 4314,
    severity: 5,
    color: '#ef4444',
    ethicsKind: 'environmental',
    summary: 'Highest grid carbon intensity among major African data-center hubs, forcing operators to build private solar wheeling and battery arrays.',
    source: 'Eskom / Ember 2025',
    url: 'https://ember-energy.org/'
  },
  {
    id: 'env-naivasha-ke',
    name: 'Naivasha Geothermal Green Compute Valley',
    country: 'Kenya',
    lat: -0.7172,
    lon: 36.4310,
    waterStress: 'Medium (Lake Naivasha)',
    carbonIntensity: 92,
    powerLoadMw: 120,
    estWaterMlYr: 950,
    severity: 2,
    color: '#10b981',
    ethicsKind: 'environmental',
    summary: 'Low-carbon Olkaria geothermal-powered AI & cloud campus demonstrating African green-compute potential with local lake-basin monitoring.',
    source: 'KenGen / EcoCloud',
    url: 'https://www.kengen.co.ke/'
  },
  {
    id: 'env-sao-paulo-br',
    name: 'Campinas–São Paulo Hydro Compute Zone',
    country: 'Brazil',
    lat: -22.9099,
    lon: -47.0626,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 98,
    powerLoadMw: 690,
    estWaterMlYr: 5200,
    severity: 2,
    color: '#10b981',
    ethicsKind: 'environmental',
    summary: 'Latin America’s largest AI/cloud market benefits from ~88% renewable hydro/wind electricity.',
    source: 'EPE Brazil / Ember',
    url: 'https://ember-energy.org/'
  },
  {
    id: 'env-frankfurt-de',
    name: 'Frankfurt FLAP-D Grid Congestion Hub',
    country: 'Germany',
    lat: 50.1109,
    lon: 8.6821,
    waterStress: 'Medium-High (20-40%)',
    carbonIntensity: 344,
    powerLoadMw: 1100,
    estWaterMlYr: 9800,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Germany’s Energy Efficiency Act mandates PUE <= 1.2 and waste-heat recovery quotas (10–20%) on new compute builds.',
    source: 'German EnEfG / Borderstep Institute',
    url: 'https://www.borderstep.de/'
  },
  {
    id: 'env-amsterdam-nl',
    name: 'Haarlemmermeer & North Holland Hyperscale Cap',
    country: 'Netherlands',
    lat: 52.3000,
    lon: 4.6833,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 268,
    powerLoadMw: 780,
    estWaterMlYr: 6500,
    severity: 3,
    color: '#38bdf8',
    ethicsKind: 'environmental',
    summary: 'National restriction blocking new hyperscale campuses >70 MW outside designated Wieringermeer / Eemshaven grid zones.',
    source: 'Dutch Ministry of Economic Affairs',
    url: 'https://www.government.nl/'
  },
  {
    id: 'env-aragon-es',
    name: 'Aragón (Zaragoza) Ebro Basin Cloud Expansion',
    country: 'Spain',
    lat: 41.6488,
    lon: -0.8891,
    waterStress: 'Extreme (>80%)',
    carbonIntensity: 165,
    powerLoadMw: 900,
    estWaterMlYr: 8400,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Multi-billion-euro AWS/Microsoft buildouts face scrutiny over Ebro watershed cooling quotas despite abundant solar/wind.',
    source: 'Spanish Ecological Transition Ministry',
    url: 'https://www.miteco.gob.es/'
  },
  {
    id: 'env-paris-fr',
    name: 'Paris–Saclay Nuclear-Baseload AI Clusters',
    country: 'France',
    lat: 48.7128,
    lon: 2.2124,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 56,
    powerLoadMw: 840,
    estWaterMlYr: 5900,
    severity: 2,
    color: '#10b981',
    ethicsKind: 'environmental',
    summary: 'France’s nuclear fleet gives European AI clusters among the lowest operational carbon intensities globally (56 gCO2/kWh).',
    source: 'RTE France / Ember',
    url: 'https://www.rte-france.com/'
  },
  {
    id: 'env-lulea-se',
    name: 'Luleå Sub-Arctic Hydro AI Corridor',
    country: 'Sweden',
    lat: 65.5848,
    lon: 22.1567,
    waterStress: 'Low (<10%)',
    carbonIntensity: 36,
    powerLoadMw: 450,
    estWaterMlYr: 850,
    severity: 2,
    color: '#10b981',
    ethicsKind: 'environmental',
    summary: 'Sub-arctic free-air cooling and Lule River hydro produce ultra-low carbon and minimal evaporative water loss.',
    source: 'Swedish Energy Agency',
    url: 'https://www.energimyndigheten.se/'
  },
  {
    id: 'env-mo-no',
    name: 'Mo i Rana & Narvik Arctic Compute Hubs',
    country: 'Norway',
    lat: 66.3128,
    lon: 14.1428,
    waterStress: 'Low (<10%)',
    carbonIntensity: 28,
    powerLoadMw: 540,
    estWaterMlYr: 900,
    severity: 2,
    color: '#10b981',
    ethicsKind: 'environmental',
    summary: '98% renewable hydropower corridor attracting European AI training workloads alongside Stargate Norway proposals.',
    source: 'NVE Norway',
    url: 'https://www.nve.no/'
  },
  {
    id: 'env-sydney-au',
    name: 'Western Sydney & Melbourne AI Grid Demand',
    country: 'Australia',
    lat: -33.8688,
    lon: 150.9100,
    waterStress: 'High (40-80%)',
    carbonIntensity: 525,
    powerLoadMw: 920,
    estWaterMlYr: 10444,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Coal-transitioning NSW/Victoria grids warn AI data centers could absorb up to 12% of NEM load by 2030.',
    source: 'AEMO Australia',
    url: 'https://aemo.com.au/'
  },
  {
    id: 'env-tokyo-jp',
    name: 'Inzai–Chiba Hyperscale Grid Zone',
    country: 'Japan',
    lat: 35.8020,
    lon: 140.1476,
    waterStress: 'Low-Medium (10-20%)',
    carbonIntensity: 462,
    powerLoadMw: 1050,
    estWaterMlYr: 9900,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Tight TEPCO 50Hz grid capacity forcing AI data center siting north toward Hokkaido and Kyushu nuclear/wind zones.',
    source: 'METI Japan / OCCTO',
    url: 'https://www.meti.go.jp/english/'
  },
  {
    id: 'env-seoul-kr',
    name: 'Yongin–Gyeonggi Fab & AI Energy Nexus',
    country: 'South Korea',
    lat: 37.2411,
    lon: 127.1775,
    waterStress: 'Medium-High (20-40%)',
    carbonIntensity: 415,
    powerLoadMw: 1200,
    estWaterMlYr: 13624,
    severity: 4,
    color: '#f97316',
    ethicsKind: 'environmental',
    summary: 'Capital-region grid bottleneck sparked KEPCO decentralization rules pushing AI compute south to Jeonnam renewables.',
    source: 'MOTIE Korea',
    url: 'https://english.motie.go.kr/'
  },
  {
    id: 'env-quebec-ca',
    name: 'Montréal–Beauharnois Hydro Compute Belt',
    country: 'Canada',
    lat: 45.3167,
    lon: -73.8667,
    waterStress: 'Low (<10%)',
    carbonIntensity: 18,
    powerLoadMw: 580,
    estWaterMlYr: 1400,
    severity: 2,
    color: '#10b981',
    ethicsKind: 'environmental',
    summary: 'Hydro-Québec auctions allocate 18 gCO2/kWh clean power under strict heat-reuse and economic-benefit scoring.',
    source: 'Hydro-Québec',
    url: 'https://www.hydroquebec.com/'
  }
];

export const SUPPLY_CHAIN_NODES = [
  // Stage 1: Critical Minerals & Raw Extraction (#f59e0b)
  { id: 'sc-ext-kolwezi', name: 'Kolwezi & Tenke Fungurume Cobalt Belt', country: 'DR Congo', lat: -10.7148, lon: 25.4667, stage: 'extraction', mineral: 'Cobalt / Copper', operators: 'CMOC / Glencore / Gécamines', globalShare: '~72% Cobalt', chokepointRisk: 'Critical', severity: 5, color: '#f59e0b', summary: 'Primary global source of refined cobalt required for HBM fab interconnects and hyperscale UPS/BESS battery arrays; severe artisanal labor & tailings risks.', source: 'USGS / Amnesty International', url: 'https://www.usgs.gov/centers/national-minerals-information-center' },
  { id: 'sc-ext-atacama', name: 'Salar de Atacama Lithium Brine Basin', country: 'Chile', lat: -23.5000, lon: -68.2500, stage: 'extraction', mineral: 'Lithium Brine', operators: 'SQM / Albemarle', globalShare: '~24% Lithium', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'High-altitude Andean wetland brine extraction facing Indigenous water-table protections and Chilean state National Lithium Strategy co-ownership.', source: 'USGS / Observatorio Plurinacional de Salares', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-uyuni', name: 'Salar de Uyuni & Oruro Lithium Complex', country: 'Bolivia', lat: -20.1338, lon: -67.4891, stage: 'extraction', mineral: 'Lithium Carbonate', operators: 'YLB / CATL-CBC', globalShare: '21M t Resources', chokepointRisk: 'High', severity: 3, color: '#f59e0b', summary: 'World’s largest identified lithium resource undergoing direct lithium extraction (DLE) industrialization with Chinese and Russian consortia.', source: 'USGS Mineral Commodity Summaries', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-greenbushes', name: 'Greenbushes & Pilbara Spodumene Belt', country: 'Australia', lat: -33.8572, lon: 116.0581, stage: 'extraction', mineral: 'Hard-Rock Lithium', operators: 'Talison / Tianqi / IGO / Albemarle', globalShare: '~47% Lithium', chokepointRisk: 'Medium', severity: 3, color: '#f59e0b', summary: 'Allied friend-shored hard-rock lithium supply anchoring US IRA & EU Critical Raw Materials Act battery/grid chains.', source: 'Geoscience Australia / USGS', url: 'https://www.ga.gov.au/' },
  { id: 'sc-ext-bayan-obo', name: 'Bayan Obo Rare Earth & Neodymium Complex', country: 'China', lat: 41.7631, lon: 109.9694, stage: 'extraction', mineral: 'NdPr / Heavy Rare Earths', operators: 'China Northern Rare Earth', globalShare: '~55% Mine / ~88% Magnet', chokepointRisk: 'Critical', severity: 5, color: '#f59e0b', summary: 'Backbone of permanent magnets for precision ASML lithography stages, data-center cooling turbines, and autonomous drone actuators.', source: 'USGS / CSIS', url: 'https://www.csis.org/' },
  { id: 'sc-ext-kachin', name: 'Kachin Heavy Rare Earth Mining Belt', country: 'Myanmar', lat: 26.0100, lon: 98.2800, stage: 'extraction', mineral: 'Dysprosium / Terbium', operators: 'Border Armed Militias -> Chinese Processors', globalShare: '~45% Heavy REE', chokepointRisk: 'Critical', severity: 5, color: '#f59e0b', summary: 'Conflict-adjacent in-situ leaching supplying heavy rare earths to Chinese magnet refiners with severe watershed contamination.', source: 'Global Witness / USGS', url: 'https://www.globalwitness.org/' },
  { id: 'sc-ext-mount-weld', name: 'Mount Weld Rare Earth Deposit', country: 'Australia', lat: -28.8650, lon: 122.5483, stage: 'extraction', mineral: 'NdPr Oxide', operators: 'Lynas Rare Earths', globalShare: 'Largest Non-CN Source', chokepointRisk: 'Medium', severity: 3, color: '#f59e0b', summary: 'Key non-Chinese light rare earth mine feeding Kalgoorlie cracking and Kuantan Malaysia separation plants.', source: 'Lynas / Geoscience Australia', url: 'https://www.ga.gov.au/' },
  { id: 'sc-ext-mountain-pass', name: 'Mountain Pass Rare Earth Mine', country: 'United States', lat: 35.4819, lon: -115.5333, stage: 'extraction', mineral: 'Bastnaesite / NdPr', operators: 'MP Materials', globalShare: '~12% Mined REE', chokepointRisk: 'High', severity: 3, color: '#f59e0b', summary: 'Sole operating US rare-earth mine and separation plant reducing Pentagon & US robotics dependency on Chinese refining.', source: 'USGS / US DoD', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-spruce-pine', name: 'Spruce Pine Ultrapure Quartz Mines', country: 'United States', lat: 35.9151, lon: -82.0648, stage: 'extraction', mineral: 'High-Purity Quartz (HPQ)', operators: 'The Quartz Corp / Sibelco', globalShare: '~80–90% Crucible HPQ', chokepointRisk: 'Critical', severity: 5, color: '#f59e0b', summary: 'Irreplaceable ultra-low-impurity pegmatite quartz used for CZ crucibles melting 300mm monocrystalline silicon wafers globally.', source: 'USGS / SEMI', url: 'https://www.semi.org/' },
  { id: 'sc-ext-guangxi-ga', name: 'Guangxi & Yunnan Gallium–Germanium Belt', country: 'China', lat: 23.8000, lon: 106.6167, stage: 'extraction', mineral: 'Gallium & Germanium', operators: 'Chinalco / Yunnan Lincang', globalShare: '>94% Ga / ~60% Ge', chokepointRisk: 'Critical', severity: 5, color: '#f59e0b', summary: 'Subject to Beijing MOFCOM export-licensing controls (2023–2025) affecting GaN power electronics, fiber optics, and defense IR optics.', source: 'MOFCOM / CSET Georgetown', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-ext-escondida', name: 'Escondida & Antofagasta Copper Corridor', country: 'Chile', lat: -24.2683, lon: -69.0731, stage: 'extraction', mineral: 'Copper', operators: 'BHP / Rio Tinto / Codelco', globalShare: '~25% Global Copper', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Hyperscale AI data centers require 3–4x more copper per MW for busbars, transformers, and subsea cables than legacy facilities.', source: 'IEA Critical Minerals / BHP', url: 'https://www.iea.org/' },
  { id: 'sc-ext-grasberg', name: 'Grasberg Copper & Morowali Nickel Corridor', country: 'Indonesia', lat: -4.0531, lon: 137.1160, stage: 'extraction', mineral: 'Copper / Class-1 Nickel', operators: 'Freeport Indonesia / MIND ID', globalShare: '~50% Global Nickel / Top Cu', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Central node in battery-grid energy storage and data-center copper supply chains with intensive tailings footprint.', source: 'USGS / IEA', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-weda-bay', name: 'Halmahera & Morowali Nickel Processing Park', country: 'Indonesia', lat: 0.4833, lon: 127.8667, stage: 'extraction', mineral: 'Nickel (HPAL)', operators: 'Tsingshan / Huayou / Vale', globalShare: '~42% Refined Ni', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Captive coal-fired HPAL smelters powering hyperscale grid battery backup storage globally.', source: 'Climate Rights International / USGS', url: 'https://cri.org/' },
  { id: 'sc-ext-balama', name: 'Balama Natural Graphite & Balama Corridor', country: 'Mozambique', lat: -13.3489, lon: 38.5736, stage: 'extraction', mineral: 'Flake Graphite', operators: 'Syrah Resources', globalShare: 'Key Non-CN Graphite', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Crucial non-Chinese graphite supply used for synthetic carbon anodes and high-temp semiconductor crucible insulation.', source: 'USGS / Syrah Resources', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-san-luis-f', name: 'San Luis Potosí Fluorspar & Tantalum Chain', country: 'Mexico', lat: 22.1565, lon: -100.9855, stage: 'extraction', mineral: 'Fluorspar (CaF2)', operators: 'Orbia / Mexichem', globalShare: '~18% Fluorspar', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Primary feedstock for electronic-grade hydrofluoric acid (HF) wafer etching and PFAS fluoropolymer fab piping.', source: 'USGS / SEMI', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-bangka', name: 'Bangka–Belitung Tin Solder Belt', country: 'Indonesia', lat: -2.1316, lon: 106.1169, stage: 'extraction', mineral: 'Tin (Sn)', operators: 'PT Timah / Indonesian Smelters', globalShare: '~22% Refined Tin', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Lead-free SnAgCu solder micro-bumps inside every GPU, CoWoS interposer, and HBM stack depend heavily on Southeast Asian tin.', source: 'ITA / USGS', url: 'https://www.usgs.gov/' },
  { id: 'sc-ext-iluka-ilmenite', name: 'Ukraine–Georgia–US Neon & Noble Gas Supply', country: 'Ukraine', lat: 46.4825, lon: 30.7233, stage: 'extraction', mineral: 'Ultrapure Neon / Krypton', operators: 'Ingas (historic) / Global ASUs', globalShare: 'Post-2022 Rebalanced', chokepointRisk: 'High', severity: 4, color: '#f59e0b', summary: 'Excimer DUV laser gas supply shock after 2022 forced global ASUs in Europe, US, and China to diversify semiconductor-grade neon.', source: 'USITC / SEMI', url: 'https://www.usitc.gov/' },

  // Stage 2: Chemical Refining, Wafers & Photomasks (#eab308)
  { id: 'sc-ref-yibin', name: 'Yibin & Chengdu Lithium–Polysilicon Cluster', country: 'China', lat: 28.7513, lon: 104.6417, stage: 'refining', mineral: 'LiOH / Polysilicon', operators: 'Tianqi / CATL / Tongwei', globalShare: '~68% Global Refining', chokepointRisk: 'Critical', severity: 4, color: '#eab308', summary: 'Concentrated chemical conversion turning Australian/Chilean/Congolese ores into battery-grade compounds & solar/semi polysilicon.', source: 'IEA Critical Minerals', url: 'https://www.iea.org/' },
  { id: 'sc-ref-kwinana', name: 'Kwinana Allied Lithium & Rare-Earth Refineries', country: 'Australia', lat: -32.2400, lon: 115.7740, stage: 'refining', mineral: 'LiOH Refinery', operators: 'Tianqi-IGO / Covalent / Wesfarmers', globalShare: 'Non-CN LiOH Node', chokepointRisk: 'Medium', severity: 3, color: '#eab308', summary: 'Allied chemical conversion corridor breaking China’s downstream mineral refining bottleneck.', source: 'Australian Critical Minerals Office', url: 'https://www.industry.gov.au/' },
  { id: 'sc-ref-kuantan', name: 'Kuantan Gebeng Rare-Earth Separation Plant', country: 'Malaysia', lat: 3.9722, lon: 103.3833, stage: 'refining', mineral: 'Separated NdPr Oxides', operators: 'Lynas Malaysia', globalShare: 'Largest Non-CN Separator', chokepointRisk: 'High', severity: 4, color: '#eab308', summary: 'Processes Australian rare-earth concentrates into high-purity magnet oxides outside mainland China.', source: 'Lynas / Reuters', url: 'https://www.reuters.com/' },
  { id: 'sc-ref-shirakawa', name: 'Fukushima & Kyushu 300mm Silicon Wafer Belt', country: 'Japan', lat: 37.1261, lon: 140.2108, stage: 'refining', mineral: '300mm EPI Wafers', operators: 'Shin-Etsu / SUMCO', globalShare: '~56% Global 300mm Wafers', chokepointRisk: 'Critical', severity: 5, color: '#eab308', summary: 'Two Japanese firms supply over half of all ultra-flat 300mm crystalline silicon ingots/wafers for TSMC, Samsung, and Intel.', source: 'SEMI / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-ref-hsinchu-gw', name: 'GlobalWafers & Hsinchu Ultra-Pure Chemistry', country: 'Taiwan', lat: 24.7810, lon: 120.9967, stage: 'refining', mineral: '300mm Wafers / SiC', operators: 'GlobalWafers', globalShare: '~17% Global Wafers', chokepointRisk: 'High', severity: 4, color: '#eab308', summary: 'Top-3 global wafer maker supplying Taiwan, Texas (Sherman TX fab), and European chipmakers.', source: 'GlobalWafers / SEMI', url: 'https://www.semi.org/' },
  { id: 'sc-ref-burghausen', name: 'Siltronic Bavaria 300mm Ingot Works', country: 'Germany', lat: 48.1650, lon: 12.8280, stage: 'refining', mineral: '300mm Wafers', operators: 'Siltronic AG', globalShare: '~13% Global Wafers', chokepointRisk: 'High', severity: 3, color: '#eab308', summary: 'Europe’s sole major hyperpure 300mm monocrystalline silicon manufacturer.', source: 'EU Chips Act / Siltronic', url: 'https://digital-strategy.ec.europa.eu/' },
  { id: 'sc-ref-tokuyama', name: 'Osaka–Kawasaki Photoresists & 11N HF Chemistry', country: 'Japan', lat: 35.5308, lon: 139.7029, stage: 'refining', mineral: 'EUV Photoresists / 11N HF', operators: 'JSR / Tokyo Ohka / Stella Chemifa / Shin-Etsu', globalShare: '~85–90% EUV Resists', chokepointRisk: 'Critical', severity: 5, color: '#eab308', summary: 'Near-total global oligopoly on extreme ultraviolet photoresists and 99.999999999% pure hydrogen fluoride.', source: 'CSET / METI Japan', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-ref-ajinomoto', name: 'Kawasaki Ajinomoto Build-up Film (ABF)', country: 'Japan', lat: 35.5206, lon: 139.7347, stage: 'refining', mineral: 'ABF Substrate Film', operators: 'Ajinomoto Fine-Techno', globalShare: '~95%+ High-End ABF', chokepointRisk: 'Critical', severity: 5, color: '#eab308', summary: 'Over 95% of insulating substrate film inside NVIDIA/AMD/TPU server GPUs originates from Ajinomoto Japan.', source: 'Nikkei / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-ref-darmstadt', name: 'Darmstadt–Wiesbaden Fab Specialty Materials', country: 'Germany', lat: 49.8728, lon: 8.6512, stage: 'refining', mineral: 'Semiconductor Gases / Resists', operators: 'Merck KGaA', globalShare: 'Top-3 Photoresist & ALD', chokepointRisk: 'High', severity: 4, color: '#eab308', summary: 'Supplies thin-film ALD precursors, specialty gases, and EUV photoresist materials worldwide.', source: 'Merck Electronics / EU', url: 'https://www.emdgroup.com/' },
  { id: 'sc-ref-gumi-sk', name: 'Gumi & Ulsan HBM Wafer & Etchant Corridor', country: 'South Korea', lat: 36.1195, lon: 128.3446, stage: 'refining', mineral: '12N HF & Si Wafers', operators: 'SK Siltron / SoulBrain', globalShare: '~12% Wafers / Core Etch', chokepointRisk: 'High', severity: 3, color: '#eab308', summary: 'High-purity domestic etchant and silicon substrate cluster supporting Samsung and SK hynix HBM fabs.', source: 'MOTIE Korea', url: 'https://english.motie.go.kr/' },

  // Stage 3: Lithography, Fab Tooling & EDA/IP (#a855f7)
  { id: 'sc-tool-asml', name: 'ASML EUV & High-NA Lithography HQ', country: 'Netherlands', lat: 51.4070, lon: 5.4110, stage: 'tooling', mineral: 'EUV & High-NA Scanners', operators: 'ASML Holding', globalShare: '100% Global EUV Monopoly', chokepointRisk: 'Extreme Monopoly', severity: 5, color: '#a855f7', summary: 'Sole manufacturer on Earth capable of building Extreme Ultraviolet (13.5nm) and High-NA systems needed for sub-7nm AI accelerators.', source: 'ASML / Dutch Export Controls / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-tool-zeiss', name: 'Carl Zeiss SMT EUV Bragg Mirror Works', country: 'Germany', lat: 48.7822, lon: 10.0956, stage: 'tooling', mineral: 'EUV Multilayer Optics', operators: 'ZEISS SMT', globalShare: '100% EUV Optics', chokepointRisk: 'Extreme Monopoly', severity: 5, color: '#a855f7', summary: 'Irreplaceable sub-nanometer reflective optics module inside every ASML EUV lithography tool.', source: 'ZEISS / EU Chips Act', url: 'https://www.zeiss.com/' },
  { id: 'sc-tool-trumpf', name: 'TRUMPF CO2 EUV Laser Amplifier Works', country: 'Germany', lat: 48.8261, lon: 9.0672, stage: 'tooling', mineral: '30kW EUV Drive Lasers', operators: 'TRUMPF', globalShare: '100% EUV Drive Lasers', chokepointRisk: 'Extreme Monopoly', severity: 5, color: '#a855f7', summary: 'Pulsed high-power CO2 laser driving tin-droplet plasma inside ASML EUV light sources (San Diego Cymer + Ditzingen).', source: 'TRUMPF / SEMI', url: 'https://www.trumpf.com/' },
  { id: 'sc-tool-amat', name: 'Applied Materials Deposition & CMP HQ', country: 'United States', lat: 37.3812, lon: -121.9721, stage: 'tooling', mineral: 'PVD/CVD/CMP Tools', operators: 'Applied Materials', globalShare: '~22% Global WFE', chokepointRisk: 'Critical', severity: 5, color: '#a855f7', summary: 'Leading supplier of atomic-layer deposition, copper interconnect wiring, and chemical-mechanical planarization equipment under BIS controls.', source: 'US BIS / SEMI', url: 'https://www.bis.gov/' },
  { id: 'sc-tool-lam', name: 'Lam Research Atomic Etch Center', country: 'United States', lat: 37.4930, lon: -121.9462, stage: 'tooling', mineral: 'Plasma Etch (HBM TSV)', operators: 'Lam Research', globalShare: '~45% Etch Tools', chokepointRisk: 'Critical', severity: 5, color: '#a855f7', summary: 'Dominant supplier of through-silicon-via (TSV) deep reactive-ion etch tools required to stack 8-Hi/12-Hi HBM3E/HBM4 memory.', source: 'US BIS / SEMI', url: 'https://www.semi.org/' },
  { id: 'sc-tool-kla', name: 'KLA Metrology & Defect Inspection Hub', country: 'United States', lat: 37.4126, lon: -121.9082, stage: 'tooling', mineral: 'Wafer/Reticle Inspection', operators: 'KLA Corporation', globalShare: '>55% Process Control', chokepointRisk: 'Critical', severity: 4, color: '#a855f7', summary: 'Controls sub-angstrom reticle and wafer optical inspection tools indispensable for advanced-node yields.', source: 'SEMI / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-tool-tel', name: 'Tokyo Electron (TEL) Coater/Developer Hub', country: 'Japan', lat: 35.6725, lon: 139.7365, stage: 'tooling', mineral: 'EUV Tracks & Etch', operators: 'Tokyo Electron', globalShare: '~90% EUV Coater/Dev', chokepointRisk: 'Extreme Monopoly', severity: 5, color: '#a855f7', summary: 'Near-monopoly supplier of EUV photoresist coater/developer tracks coupled directly to ASML scanners; covered by Japanese export rules.', source: 'METI Japan / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-tool-synopsys', name: 'Synopsys & Cadence Silicon EDA Duopoly', country: 'United States', lat: 37.3924, lon: -122.0439, stage: 'tooling', mineral: 'GAA/3nm EDA Tools', operators: 'Synopsys / Cadence', globalShare: '~70% Advanced EDA', chokepointRisk: 'Critical', severity: 5, color: '#a855f7', summary: 'Software bottleneck governing physical design, verification, and Gate-All-Around (GAA) transistor sign-off for frontier AI chips.', source: 'US BIS / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-tool-arm', name: 'Arm Ltd. Sovereign Compute ISA Hub', country: 'United Kingdom', lat: 52.1828, lon: 0.1759, stage: 'tooling', mineral: 'CPU/Grace/Neoverse IP', operators: 'Arm Holdings', globalShare: '>90% Cloud ARM / Mobile', chokepointRisk: 'High', severity: 4, color: '#a855f7', summary: 'Cambridge-designed instruction set and Neoverse IP powering NVIDIA Grace Hopper/Blackwell host CPUs, AWS Graviton, and Google Axion.', source: 'UK DSIT / Arm', url: 'https://www.arm.com/' },
  { id: 'sc-tool-imec', name: 'imec Sub-2nm & High-NA R&D Hub', country: 'Belgium', lat: 50.8645, lon: 4.6808, stage: 'tooling', mineral: 'A14/A10 Pilot Fab', operators: 'imec', globalShare: 'Core Global R&D Node', chokepointRisk: 'Medium', severity: 3, color: '#a855f7', summary: 'Shared global semiconductor consortia fab testing backside power delivery and CFET transistors ahead of commercial mass production.', source: 'imec / EU Chips Act', url: 'https://www.imec-int.com/' },

  // Stage 4: Advanced Logic & HBM Foundries (#38bdf8)
  { id: 'sc-fab-tainan', name: 'TSMC Fab 18 (3nm / 5nm Frontier Logic)', country: 'Taiwan', lat: 23.1112, lon: 120.2747, stage: 'foundry', mineral: 'N3E / N4P GPUs', operators: 'TSMC', globalShare: '~90% Sub-5nm AI Logic', chokepointRisk: 'Extreme Chokepoint', severity: 5, color: '#38bdf8', summary: 'Produces virtually 100% of NVIDIA H100/B200, AMD MI300X/MI350, AWS Trainium2, and Google TPU dies.', source: 'TSMC / RAND / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-fab-hsinchu', name: 'TSMC Fab 12 / Fab 20 (2nm GAA Lead)', country: 'Taiwan', lat: 24.7736, lon: 121.0108, stage: 'foundry', mineral: 'N2 GAA / R&D', operators: 'TSMC', globalShare: 'Global N2 Lead', chokepointRisk: 'Extreme Chokepoint', severity: 5, color: '#38bdf8', summary: 'Headquarters R&D mother-fab bringing 2nm nanosheet Gate-All-Around silicon into high-volume readiness.', source: 'TSMC Annual Report', url: 'https://investor.tsmc.com/' },
  { id: 'sc-fab-kaohsiung', name: 'TSMC Fab 22 Kaohsiung (N2 Expansion)', country: 'Taiwan', lat: 22.7072, lon: 120.3125, stage: 'foundry', mineral: 'N2 Production', operators: 'TSMC', globalShare: '5x N2 Phases', chokepointRisk: 'High', severity: 4, color: '#38bdf8', summary: 'Multi-fab southern Taiwan 2nm cluster serving next-generation sovereign AI clusters.', source: 'TSMC', url: 'https://investor.tsmc.com/' },
  { id: 'sc-fab-phoenix', name: 'TSMC Arizona Fab 21 (N4 / N3 / N2)', country: 'United States', lat: 33.7825, lon: -112.1604, stage: 'foundry', mineral: 'N4P -> N2 US', operators: 'TSMC ($65B CapEx)', globalShare: 'Primary US Reshore', chokepointRisk: 'High', severity: 4, color: '#38bdf8', summary: 'Flagship US CHIPS Act $65B multi-fab investment diversifying leading-edge logic manufacturing out of Taiwan.', source: 'US CHIPS Program Office', url: 'https://www.chips.gov/' },
  { id: 'sc-fab-kumamoto', name: 'TSMC JASM Kumamoto Specialty Logic Fabs', country: 'Japan', lat: 32.8780, lon: 130.8220, stage: 'foundry', mineral: '28nm–6nm Auto/CIS', operators: 'TSMC / Sony / Denso', globalShare: 'Japan Sovereign Node', chokepointRisk: 'Medium', severity: 3, color: '#38bdf8', summary: 'METI-subsidized Japanese foundry securing automotive, robotics, and edge-AI sensor silicon.', source: 'METI Japan', url: 'https://www.meti.go.jp/' },
  { id: 'sc-fab-pyeongtaek', name: 'Samsung Pyeongtaek P3/P4 Mega-Campus', country: 'South Korea', lat: 37.0419, lon: 127.0604, stage: 'foundry', mineral: 'GAA Logic + HBM3E', operators: 'Samsung Electronics', globalShare: '~11% Logic / ~40% DRAM', chokepointRisk: 'Critical', severity: 5, color: '#38bdf8', summary: 'World’s largest single semiconductor campus fabricating both 3nm GAA logic and high-bandwidth DRAM.', source: 'MOTIE Korea / TrendForce', url: 'https://www.trendforce.com/' },
  { id: 'sc-fab-icheon', name: 'SK hynix M15X / Icheon HBM3E & HBM4 Hub', country: 'South Korea', lat: 37.2723, lon: 127.4930, stage: 'foundry', mineral: 'HBM3E / HBM4 Stack', operators: 'SK hynix', globalShare: '>50% Global HBM', chokepointRisk: 'Extreme Chokepoint', severity: 5, color: '#38bdf8', summary: 'Primary supplier of 8-Hi/12-Hi High-Bandwidth Memory dies paired on NVIDIA Blackwell & Hopper accelerators.', source: 'TrendForce / SK hynix', url: 'https://news.skhynix.com/' },
  { id: 'sc-fab-hiroshima', name: 'Micron Hiroshima 1-Beta / 1-Gamma HBM Fab', country: 'Japan', lat: 34.4328, lon: 132.7350, stage: 'foundry', mineral: 'HBM3E DRAM', operators: 'Micron Technology', globalShare: '~15–22% HBM Share', chokepointRisk: 'High', severity: 4, color: '#38bdf8', summary: 'Key non-Korean HBM3E EUV-DRAM supplier scaling next-generation AI memory capacity with METI backing.', source: 'Micron / METI Japan', url: 'https://www.micron.com/' },
  { id: 'sc-fab-chandler', name: 'Intel Fab 52 / 62 Ocotillo (18A Node)', country: 'United States', lat: 33.2422, lon: -111.8836, stage: 'foundry', mineral: 'Intel 18A Foundry', operators: 'Intel Foundry', globalShare: 'US CHIPS Anchor', chokepointRisk: 'High', severity: 4, color: '#38bdf8', summary: 'High-NA / RibbonFET / PowerVia foundry targeting AWS custom AI silicon and Microsoft Maia chips.', source: 'US CHIPS Program / Intel', url: 'https://www.chips.gov/' },
  { id: 'sc-fab-leixlip', name: 'Intel Fab 34 Leixlip (EUV Europe)', country: 'Ireland', lat: 53.3682, lon: -6.5174, stage: 'foundry', mineral: 'Intel 4 / 3 EUV', operators: 'Intel', globalShare: 'Sole EU Leading EUV', chokepointRisk: 'Medium', severity: 3, color: '#38bdf8', summary: 'First high-volume EUV logic manufacturing campus inside the European Union.', source: 'EU Chips Act / Intel', url: 'https://digital-strategy.ec.europa.eu/' },
  { id: 'sc-fab-shanghai', name: 'SMIC Shanghai SN1/Fab S2 DUV Multi-Patterning', country: 'China', lat: 31.2244, lon: 121.6130, stage: 'foundry', mineral: '7nm/5nm N+2 DUV', operators: 'SMIC / Huawei', globalShare: 'Domestic CN AI Chips', chokepointRisk: 'Sanctioned', severity: 5, color: '#38bdf8', summary: 'Produces Huawei Ascend 910B/910C AI accelerators using immersion DUV multi-patterning under US Entity List sanctions.', source: 'CSET / US BIS', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-fab-dresden', name: 'Silicon Saxony (ESMC / Infineon / GlobalFoundries)', country: 'Germany', lat: 51.1230, lon: 13.7810, stage: 'foundry', mineral: '28nm–12nm Auto/Power', operators: 'ESMC (TSMC/Bosch/Infineon/NXP)', globalShare: '~30% EU Fab Output', chokepointRisk: 'Medium', severity: 3, color: '#38bdf8', summary: 'Europe’s densest semiconductor cluster powering edge robotics, automotive ADAS, and power management.', source: 'Silicon Saxony / EU', url: 'https://www.silicon-saxony.de/' },

  // Stage 5: 2.5D CoWoS Advanced Packaging & OSAT (#10b981)
  { id: 'sc-pkg-zhunan', name: 'TSMC AP6 Zhunan & AP7 Chiayi CoWoS Mega-Hub', country: 'Taiwan', lat: 24.6961, lon: 120.8920, stage: 'packaging', mineral: 'CoWoS-L / SoIC', operators: 'TSMC', globalShare: '~75–85% AI 2.5D Pkg', chokepointRisk: 'Extreme Bottleneck', severity: 5, color: '#10b981', summary: 'Most acute physical bottleneck in global GPU production: bonding logic dies + HBM3E stacks onto silicon interposers.', source: 'TSMC / TrendForce', url: 'https://www.trendforce.com/' },
  { id: 'sc-pkg-kaohsiung', name: 'ASE Group Kaohsiung VIPack & OSAT Campus', country: 'Taiwan', lat: 22.7192, lon: 120.3025, stage: 'packaging', mineral: 'FoCoS / OSAT', operators: 'ASE Technology Holding', globalShare: '~30% Global OSAT', chokepointRisk: 'Critical', severity: 4, color: '#10b981', summary: 'World’s largest outsourced semiconductor assembly and test provider expanding 2.5D/chiplet packaging.', source: 'ASE / SEMI', url: 'https://www.aseglobal.com/' },
  { id: 'sc-pkg-penang', name: 'Penang & Kulim OSAT / Test Corridor', country: 'Malaysia', lat: 5.3117, lon: 100.2819, stage: 'packaging', mineral: 'OSAT / Assembly / Photonics', operators: 'Intel / Micron / ASE / Infineon / TF-AMD', globalShare: '~13% Global Backend', chokepointRisk: 'High', severity: 4, color: '#10b981', summary: 'Major Southeast Asian test, packaging, and GPU/CPU substrate hub critical for Western "China+1" supply resilience.', source: 'MIDA Malaysia / Financial Times', url: 'https://www.mida.gov.my/' },
  { id: 'sc-pkg-incheon', name: 'Amkor K5 Songdo & Hanmi TC-Bonder Hub', country: 'South Korea', lat: 37.3827, lon: 126.6438, stage: 'packaging', mineral: '2.5D Interposer / TC Bond', operators: 'Amkor / Hanmi Semi', globalShare: 'Core HBM Bonder', chokepointRisk: 'Critical', severity: 4, color: '#10b981', summary: 'Hosts Amkor’s flagship SiP/2.5D facility and Hanmi thermo-compression bonders indispensable for HBM3E yields.', source: 'Amkor / SEMI', url: 'https://amkor.com/' },
  { id: 'sc-pkg-peoria-az', name: 'Amkor Arizona $2B Advanced Packaging Campus', country: 'United States', lat: 33.6660, lon: -112.2800, stage: 'packaging', mineral: 'US CoWoS-Class OSAT', operators: 'Amkor (Apple/TSMC Anchor)', globalShare: 'US First High-Vol OSAT', chokepointRisk: 'High', severity: 3, color: '#10b981', summary: 'Closes US domestic packaging gap so TSMC Arizona wafers need not fly back to Taiwan before US data-center rack integration.', source: 'US CHIPS Program', url: 'https://www.chips.gov/' },
  { id: 'sc-pkg-singapore-osat', name: 'Woodlands–Tampines Advanced Packaging & Silicon Photonics', country: 'Singapore', lat: 1.4360, lon: 103.7865, stage: 'packaging', mineral: 'Optical / Co-Packaged Silicon', operators: 'GlobalFoundries / UMC / Micron / STATS ChipPAC', globalShare: '~11% Global Fab/OSAT', chokepointRisk: 'High', severity: 3, color: '#10b981', summary: 'ASEAN hub for HBM/NAND testing, Silicon Photonics optical switches, and RF chips.', source: 'EDB Singapore', url: 'https://www.edb.gov.sg/' },

  // Stage 6: AI Server Racks & Optical Interconnects (#6366f1)
  { id: 'sc-asm-taoyuan', name: 'Taoyuan–Taipei Hyperscale AI Rack ODM Hub', country: 'Taiwan', lat: 25.0478, lon: 121.2580, stage: 'assembly', mineral: 'GB200 NVL72 Racks', operators: 'Foxconn / Quanta / Wistron / Wiwynn', globalShare: '>80% AI Server Motherboards', chokepointRisk: 'Critical', severity: 4, color: '#6366f1', summary: 'Builds the majority of liquid-cooled NVLink/PCIe GPU baseboards and HGX/MGX compute trays shipped globally.', source: 'TrendForce / Digitimes', url: 'https://www.trendforce.com/' },
  { id: 'sc-asm-suzhou', name: 'Suzhou–Wuhan 800G/1.6T Optical Transceiver Belt', country: 'China', lat: 31.3000, lon: 120.6200, stage: 'assembly', mineral: '800G/1.6T Optics', operators: 'Innolight / Eoptolink / Accelink', globalShare: '>50% Datacenter Optics', chokepointRisk: 'High', severity: 4, color: '#6366f1', summary: 'Supplies over half of 800G optical transceivers wiring multi-100k GPU clusters, rapidly expanding parallel lines into Thailand (Rayong).', source: 'LightCounting / CSET', url: 'https://cset.georgetown.edu/' },
  { id: 'sc-asm-guadalajara', name: 'Guadalajara USMCA AI Server Final Assembly', country: 'Mexico', lat: 20.6597, lon: -103.3496, stage: 'assembly', mineral: 'Liquid-Cooled Racks', operators: 'Foxconn / HPE / Jabil / Flex', globalShare: 'Primary US Nearshore ODM', chokepointRisk: 'Medium', severity: 3, color: '#6366f1', summary: 'Nearshored Foxconn & ODM liquid-cooled supercomputer rack integration serving US hyperscale clusters.', source: 'Reuters / Foxconn', url: 'https://www.reuters.com/' },
  { id: 'sc-asm-houston', name: 'Houston–Austin US AI Supercomputer Integration', country: 'United States', lat: 29.7604, lon: -95.3698, stage: 'assembly', mineral: 'US NVL72 / Superpods', operators: 'Foxconn / Wistron / Dell / Supermicro', globalShare: 'US Onshore Integration', chokepointRisk: 'Medium', severity: 3, color: '#6366f1', summary: 'Onshore North American Blackwell NVL72 & liquid-cooled rack assembly serving Abilene, Memphis, and New Carlisle.', source: 'NVIDIA / Reuters', url: 'https://www.reuters.com/' },

  // Stage 7: End-of-Life AI Hardware & Global E-Waste (#f43f5e)
  { id: 'sc-ew-agbogbloshie', name: 'Accra / Greater Accra Transboundary E-Waste Sink', country: 'Ghana', lat: 5.5502, lon: -0.2255, stage: 'ewaste', mineral: 'PCB / Precious Metals Recovery', operators: 'Informal Scrap Collectors', globalShare: 'Major West Africa Sink', chokepointRisk: 'Env & Health Crisis', severity: 5, color: '#f43f5e', summary: 'Transboundary flows of discarded IT, telecom, and server hardware burned/leached for copper and gold under severe toxic exposure.', source: 'UN UNITAR Global E-Waste Monitor 2024', url: 'https://ewastemonitor.info/' },
  { id: 'sc-ew-lagos', name: 'Lagos Alaba / Ikeja Used Server & E-Waste Hub', country: 'Nigeria', lat: 6.4631, lon: 3.1920, stage: 'ewaste', mineral: 'Secondary IT Hardware', operators: 'Informal & Basel Re-Export Hubs', globalShare: 'Top Africa Import Node', chokepointRisk: 'Basel Violation Risk', severity: 4, color: '#f43f5e', summary: 'High volume of mislabeled EU/US secondhand server and IT shipments ending in informal acid stripping.', source: 'Basel Action Network / UNITAR', url: 'https://ewastemonitor.info/' },
  { id: 'sc-ew-moradabad', name: 'Moradabad & Seelampur PCB Acid-Leaching Belt', country: 'India', lat: 28.8386, lon: 78.7733, stage: 'ewaste', mineral: 'Gold / Palladium / Copper', operators: 'Informal Clusters', globalShare: 'India ~3.2 Mt/yr E-Waste', chokepointRisk: 'Occupational Toxicity', severity: 4, color: '#f43f5e', summary: 'Informal recovery of trace gold/palladium from obsolete boards and cloud peripherals with minimal formal EPR enforcement.', source: 'UN UNITAR / Toxics Link', url: 'https://ewastemonitor.info/' },
  { id: 'sc-ew-taizhou', name: 'Taizhou / Guiyu Formalized Circular Recycling Park', country: 'China', lat: 28.6561, lon: 121.4207, stage: 'ewaste', mineral: 'Hydrometallurgical PCB', operators: 'Licensed Circular Parks', globalShare: 'Formalized Post-2018 Ban', chokepointRisk: 'Circular Model', severity: 3, color: '#f43f5e', summary: 'Following China’s 2018 foreign e-waste import ban, legacy informal regions consolidated into industrial PCB/lithium recovery parks.', source: 'UN UNITAR / UNEP', url: 'https://ewastemonitor.info/' }
];

const NODE_MAP = Object.fromEntries(SUPPLY_CHAIN_NODES.map((n) => [n.id, [n.lat, n.lon]]));
const makeArc = (fromId, toId, name, color) => ({
  from: NODE_MAP[fromId],
  to: NODE_MAP[toId],
  name,
  color
});

export const SUPPLY_CHAIN_ARCS = [
  // Extraction -> Refining (#f59e0b / #eab308)
  makeArc('sc-ext-spruce-pine', 'sc-ref-shirakawa', 'High-Purity Quartz (Spruce Pine NC -> Japan 300mm Crucibles)', '#f59e0b'),
  makeArc('sc-ext-spruce-pine', 'sc-ref-burghausen', 'HPQ Crucible Feed (Spruce Pine NC -> Siltronic Bavaria)', '#f59e0b'),
  makeArc('sc-ext-spruce-pine', 'sc-ref-hsinchu-gw', 'HPQ Crucible Feed (Spruce Pine NC -> GlobalWafers Taiwan)', '#f59e0b'),
  makeArc('sc-ext-san-luis-f', 'sc-ref-tokuyama', 'Fluorspar -> Ultrapure 11N HF Etchant (Mexico -> Japan)', '#f59e0b'),
  makeArc('sc-ext-kolwezi', 'sc-ref-yibin', 'DRC Cobalt -> Chinese Battery/Grid Refining (Kolwezi -> Yibin)', '#f59e0b'),
  makeArc('sc-ext-atacama', 'sc-ref-yibin', 'Andean Lithium Brine -> Chemical Refining (Atacama -> Sichuan)', '#f59e0b'),
  makeArc('sc-ext-atacama', 'sc-ref-gumi-sk', 'Lithium Refining Corridor (Chile -> South Korea)', '#f59e0b'),
  makeArc('sc-ext-greenbushes', 'sc-ref-kwinana', 'Spodumene -> Allied LiOH Refinery (Greenbushes -> Kwinana)', '#eab308'),
  makeArc('sc-ext-greenbushes', 'sc-ref-yibin', 'Spodumene -> Chemical Conversion (WA -> Sichuan)', '#f59e0b'),
  makeArc('sc-ext-mount-weld', 'sc-ref-kuantan', 'Rare-Earth Concentrates (Mount Weld -> Kuantan Malaysia)', '#eab308'),
  makeArc('sc-ext-kachin', 'sc-ref-yibin', 'Heavy Rare Earths (Kachin -> Chinese Separators)', '#f59e0b'),
  makeArc('sc-ext-guangxi-ga', 'sc-ref-tokuyama', 'Refined Ga/Ge Specialty Export Corridor', '#eab308'),

  // Refining & Chemicals -> Tooling / Foundries (#eab308 / #a855f7)
  makeArc('sc-ext-bayan-obo', 'sc-tool-asml', 'NdFeB Precision Actuator Magnets -> ASML EUV Stage', '#f59e0b'),
  makeArc('sc-tool-zeiss', 'sc-tool-asml', 'ZEISS EUV Bragg Mirrors (Oberkochen -> Veldhoven)', '#a855f7'),
  makeArc('sc-tool-trumpf', 'sc-tool-asml', 'TRUMPF 30kW CO2 EUV Drive Laser (Ditzingen -> Veldhoven)', '#a855f7'),
  makeArc('sc-ref-tokuyama', 'sc-fab-tainan', 'EUV Photoresists & 11N HF (Japan -> TSMC Tainan)', '#eab308'),
  makeArc('sc-ref-tokuyama', 'sc-fab-pyeongtaek', 'EUV Resists & High-Purity Etchants (Japan -> Samsung Pyeongtaek)', '#eab308'),
  makeArc('sc-ref-shirakawa', 'sc-fab-tainan', '300mm Epitaxial Silicon Wafers (Japan -> TSMC Tainan)', '#eab308'),
  makeArc('sc-ref-shirakawa', 'sc-fab-phoenix', '300mm EPI Wafers (Japan -> TSMC Arizona)', '#eab308'),
  makeArc('sc-ref-hsinchu-gw', 'sc-fab-tainan', '300mm Wafers (Hsinchu -> Tainan)', '#eab308'),
  makeArc('sc-ref-darmstadt', 'sc-fab-tainan', 'Merck Specialty ALD Precursors (Germany -> Taiwan)', '#eab308'),
  makeArc('sc-ref-burghausen', 'sc-fab-leixlip', 'Siltronic European 300mm Wafers (Bavaria -> Ireland)', '#eab308'),

  // Tooling & EDA -> Leading-Edge Fabs (#a855f7)
  makeArc('sc-tool-asml', 'sc-fab-tainan', 'ASML EUV Systems (Veldhoven -> TSMC Tainan)', '#a855f7'),
  makeArc('sc-tool-asml', 'sc-fab-pyeongtaek', 'ASML EUV Systems (Veldhoven -> Samsung Pyeongtaek)', '#a855f7'),
  makeArc('sc-tool-asml', 'sc-fab-icheon', 'ASML EUV for 1b/1c HBM DRAM (Veldhoven -> SK hynix)', '#a855f7'),
  makeArc('sc-tool-asml', 'sc-fab-phoenix', 'ASML EUV Systems (Veldhoven -> TSMC Arizona)', '#a855f7'),
  makeArc('sc-tool-asml', 'sc-fab-chandler', 'ASML High-NA / EUV (Veldhoven -> Intel 18A Arizona)', '#a855f7'),
  makeArc('sc-tool-asml', 'sc-fab-leixlip', 'ASML EUV Systems (Veldhoven -> Intel Fab 34 Ireland)', '#a855f7'),
  makeArc('sc-tool-tel', 'sc-fab-tainan', 'TEL EUV Tracks & Etch (Tokyo -> Tainan)', '#a855f7'),
  makeArc('sc-tool-amat', 'sc-fab-tainan', 'Applied Materials Deposition/CMP (Santa Clara -> Tainan)', '#a855f7'),
  makeArc('sc-tool-lam', 'sc-fab-icheon', 'Lam TSV Deep Etch for HBM (Fremont -> SK hynix)', '#a855f7'),
  makeArc('sc-tool-kla', 'sc-fab-tainan', 'KLA Sub-Angstrom Inspection (Milpitas -> Tainan)', '#a855f7'),
  makeArc('sc-tool-synopsys', 'sc-fab-tainan', 'Synopsys/Cadence Sign-Off GDSII (Silicon Valley -> TSMC)', '#a855f7'),
  makeArc('sc-tool-arm', 'sc-fab-tainan', 'Arm Neoverse Grace/Axion Architecture IP (Cambridge -> TSMC)', '#a855f7'),

  // Foundries + HBM + ABF + Tin -> Advanced Packaging (#38bdf8 / #10b981)
  makeArc('sc-fab-tainan', 'sc-pkg-zhunan', 'Unpackaged 3nm/4nm AI GPU Dies (Tainan -> Zhunan CoWoS)', '#38bdf8'),
  makeArc('sc-fab-icheon', 'sc-pkg-zhunan', 'SK hynix HBM3E/HBM4 Stacks (Icheon -> TSMC CoWoS)', '#38bdf8'),
  makeArc('sc-fab-hiroshima', 'sc-pkg-zhunan', 'Micron HBM3E Stacks (Hiroshima -> TSMC CoWoS)', '#38bdf8'),
  makeArc('sc-fab-pyeongtaek', 'sc-pkg-incheon', 'Samsung Logic/HBM Dies -> Korean 2.5D Packaging', '#38bdf8'),
  makeArc('sc-ref-ajinomoto', 'sc-pkg-zhunan', 'Ajinomoto Build-up Film (Kawasaki -> TSMC/ASE Substrates)', '#eab308'),
  makeArc('sc-ext-bangka', 'sc-pkg-penang', 'Refined Solder Tin (Bangka Indonesia -> Penang OSAT)', '#f59e0b'),
  makeArc('sc-fab-phoenix', 'sc-pkg-peoria-az', 'US Wafer Output -> Amkor Peoria 2.5D Packaging', '#38bdf8'),
  makeArc('sc-fab-leixlip', 'sc-pkg-penang', 'European Dies -> ASEAN Final Assembly & Test (Penang)', '#38bdf8'),

  // Packaging -> AI Server Rack Integration & Optics (#10b981 / #6366f1)
  makeArc('sc-pkg-zhunan', 'sc-asm-taoyuan', 'CoWoS-Packaged B200/MI300 Packages -> Taiwan Rack ODMs', '#10b981'),
  makeArc('sc-pkg-kaohsiung', 'sc-asm-taoyuan', 'ASE Tested Modules -> Taoyuan NVL72 Assembly', '#10b981'),
  makeArc('sc-pkg-penang', 'sc-asm-guadalajara', 'Packaged AI ASICs & Switches -> Guadalajara USMCA Racks', '#10b981'),
  makeArc('sc-pkg-peoria-az', 'sc-asm-houston', 'US-Packaged AI Chips -> Houston Supercomputer Integration', '#10b981'),
  makeArc('sc-asm-suzhou', 'sc-asm-guadalajara', '800G/1.6T Optical Transceivers (Suzhou -> Nearshore AI Racks)', '#6366f1'),

  // Server Racks -> End-of-Life E-Waste & Copper Sinks (#f43f5e)
  makeArc('sc-asm-houston', 'sc-ew-lagos', 'Decommissioned Secondary IT/Server Scrap Flow (North America -> Lagos)', '#f43f5e'),
  makeArc('sc-asm-taoyuan', 'sc-ew-agbogbloshie', 'Legacy Hardware & Transboundary E-Waste Burden (Global -> Accra)', '#f43f5e'),
  makeArc('sc-asm-taoyuan', 'sc-ew-moradabad', 'Discarded Boards -> South Asian Informal Recovery', '#f43f5e')
];

export const BIOMETRIC_WELFARE_NODES = [
  { id: 'bio-syri-nl', name: 'SyRI & Toeslagen Algorithmic Welfare Fraud Rulings', country: 'Netherlands', lat: 52.0705, lon: 4.3007, domain: 'Algorithmic Welfare', deployingAuthority: 'Dutch Ministry of Social Affairs / Tax Auth', affectedPopulation: '26,000+ families impacted', status: 'Struck Down & Fined', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Landmark Hague court invalidation of SyRI profiling plus €2.75M DPA penalty for discriminatory child-benefit risk scoring.', source: 'Amnesty International / NJCM', url: 'https://www.amnesty.org/' },
  { id: 'bio-robodebt-au', name: 'Robodebt Automated Income-Averaging Failure', country: 'Australia', lat: -35.2809, lon: 149.1300, domain: 'Algorithmic Welfare', deployingAuthority: 'Services Australia', affectedPopulation: '443,000 unlawful debt notices', status: 'Abolished / Royal Commission', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Royal Commission condemned unlawful automated welfare debt recovery that generated A$1.76B in false claims.', source: 'Australian Robodebt Royal Commission', url: 'https://robodebt.royalcommission.gov.au/' },
  { id: 'bio-serbia-soc', name: 'Serbia Social Card Algorithmic Exclusion Registry', country: 'Serbia', lat: 44.7866, lon: 20.4489, domain: 'Algorithmic Welfare', deployingAuthority: 'Ministry of Labour & Social Policy', affectedPopulation: '22,000+ benefits cut', status: 'Challenged / Active', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Cross-database automated scoring stripped social assistance from Roma and low-income citizens without human appeal.', source: 'Amnesty International / A11 Initiative', url: 'https://www.amnesty.org/' },
  { id: 'bio-dk-gladsaxe', name: 'Denmark Early-Intervention Child-Risk Scoring', country: 'Denmark', lat: 55.7335, lon: 12.4885, domain: 'Algorithmic Welfare', deployingAuthority: 'Municipalities / ATP', affectedPopulation: 'Municipal youth cohorts', status: 'Suspended / Restricted', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Predictive municipal scoring combining parental mental health and unemployment records sparked GDPR revocation.', source: 'AlgorithmWatch Automating Society', url: 'https://algorithmwatch.org/en/' },
  { id: 'bio-es-bosco', name: 'BOSCO Automated Energy-Subsidy Algorithm', country: 'Spain', lat: 40.4168, lon: -3.7038, domain: 'Algorithmic Welfare', deployingAuthority: 'Ministry for Ecological Transition', affectedPopulation: '1M+ vulnerable households', status: 'Transparency Litigation', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Civio litigation over closed source code wrongly rejecting eligible electricity subsidy applicants.', source: 'Civio Foundation / Supreme Court Spain', url: 'https://civio.es/' },
  { id: 'bio-uk-dwp', name: 'DWP Universal Credit Algorithmic Fraud Triage', country: 'United Kingdom', lat: 51.5007, lon: -0.1246, domain: 'Algorithmic Welfare', deployingAuthority: 'Department for Work and Pensions', affectedPopulation: '6M+ claimants screened', status: 'Active (FOI Scrutinized)', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Machine-learning risk scoring triggers payment freezes; disability & age bias audits revealed via Public Law Project FOI.', source: 'Public Law Project / Amnesty UK', url: 'https://publiclawproject.org.uk/' },
  { id: 'bio-fr-caf', name: 'CNAF Algorithmic Welfare Suspicion Scoring', country: 'France', lat: 48.8566, lon: 2.3522, domain: 'Algorithmic Welfare', deployingAuthority: 'Caisse Nationale des Allocations Familiales', affectedPopulation: '13.5M beneficiary households', status: 'Conseil d’État Challenge', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'La Quadrature du Net filed Supreme Administrative Court challenge showing scoring penalizes unstable income and disabilities.', source: 'La Quadrature du Net / Lighthouse Reports', url: 'https://www.laquadrature.net/' },
  { id: 'bio-at-ams', name: 'Austria AMS Labor-Market Chances Algorithm', country: 'Austria', lat: 48.2082, lon: 16.3738, domain: 'Algorithmic Welfare', deployingAuthority: 'Public Employment Service (AMS)', affectedPopulation: 'All registered jobseekers', status: 'Paused (EU AI Act High-Risk)', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Assigned jobseekers lower retraining priority based on gender, caregiving duties, and nationality proxies.', source: 'AlgorithmWatch / Austrian DPA', url: 'https://algorithmwatch.org/en/' },
  { id: 'bio-us-allegheny', name: 'Allegheny Family Screening Tool (AFST)', country: 'United States', lat: 40.4406, lon: -79.9959, domain: 'Algorithmic Welfare', deployingAuthority: 'Allegheny County DHS', affectedPopulation: 'Child-welfare hotline calls', status: 'DOJ ADA Investigation Settlement', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Predictive child-neglect risk score found by DOJ investigation to discriminate against parents with disabilities.', source: 'AP / US DOJ Civil Rights Division', url: 'https://www.justice.gov/' },
  { id: 'bio-us-michigan', name: 'Michigan MiDAS Unemployment Fraud AI', country: 'United States', lat: 42.7325, lon: -84.5555, domain: 'Algorithmic Welfare', deployingAuthority: 'Michigan UIA', affectedPopulation: '40,000+ false fraud findings', status: '$20M+ Settlement / Replaced', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Automated adjudication system exhibited a ~93% error rate falsely accusing tens of thousands of unemployed residents.', source: 'NYU AI Now / Michigan Courts', url: 'https://ainowinstitute.org/' },
  { id: 'bio-in-aadhaar', name: 'Aadhaar Biometric Welfare Authentication Gateways', country: 'India', lat: 28.6139, lon: 77.2090, domain: 'Biometric Welfare', deployingAuthority: 'UIDAI / State Ration Boards', affectedPopulation: '1.3B+ biometric IDs', status: 'Active / SC Guardrails', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Mandatory fingerprint/iris matching for rural food rations & NREGA wages causes exclusions among manual laborers with worn fingerprints.', source: 'Internet Freedom Foundation / LibTech', url: 'https://internetfreedom.in/' },
  { id: 'bio-ke-maisha', name: 'Kenya Maisha Namba & Huduma Biometric Exclusion', country: 'Kenya', lat: -1.2921, lon: 36.8219, domain: 'Digital ID & Exclusion', deployingAuthority: 'State Dept. of Immigration', affectedPopulation: 'Nubian & Somali Kenyan minorities', status: 'Constitutional Court Review', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Digital ID modernization faces legal scrutiny over historical statelessness, biometric vetting barriers, and lack of DPIA.', source: 'CIPESA / Nubian Rights Forum', url: 'https://cipesa.org/' },
  { id: 'bio-za-sassa', name: 'SASSA Biometric Facial Recognition Grant Verification', country: 'South Africa', lat: -25.7479, lon: 28.2293, domain: 'Biometric Welfare', deployingAuthority: 'SA Social Security Agency', affectedPopulation: '19M+ grant recipients', status: 'Civil Society Audit', severity: 3, color: '#facc15', ethicsKind: 'biometric_welfare', summary: 'Remote facial liveness checks block elderly and rural social-grant recipients lacking smartphones or stable connectivity.', source: 'Black Sash / Research ICT Africa', url: 'https://researchictafrica.net/' },
  { id: 'bio-ug-ndira', name: 'Uganda Ndaga Muntu Biometric Welfare Lockout', country: 'Uganda', lat: 0.3476, lon: 32.5825, domain: 'Digital ID & Exclusion', deployingAuthority: 'NIRA Uganda', affectedPopulation: 'Millions unregistered elderly/poor', status: 'Active (Lawsuit Filed)', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Mandatory National ID linkage cut excluded older citizens and women from COVID relief and senior cash transfers.', source: 'ISER Uganda / NYU CHRGJ', url: 'https://chrgj.org/' },
  { id: 'bio-eu-etias', name: 'EU Entry/Exit (EES), Eurodac & Borders Risk Profiling', country: 'European Union', lat: 50.8503, lon: 4.3517, domain: 'Biometric Borders', deployingAuthority: 'eu-LISA / Frontex', affectedPopulation: 'All non-EU border crossers', status: 'Rollout 2025–2026', severity: 4, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'Interoperable facial/fingerprint border databases paired with AI screening exempted from major EU AI Act safeguards.', source: 'EDRi / Statewatch', url: 'https://edri.org/' },
  { id: 'bio-gr-centaur', name: 'Aegean Islands Centaur Biometric Camp Surveillance', country: 'Greece', lat: 37.7549, lon: 26.9778, domain: 'Biometric Borders', deployingAuthority: 'Hellenic Ministry of Migration', affectedPopulation: 'Closed-controlled island camps', status: 'DPA Fined €175k / Active', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'EU-funded behavioral analytics cameras, drones, and turnstile biometrics inside Samos/Lesvos asylum camps fined by Greek DPA.', source: 'Homo Digitalis / Solomon / EDRi', url: 'https://www.homodigitalis.gr/' },
  { id: 'bio-hu-iborder', name: 'Hungarian / EU iBorderCtrl AI Lie-Detection Pilot', country: 'Hungary', lat: 46.2530, lon: 20.1414, domain: 'Biometric Borders', deployingAuthority: 'Hungarian Police / Horizon 2020', affectedPopulation: 'Serbia–Hungary border travelers', status: 'Banned Under EU AI Act Art. 5', severity: 4, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'Automated micro-expression deception scoring piloted at EU external borders, later barred by EU AI Act emotion-recognition prohibitions.', source: 'The Intercept / EDRi / MEP Breyer', url: 'https://edri.org/' },
  { id: 'bio-us-cbp', name: 'US–Mexico CBP One Facial Matching & Autonomous Towers', country: 'United States', lat: 31.7619, lon: -106.4850, domain: 'Biometric Borders', deployingAuthority: 'US CBP / Anduril', affectedPopulation: 'Asylum seekers along US-MX border', status: 'Active Deployment', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Autonomous Lattice sensor towers and mandatory dark-skin-error-prone facial recognition gates conditioning asylum access.', source: 'EFF / Amnesty International', url: 'https://www.eff.org/' },
  { id: 'bio-uk-home', name: 'UK Home Office GPS Ankle Tags & Facial Check-In', country: 'United Kingdom', lat: 51.4947, lon: -0.1353, domain: 'Biometric Borders', deployingAuthority: 'UK Home Office', affectedPopulation: 'Migrants on immigration bail', status: 'ICO Warning Issued (2024)', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'UK Information Commissioner reprimanded excessive continuous GPS tracking and automated facial check-ins on non-detained migrants.', source: 'Privacy International / ICO UK', url: 'https://privacyinternational.org/' },
  { id: 'bio-ps-redwolf', name: 'Occupied West Bank "Red Wolf" & Blue Wolf Facial Checkpoints', country: 'Palestine', lat: 31.5326, lon: 35.0998, domain: 'Military Biometrics', deployingAuthority: 'Israeli Defense Forces (IDF)', affectedPopulation: 'Palestinians in Hebron / West Bank', status: 'Active', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Automated checkpoint facial recognition database auto-enrolling residents without consent and restricting movement by color-coded threat tiers.', source: 'Amnesty International (Automated Apartheid)', url: 'https://www.amnesty.org/en/latest/research/2023/05/israel-opt-automated-apartheid/' },
  { id: 'bio-af-biometrics', name: 'Abandoned Biometric Databases & Taliban Capture', country: 'Afghanistan', lat: 34.5553, lon: 69.2075, domain: 'Biometric Risk', deployingAuthority: 'Post-2021 Non-State Seizure', affectedPopulation: 'Afghan civil servants / NGO staff', status: 'Severe Breach Risk', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Irrevocable iris, fingerprint, and payroll biometric databases built over two decades captured during the 2021 regime collapse.', source: 'Human Rights Watch', url: 'https://www.hrw.org/' },
  { id: 'bio-mm-psms', name: 'Myanmar Military "PSMS" Urban Biometric Checkpoints', country: 'Myanmar', lat: 16.8409, lon: 96.1735, domain: 'Mass Biometric Surveillance', deployingAuthority: 'SAC Military Junta', affectedPopulation: 'Yangon / Mandalay residents', status: 'Active Expansion', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'AI facial-matching checkpoints linked to junta blacklists used to detain pro-democracy activists at city transit hubs.', source: 'Myanmar Internet Project / Access Now', url: 'https://www.accessnow.org/' },
  { id: 'bio-cn-xinjiang', name: 'Xinjiang IJOP Predictive & Gait/Voice Biometrics', country: 'China', lat: 43.8256, lon: 87.6168, domain: 'Mass Biometric Surveillance', deployingAuthority: 'Xinjiang PSB / Hikvision / iFlytek', affectedPopulation: 'Uyghur & Turkic minorities', status: 'Active (Sanctioned)', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Multi-modal Integrated Joint Operations Platform combining DNA, voiceprints, iris scans, and predictive behavioral alerts.', source: 'HRW / UN OHCHR', url: 'https://www.hrw.org/' },
  { id: 'bio-cn-netid', name: 'China National Cyberspace Virtual ID & FRT Rules', country: 'China', lat: 39.9042, lon: 116.4074, domain: 'Digital Identity', deployingAuthority: 'MPS / CAC', affectedPopulation: '1B+ internet users', status: '2025 Commercial FRT Limits + NetID', severity: 4, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'Centralizes online authentication under state NetID infrastructure while restricting non-essential private-sector hotel/retail face scans.', source: 'DigiChina Stanford', url: 'https://digichina.stanford.edu/' },
  { id: 'bio-ru-sfera', name: 'Moscow "Sfera" Metro & Draft-Evasion FRT Grid', country: 'Russia', lat: 55.7558, lon: 37.6173, domain: 'Mass Biometric Surveillance', deployingAuthority: 'Moscow DIT / MVD', affectedPopulation: '200,000+ metro/street cameras', status: 'Active Wartime Enforcement', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Real-time citywide NtechLab facial recognition flagging anti-war protesters and conscription evaders in Moscow metro stations.', source: 'OVD-Info / Roskomsvoboda', url: 'https://ovdinfo.org/' },
  { id: 'bio-ir-hijab', name: 'Iran License-Plate & Facial AI Moral Policing', country: 'Iran', lat: 35.6892, lon: 51.3890, domain: 'Mass Biometric Surveillance', deployingAuthority: 'Law Enforcement Command (FARAJA)', affectedPopulation: 'Urban traffic & public spaces', status: 'Active', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Automated roadside cameras, drones, and ANPR algorithms flagging women over mandatory dress rules with SMS fines & vehicle impoundment.', source: 'UN Fact-Finding Mission / Article 19', url: 'https://www.ohchr.org/' },
  { id: 'bio-ae-falcon', name: 'Abu Dhabi / Dubai Urban Predictive Camera Grid', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, domain: 'Biometric Surveillance', deployingAuthority: 'Dubai Police ("Oyoon") / ICP', affectedPopulation: 'Emirate-wide metro/airport', status: 'Active', severity: 4, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'Extensive "Oyoon" automated video analytics and iris-scan border gates integrated across transit networks.', source: 'Carnegie AI Global Surveillance Index', url: 'https://carnegieendowment.org/' },
  { id: 'bio-br-salvador', name: 'Bahia & Rio de Janeiro Carnival Facial Recognition', country: 'Brazil', lat: -12.9714, lon: -38.5014, domain: 'Policing Biometrics', deployingAuthority: 'State SSP Policing Agencies', affectedPopulation: 'Millions of public event attendees', status: 'Active / Racially Disproportionate', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Civil society audits show >90% of people arrested via Bahia public facial recognition alerts were Black citizens.', source: 'Rede de Observatórios da Segurança / Panóptico', url: 'https://opanoptico.com.br/' },
  { id: 'bio-ar-caba', name: 'Buenos Aires CABA Fugitive FRT Unconstitutional Ruling', country: 'Argentina', lat: -34.6037, lon: -58.3816, domain: 'Policing Biometrics', deployingAuthority: 'Buenos Aires Ministry of Security', affectedPopulation: 'City metro commuters', status: 'Struck Down (2022–2024)', severity: 3, color: '#10b981', ethicsKind: 'biometric_welfare', summary: 'Federal court declared Buenos Aires automated biometric watchlists unconstitutional after illegal lookups of journalists and judges.', source: 'ADC Argentina / Derechos Digitales', url: 'https://www.derechosdigitales.org/' },
  { id: 'bio-uy-sict', name: 'Uruguay Public-Space Automated Video Surveillance', country: 'Uruguay', lat: -34.9011, lon: -56.1645, domain: 'Policing Biometrics', deployingAuthority: 'Ministry of Interior (El Guardián)', affectedPopulation: 'Urban corridors & borders', status: 'Parliamentary Guardrails', severity: 3, color: '#facc15', ethicsKind: 'biometric_welfare', summary: 'Nationwide facial/ANPR camera networks scrutinized by OBSERVACOM and Datysoc over facial-matching error rates.', source: 'Datysoc / Access Now', url: 'https://www.accessnow.org/' },
  { id: 'bio-mx-curp', name: 'Mexico Biometric CURP & Border/Transit Surveillance', country: 'Mexico', lat: 19.4326, lon: -99.1332, domain: 'Biometric ID & Police', deployingAuthority: 'RENAPO / Guardia Nacional', affectedPopulation: '128M+ registry records', status: 'Active Expansion', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Expansion of biometric databases across civil registry, banking, and migration corridors alongside weak transparency enforcement.', source: 'R3D Mexico', url: 'https://r3d.mx/' },
  { id: 'bio-ke-worldcoin', name: 'Worldcoin / Orb Iris-Scanning Suspension & Audit', country: 'Kenya', lat: -1.3000, lon: 36.8500, domain: 'Commercial Biometrics', deployingAuthority: 'ODPC Kenya / Tools for Humanity', affectedPopulation: '350,000+ iris scans collected', status: 'Regulatory Audit / Cleared w/ Conditions', severity: 4, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'Kenya ODPC initially suspended iris scanning over coercive financial incentives without valid GDPR-grade consent.', source: 'ODPC Kenya / CIPESA', url: 'https://www.odpc.go.ke/' },
  { id: 'bio-jp-mynumber', name: 'Japan MyNumber Health-Card Linkage Errors', country: 'Japan', lat: 35.6762, lon: 139.6503, domain: 'Digital Identity', deployingAuthority: 'Digital Agency Japan', affectedPopulation: '100M+ ID holders', status: 'Systemic Audit Reform', severity: 3, color: '#facc15', ethicsKind: 'biometric_welfare', summary: 'Thousands of mis-linked medical, bank, and disability welfare files discovered during rapid national Digital ID consolidation.', source: 'Digital Agency Japan / Kyodo News', url: 'https://www.digital.go.jp/en/' },
  { id: 'bio-sg-trace', name: 'Singapore National Biometric Port & Smart Nation', country: 'Singapore', lat: 1.3521, lon: 103.8198, domain: 'Digital ID & Sensors', deployingAuthority: 'GovTech / ICA Singapore', affectedPopulation: 'Passport-less Changi & Tuas gates', status: 'Operational', severity: 3, color: '#38bdf8', ethicsKind: 'biometric_welfare', summary: 'Near-universal biometric immigration clearance and Singpass face verification governed under PDPA public-sector exemptions.', source: 'ICA Singapore / Carnegie', url: 'https://www.ica.gov.sg/' },
  { id: 'bio-kr-incheon', name: 'Incheon Airport Biometric SmartPass Expansion', country: 'South Korea', lat: 37.4602, lon: 126.4407, domain: 'Biometric Borders', deployingAuthority: 'Ministry of Justice / IIAC', affectedPopulation: 'Foreign & domestic air travelers', status: 'Active', severity: 3, color: '#38bdf8', ethicsKind: 'biometric_welfare', summary: 'Controversy earlier surfaced around sharing millions of foreign traveler facial images with private AI defense/vision vendors.', source: 'MINBYUN / PIPC Korea', url: 'https://www.pipc.go.kr/' },
  { id: 'bio-th-deep', name: 'Thailand Southern Border Mandatory SIM Biometrics', country: 'Thailand', lat: 6.8695, lon: 101.2505, domain: 'Mass Biometric Surveillance', deployingAuthority: 'NBTC / Security Command', affectedPopulation: 'Deep South mobile users', status: 'Active', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Mandatory facial recognition for SIM registration enforced selectively in Thailand’s Deep South provinces.', source: 'iLaw Thailand / Access Now', url: 'https://www.accessnow.org/' },
  { id: 'bio-vn-decree', name: 'Vietnam Banking & Social Media Biometric ID Mandate', country: 'Vietnam', lat: 21.0285, lon: 105.8542, domain: 'Digital ID & Censorship', deployingAuthority: 'SBV / Ministry of Public Security', affectedPopulation: '70M+ accounts', status: 'In Force (Decree 147 / SBV)', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Mandates facial-recognition matches linked to national VNeID chip cards for online transfers and verified social accounts.', source: 'Access Now / The 88 Project', url: 'https://www.accessnow.org/' },
  { id: 'bio-fr-jo', name: 'Paris 2024 Law 2023-380 Algorithmic Video Experiment', country: 'France', lat: 48.8738, lon: 2.2950, domain: 'Public Algorithmic Surveillance', deployingAuthority: 'French Ministry of Interior / CNIL', affectedPopulation: 'Transit & stadium crowds', status: 'Extended Debated / Sunset Review', severity: 4, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'Legalized real-time behavioral anomaly AI in public spaces for Olympics crowd safety; civil society warns against permanent normalization.', source: 'CNIL / Amnesty / La Quadrature', url: 'https://www.amnesty.org/' },
  { id: 'bio-it-clearview', name: 'Clearview AI €20M+ GDPR Bans Across EU/UK', country: 'Italy', lat: 41.9028, lon: 12.4964, domain: 'Commercial Facial Scraping', deployingAuthority: 'Garante / CNIL / DPA NL / Hellenic', affectedPopulation: 'Global scraped social photos', status: 'Banned Across EEA (€90M+ Fines)', severity: 5, color: '#10b981', ethicsKind: 'biometric_welfare', summary: 'Coordinated European DPA rulings fined Clearview AI >€90M total for unlawful biometric scraping of billions of faces.', source: 'EDPB / Garante / CNIL', url: 'https://www.edpb.europa.eu/' },
  { id: 'bio-us-detroit', name: 'Detroit Wrongful Facial-Recognition Arrest Settlements', country: 'United States', lat: 42.3314, lon: -83.0458, domain: 'Policing Biometrics', deployingAuthority: 'Detroit Police Dept.', affectedPopulation: 'Porcha Woodruff / Robert Williams', status: 'Restricted Settlement Policy', severity: 5, color: '#ef4444', ethicsKind: 'biometric_welfare', summary: 'Multiple documented wrongful arrests of Black residents (including an 8-months-pregnant mother) forced strict FRT corroboration rules.', source: 'ACLU Michigan / NYT', url: 'https://www.aclu.org/' },
  { id: 'bio-ca-rcmp', name: 'Canada OPC Privacy Rulings on RCMP & Tim Hortons/Clearview', country: 'Canada', lat: 45.4215, lon: -75.6972, domain: 'Biometric Policing', deployingAuthority: 'OPC Canada / RCMP', affectedPopulation: 'National policing & retail', status: 'Enforced Restrictions', severity: 3, color: '#10b981', ethicsKind: 'biometric_welfare', summary: 'Office of the Privacy Commissioner ruled RCMP use of scraped Clearview biometrics unlawful, prompting mandatory Federal oversight.', source: 'OPC Canada', url: 'https://www.priv.gc.ca/' },
  { id: 'bio-co-sisben', name: 'Colombia SISBÉN IV & Facial Transit Pilots', country: 'Colombia', lat: 4.7110, lon: -74.0721, domain: 'Algorithmic Welfare', deployingAuthority: 'DNP Colombia / TransMilenio', affectedPopulation: '33M+ SISBÉN social registry', status: 'Audit / Transparency Drive', severity: 3, color: '#facc15', ethicsKind: 'biometric_welfare', summary: 'Proxy-means poverty scoring determines healthcare & subsidies while Fundación Karisma audits opaque algorithmic reclassifications.', source: 'Fundación Karisma / Access Now', url: 'https://web.karisma.org.co/' },
  { id: 'bio-eg-cairo', name: 'Egypt Telecom SIM-Biometrics & Transit Surveillance', country: 'Egypt', lat: 30.0444, lon: 31.2357, domain: 'Biometric Surveillance', deployingAuthority: 'NTRA / Ministry of Interior', affectedPopulation: 'Urban metro & telecom users', status: 'Active', severity: 4, color: '#f97316', ethicsKind: 'biometric_welfare', summary: 'Strict SIM biometric registration coupled with expanded facial CCTV in New Administrative Capital and Cairo stations.', source: 'Masaar Egypt / Access Now', url: 'https://masaar.net/' },
  { id: 'bio-us-unhcr', name: 'UNHCR Iris-Scan Refugee Cash Assistance', country: 'Jordan', lat: 32.2950, lon: 36.3250, domain: 'Humanitarian Biometrics', deployingAuthority: 'UNHCR / WFP', affectedPopulation: '600,000+ Syrian refugees', status: 'Active w/ Privacy Critique', severity: 3, color: '#a855f7', ethicsKind: 'biometric_welfare', summary: 'World’s largest humanitarian iris-authentication ATM cash transfer program; researchers highlight asymmetric consent in camp aid.', source: 'Privacy International / UNHCR', url: 'https://privacyinternational.org/' }
];

export const AI_LABOR_NODES = [
  { id: 'lab-nairobi-ke', name: 'Nairobi RLHF & Toxic Content Moderation Cluster', country: 'Kenya', lat: -1.2921, lon: 36.8219, vendors: 'Sama / Remotasks / CloudFactory / Majorel', primaryTasks: 'RLHF Safety Labeling & Harm Filtering', typicalHourlyUsd: '$1.32 – $2.40/hr', workforceScale: '15,000–25,000 workers', laborStatus: 'Landmark Unionization & Trauma Lawsuits', severity: 5, color: '#f43f5e', ethicsKind: 'ai_labor', summary: 'East Africa’s primary English RLHF hub; Kenyan Employment & Labour Relations Court allowed constitutional trauma/wage suits vs. Meta & Sama.', source: 'Foxglove / Fairwork Kenya / TIME', url: 'https://fair.work/' },
  { id: 'lab-manila-ph', name: 'Metro Manila & Cebu Trust-and-Safety BPO Hub', country: 'Philippines', lat: 14.5995, lon: 120.9842, vendors: 'TaskUs / Telus Digital / Accenture / Scale Remotasks', primaryTasks: 'LLM Red-Teaming, Multimodal Annotation & CSAM Filtering', typicalHourlyUsd: '$1.80 – $4.10/hr', workforceScale: '120,000+ digital BPO/gig', laborStatus: 'High PTSD Turnover & Shift Quotas', severity: 5, color: '#ef4444', ethicsKind: 'ai_labor', summary: 'Global capital of English-language trust & safety moderation and crowdworker Remotasks RLHF training.', source: 'Rest of World / Fairwork / ILO', url: 'https://restofworld.org/' },
  { id: 'lab-davao-ph', name: 'Davao & Iloilo Provincial AI Annotation BPOs', country: 'Philippines', lat: 7.1907, lon: 125.4553, vendors: 'Remotasks / Regional AI Subcontractors', primaryTasks: 'LiDAR Autonomous Driving & Image Tagging', typicalHourlyUsd: '$1.40 – $2.80/hr', workforceScale: '25,000+ workers', laborStatus: 'Account Bans & Unpaid Task Risks', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Rapid growth of provincial crowdwork hubs handling autonomous-vehicle bounding boxes with abrupt platform de-activations.', source: 'Rest of World / Oxford Internet Institute', url: 'https://www.oii.ox.ac.uk/' },
  { id: 'lab-bengaluru-in', name: 'Bengaluru & Tier-2 Karnataka AI Labeling Corridor', country: 'India', lat: 12.9716, lon: 77.5946, vendors: 'Appen / iMerit / Karya / Objectways / NextWealth', primaryTasks: 'Indic Speech/Audio, RLHF & Autonomous Vision', typicalHourlyUsd: '$1.60 – $4.50/hr', workforceScale: '180,000+ industrywide', laborStatus: 'Mixed (Karya Fair-Pay vs. Piece-Rate)', severity: 3, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Centers both formal impact-sourcing firms (iMerit/Karya) and low-pay rural gig subcontracting chains.', source: 'Fairwork India / Rest of World', url: 'https://fair.work/' },
  { id: 'lab-hyderabad-in', name: 'Hyderabad & Visakhapatnam HITEC Annotation Parks', country: 'India', lat: 17.3850, lon: 78.4867, vendors: 'Telus / Accenture / Genpact / DataPure', primaryTasks: 'Multilingual GenAI Eval & Medical Imaging', typicalHourlyUsd: '$2.20 – $5.00/hr', workforceScale: '60,000+ workers', laborStatus: 'High-Quota NDA Surveillance', severity: 3, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Large BPO human-in-the-loop centers auditing search ranking, medical bounding boxes, and hallucination checks.', source: 'ILO / Fairwork India', url: 'https://www.ilo.org/' },
  { id: 'lab-tirunelveli-in', name: 'Tirunelveli & Rural Tamil Nadu Impact-Sourcing Hub', country: 'India', lat: 8.7139, lon: 77.7567, vendors: 'DesiCrew / NextWealth / Objectways', primaryTasks: 'AV Sensor Fusion & Indic Datasets', typicalHourlyUsd: '$1.90 – $3.20/hr', workforceScale: '15,000+ rural/women workers', laborStatus: 'Salaried Rural BPO Experiment', severity: 2, color: '#10b981', ethicsKind: 'ai_labor', summary: 'Notable alternative rural BPO model bringing salaried annotation work into Tier-3 Tamil Nadu towns.', source: 'Carnegie India / Rest of World', url: 'https://restofworld.org/' },
  { id: 'lab-caracas-ve', name: 'Caracas–Maracaibo Microtasking Survival Hub', country: 'Venezuela', lat: 10.4806, lon: -66.9036, vendors: 'Toloka / Remotasks / Appen / Clickworker', primaryTasks: 'Spanish/English RLHF & Vision Labeling', typicalHourlyUsd: '$0.80 – $1.90/hr', workforceScale: '45,000+ workers', laborStatus: 'Severe Hyperinflation Dependence', severity: 5, color: '#f43f5e', ethicsKind: 'ai_labor', summary: 'Economic crisis made Venezuela one of the world’s highest per-capita concentrations of crypto/dollar-paid microtask AI trainers.', source: 'Rest of World / Carnegie / MIT Tech Review', url: 'https://www.technologyreview.com/' },
  { id: 'lab-bogota-co', name: 'Bogotá & Medellín Spanish Moderation & RLHF', country: 'Colombia', lat: 4.7110, lon: -74.0721, vendors: 'Teleperformance / Majorel / TaskUs / Mercor', primaryTasks: 'Spanish Trust & Safety + AI Evals', typicalHourlyUsd: '$2.30 – $4.80/hr', workforceScale: '40,000+ workers', laborStatus: 'Labor Ministry Scrutiny & Strikes', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Key Latin American Spanish moderation center facing Colombian Labor Ministry audits on mental-health protections.', source: 'Foxglove / Fairwork Colombia', url: 'https://www.foxglove.org.uk/' },
  { id: 'lab-buenosaires-ar', name: 'Buenos Aires Spanish Coding & RLHF Freelancers', country: 'Argentina', lat: -34.6037, lon: -58.3816, vendors: 'Outlier / Scale AI / Alignerr / Turing', primaryTasks: 'STEM Coding Evals & LatAm Spanish RLHF', typicalHourlyUsd: '$5.00 – $18.00/hr (Tiered)', workforceScale: '30,000+ contractors', laborStatus: 'Algorithmic Wage Cuts & Disqualification', severity: 3, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Large university-educated developer and linguist pool grading STEM reasoning chains amid volatile platform rate drops.', source: 'Data Workers’ Inquiry / Rest of World', url: 'https://data-workers.org/' },
  { id: 'lab-mexico-mx', name: 'Mexico City & Monterrey Bilingual RLHF/Moderation', country: 'Mexico', lat: 19.4326, lon: -99.1332, vendors: 'Telus / TaskUs / Cognizant / Outlier', primaryTasks: 'US-Market Spanish/English Harm Safety', typicalHourlyUsd: '$3.20 – $6.50/hr', workforceScale: '35,000+ workers', laborStatus: 'Nearshore BPO Shift', severity: 3, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Nearshore US-timezone moderation and multimodal safety red-teaming corridor.', source: 'Fairwork / ILO', url: 'https://fair.work/' },
  { id: 'lab-ghana-gh', name: 'Accra–Kumasi African Language Dataset & BPO', country: 'Ghana', lat: 5.6037, lon: -0.1870, vendors: 'Majorel / Sama / Masakhane / Aya Hubs', primaryTasks: 'Twi/African NLP & Moderation', typicalHourlyUsd: '$1.40 – $2.80/hr', workforceScale: '8,000+ workers', laborStatus: 'Mental Health & Fair Pay Campaign', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Growing West African content moderation and local-language dataset hub demanding parity with European workers.', source: 'Ghana Content Moderators / Rest of World', url: 'https://restofworld.org/' },
  { id: 'lab-uganda-ug', name: 'Kampala–Gulu Refugee Digital Work Camps', country: 'Uganda', lat: 0.3476, lon: 32.5825, vendors: 'Sama / CloudFactory / Humanity Works', primaryTasks: 'Autonomous Driving Polygon Labeling', typicalHourlyUsd: '$1.10 – $2.00/hr', workforceScale: '5,000+ youth/refugees', laborStatus: 'Sub-Living Wage Audit', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Impact-sourcing centers employing Ugandan youth & refugee cohorts on vision labeling without collective bargaining.', source: 'Oxford Internet Institute / Fairwork', url: 'https://www.oii.ox.ac.uk/' },
  { id: 'lab-madagascar-mg', name: 'Antananarivo French AI Labeling Factories', country: 'Madagascar', lat: -18.8792, lon: 47.5079, vendors: 'Isahit / Vivetic / Francophone BPOs', primaryTasks: 'French Audio/OCR & Retail Vision Tagging', typicalHourlyUsd: '$0.90 – $1.75/hr', workforceScale: '12,000+ workers', laborStatus: 'Low Wage Floor', severity: 4, color: '#f43f5e', ethicsKind: 'ai_labor', summary: 'Francophone outsourcing hub serving European retail vision models, medical OCR, and French LLMs.', source: 'Data Workers’ Inquiry / Le Monde', url: 'https://data-workers.org/' },
  { id: 'lab-cairo-eg', name: 'Cairo–Giza Arabic Dialect NLP & Moderation', country: 'Egypt', lat: 30.0444, lon: 31.2357, vendors: 'Teleperformance / Sutherland / Outlier', primaryTasks: 'Arabic LLM Tuning & MENA Moderation', typicalHourlyUsd: '$1.50 – $3.40/hr', workforceScale: '25,000+ workers', laborStatus: 'Currency Shock / High Quota Pressure', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Primary Arabic RLHF, dialect transcription, and regional crisis moderation labor force.', source: 'Fairwork Egypt / Access Now', url: 'https://fair.work/' },
  { id: 'lab-beirut-lb', name: 'Beirut & Amman Levantine Arabic Aid/Gig Labeling', country: 'Lebanon', lat: 33.8938, lon: 35.5018, vendors: 'Humans in the Loop / Sama / NaTakallam', primaryTasks: 'Medical & Humanitarian Drone Vision', typicalHourlyUsd: '$2.50 – $6.00/hr', workforceScale: '4,000+ displaced/freelance', laborStatus: 'Crisis-Era Digital Gig', severity: 3, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Refugee & crisis-affected engineers and annotators building Arabic datasets and medical image segmentation.', source: 'MIT Tech Review / Humans in the Loop', url: 'https://www.technologyreview.com/' },
  { id: 'lab-heze-cn', name: 'Heze / Pingxiang Rural Chinese Data-Labeling Parks', country: 'China', lat: 35.2338, lon: 115.4807, vendors: 'Baidu Data Crowdsourcing Bases / Stardust AI', primaryTasks: 'AV LiDAR 3D Cuboids & ERNIE RLHF', typicalHourlyUsd: '$2.20 – $4.20/hr', workforceScale: '500,000+ nationwide CN', laborStatus: 'Township Piece-Rate Industrialization', severity: 4, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Chinese inland municipal "AI data towns" training thousands of domestic LiDAR and domestic foundation-model labelers.', source: 'Rest of World / DigiChina', url: 'https://restofworld.org/' },
  { id: 'lab-datong-cn', name: 'Datong & Shenyang Post-Coal AI Labeling Hubs', country: 'China', lat: 40.0768, lon: 113.3001, vendors: 'ByteDance / JD / Municipal AI Parks', primaryTasks: 'Autonomous Vision & Short-Video Moderation', typicalHourlyUsd: '$2.40 – $4.50/hr', workforceScale: '50,000+ regional', laborStatus: 'State-Backed Coal-to-Data Transition', severity: 3, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Former coal-mining city converted into a subsidized municipal data-annotation park serving Chinese tech giants.', source: 'SCMP / Rest of World', url: 'https://restofworld.org/' },
  { id: 'lab-jakarta-id', name: 'Jakarta–Yogyakarta Indonesian LLM & Ride-Hailing Tagging', country: 'Indonesia', lat: -6.2088, lon: 106.8456, vendors: 'Toloka / Appen / Gojek-Tokopedia BPOs', primaryTasks: 'Southeast Asian Language RLHF & Commerce', typicalHourlyUsd: '$1.30 – $2.90/hr', workforceScale: '35,000+ workers', laborStatus: 'Gig Classification Gaps', severity: 3, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Supports Bahasa Indonesia/Javanese LLM fine-tuning and high-volume marketplace moderation.', source: 'Fairwork Indonesia', url: 'https://fair.work/' },
  { id: 'lab-hanoi-vn', name: 'Hanoi & Da Nang Autonomous Vision Annotation Farms', country: 'Vietnam', lat: 21.0285, lon: 105.8542, vendors: 'FPT Software / VinAI / Scale Subcontractors', primaryTasks: '3D LiDAR Segmentation & Japanese/KR OCR', typicalHourlyUsd: '$2.10 – $4.20/hr', workforceScale: '20,000+ workers', laborStatus: 'Structured Outsourcing Parks', severity: 3, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'Export-oriented engineering firms executing strict LiDAR and Japanese-language vision labeling contracts.', source: 'Rest of World / ILO', url: 'https://restofworld.org/' },
  { id: 'lab-dhaka-bd', name: 'Dhaka–Chittagong Bengali & Vision Crowd Hubs', country: 'Bangladesh', lat: 23.8103, lon: 90.4125, vendors: 'Quantigo AI / Appen / Clickworker', primaryTasks: 'Image Bounding Boxes & South Asian OCR', typicalHourlyUsd: '$1.10 – $2.40/hr', workforceScale: '30,000+ freelancers', laborStatus: 'Payment Gateway & Rate Pressure', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Major global freelance computer-vision and document-OCR hub navigating cross-border payout fees.', source: 'ILO / World Bank Digital Jobs', url: 'https://www.ilo.org/' },
  { id: 'lab-lahore-pk', name: 'Lahore & Rawalpindi Vision/Medical Labeling', country: 'Pakistan', lat: 31.5204, lon: 74.3587, vendors: 'Scale Contractors / CloudFactory / Appen', primaryTasks: 'LiDAR Cuboids & Urdu/English QA', typicalHourlyUsd: '$1.25 – $3.10/hr', workforceScale: '25,000+ workers', laborStatus: 'Power/Internet Outage Disruptions', severity: 4, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Large technical freelance pool facing sudden platform outages and state social-media throttling.', source: 'Bytes for All / Rest of World', url: 'https://restofworld.org/' },
  { id: 'lab-essen-de', name: 'Essen & Berlin Teleperformance Content Moderation Strikes', country: 'Germany', lat: 51.4556, lon: 7.0116, vendors: 'Teleperformance / Telus Digital (TikTok/Meta)', primaryTasks: 'German/Turkish DSA Moderation', typicalHourlyUsd: '€13.00 – €16.50/hr', workforceScale: '5,000+ EU moderators', laborStatus: 'First Works-Council & Ver.di Union Strikes', severity: 3, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Ver.di unionized content moderators protesting algorithmic surveillance and mental-health workloads under EU DSA.', source: 'Foxglove / Ver.di / AlgorithmWatch', url: 'https://www.foxglove.org.uk/' },
  { id: 'lab-barcelona-es', name: 'Barcelona (GLORIAD / Telus) Trauma Litigation Hub', country: 'Spain', lat: 41.3874, lon: 2.1686, vendors: 'CCC / Telus Digital', primaryTasks: 'European Meta CSAM/Violent Moderation', typicalHourlyUsd: '€10.50 – €14.00/hr', workforceScale: '2,500+ EU workers', laborStatus: 'Landmark Labor Court PTSD Rulings', severity: 4, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Spanish Social Court recognized Meta content-moderation psychological injury as a formal workplace accident.', source: 'Foxglove / El País', url: 'https://www.foxglove.org.uk/' },
  { id: 'lab-lisbon-pt', name: 'Lisbon Webhelp–Majorel Trust & Safety Center', country: 'Portugal', lat: 38.7223, lon: -9.1393, vendors: 'Concentrix-Webhelp / Teleperformance / Accenture', primaryTasks: 'EU Multi-Lingual Moderation & Ad Safety', typicalHourlyUsd: '€8.00 – €11.50/hr', workforceScale: '15,000+ BPO staff', laborStatus: 'EU Platform Work Directive Scrutiny', severity: 3, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Western Europe’s largest low-cost multilingual trust-and-safety outsourcing destination.', source: 'AlgorithmWatch / ETUI', url: 'https://algorithmwatch.org/en/' },
  { id: 'lab-sofia-bg', name: 'Sofia & Bucharest EU Slavic/CEE Trust Hubs', country: 'Bulgaria', lat: 42.6977, lon: 23.3219, vendors: 'Telus International / Majorel / Humans in the Loop', primaryTasks: 'EU DSA Disinfo & AV Sensor Annotation', typicalHourlyUsd: '$5.50 – $9.00/hr', workforceScale: '18,000+ workers', laborStatus: 'Transitioning to EU Transparency Rules', severity: 2, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Eastern European multilingual moderation and EU-compliant annotation centers scaling under DSA audits.', source: 'AlgorithmWatch', url: 'https://algorithmwatch.org/en/' },
  { id: 'lab-kyiv-ua', name: 'Kyiv & Lviv Ukrainian Defense-OSINT & Medical Annotation', country: 'Ukraine', lat: 50.4501, lon: 30.5234, vendors: 'Label Your Data / Mindy Support / Domestic Tech', primaryTasks: 'Satellite Damage Tagging & Robotics Vision', typicalHourlyUsd: '$4.50 – $10.00/hr', workforceScale: '12,000+ workers', laborStatus: 'Wartime Remote Resilience', severity: 3, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Wartime Ukrainian data engineers and vision annotators labeling satellite imagery, agricultural robotics, and Western commercial datasets.', source: 'Rest of World / DOU.ua', url: 'https://restofworld.org/' },
  { id: 'lab-austin-us', name: 'Austin & San Francisco Bay Specialist RLHF Pods', country: 'United States', lat: 30.2672, lon: -97.7431, vendors: 'Scale AI (Outlier) / Surge AI / Mercor / Tesla Dojo Ops', primaryTasks: 'PhD STEM Reasoning, Code Evals & Optimus Teleop', typicalHourlyUsd: '$15 – $55/hr (1099)', workforceScale: '80,000+ US contractors', laborStatus: '1099 Misclassification Lawsuits', severity: 4, color: '#f59e0b', ethicsKind: 'ai_labor', summary: 'White-collar gig RLHF workforce in Silicon Valley/Texas filing California wage-theft & independent-contractor class actions.', source: 'TechEquity / Washington Post', url: 'https://techequitycollaborative.org/' },
  { id: 'lab-tbilisi-ge', name: 'Tbilisi & Yerevan Post-2022 Russian/English AI Annotators', country: 'Georgia', lat: 41.7151, lon: 44.8271, vendors: 'Toloka / Scale / Remotasks', primaryTasks: 'STEM Reasoning & Multilingual RLHF', typicalHourlyUsd: '$6.00 – $16.00/hr', workforceScale: '7,000+ remote engineers', laborStatus: 'Gig Precarity', severity: 3, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Migrated Eastern European STEM specialists serving high-skill coding and multilingual LLM evaluation pipelines.', source: 'Data Workers’ Inquiry', url: 'https://data-workers.org/' },
  { id: 'lab-sao-paulo-br', name: 'São Paulo & Recife Portuguese Moderation & Gig AI', country: 'Brazil', lat: -23.5505, lon: -46.6333, vendors: 'Accenture / Teleperformance / Outlier', primaryTasks: 'PT-BR LLM Safety & Disinfo Moderation', typicalHourlyUsd: '$2.40 – $5.50/hr', workforceScale: '35,000+ workers', laborStatus: 'Union Legal Action', severity: 3, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Lusophone trust-and-safety and electoral-disinformation AI auditing centers across Brazil.', source: 'Fairwork Brazil / ILO', url: 'https://fair.work/' },
  { id: 'lab-lima-pe', name: 'Lima Andean Spanish & Quechua Moderation/Labeling', country: 'Peru', lat: -12.0464, lon: -77.0428, vendors: 'Atento / Teleperformance / Remotasks', primaryTasks: 'Voice Transcription & Regional Moderation', typicalHourlyUsd: '$1.80 – $3.50/hr', workforceScale: '15,000+ workers', laborStatus: 'High Turnover / Subcontractor', severity: 3, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Andean Spanish speech dataset & marketplace content moderation centers.', source: 'ObservaTIC / ILO', url: 'https://www.ilo.org/' },
  { id: 'lab-casablanca-ma', name: 'Casablanca & Rabat French/Darija Moderation Centers', country: 'Morocco', lat: 33.5731, lon: -7.5898, vendors: 'Majorel / Webhelp / Intelcia', primaryTasks: 'EU French & Maghreb Arabic Moderation', typicalHourlyUsd: '$2.20 – $4.20/hr', workforceScale: '22,000+ workers', laborStatus: 'Under-Monitored Psych Support', severity: 3, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Major offshore Francophone and Maghreb trust-and-safety hub for European social and AI platforms.', source: 'AlgorithmWatch / Foxglove', url: 'https://www.foxglove.org.uk/' },
  { id: 'lab-tokyo-jp', name: 'Tokyo–Sapporo Japanese RLHF & Robotics Labeling', country: 'Japan', lat: 35.6762, lon: 139.6503, vendors: 'Preferred Networks / FastLabel / Appen JP', primaryTasks: 'Japanese Cultural Alignment & Medical OCR', typicalHourlyUsd: '$9.50 – $18.00/hr', workforceScale: '18,000+ contractors', laborStatus: 'Freelance Act Protections (2024)', severity: 2, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'Domestic Japanese crowd-annotation force covered by Japan’s 2024 Freelance Transaction Protection Act.', source: 'MHLW Japan / FastLabel', url: 'https://www.mhlw.go.jp/' },
  { id: 'lab-seoul-kr', name: 'Seoul–Busan Crowdworks "AI New Deal" Labelers', country: 'South Korea', lat: 37.5665, lon: 126.9780, vendors: 'Crowdworks / SelectStar / Superb AI', primaryTasks: 'Korean AI-Hub Datasets & Medical Tagging', typicalHourlyUsd: '$8.00 – $14.00/hr', workforceScale: '100,000+ state-funded gig', laborStatus: 'National AI Data Voucher Debate', severity: 3, color: '#38bdf8', ethicsKind: 'ai_labor', summary: 'South Korea’s state AI-Hub subsidies trained >100k platform data workers while highlighting post-subsidy gig insecurity.', source: 'Korea Herald / NIA Korea', url: 'https://www.nia.or.kr/' },
  { id: 'lab-kuala-my', name: 'Kuala Lumpur Multilingual Safety Hub (Malay/Mandarin/Tamil)', country: 'Malaysia', lat: 3.1390, lon: 101.6869, vendors: 'TDCX / Accenture / TaskUs Malaysia', primaryTasks: 'APAC Multi-Script Trust & Safety', typicalHourlyUsd: '$4.20 – $7.50/hr', workforceScale: '28,000+ specialists', laborStatus: 'Regional APAC Center', severity: 3, color: '#ec4899', ethicsKind: 'ai_labor', summary: 'Trilingual APAC moderation and LLM safety center policing Southeast Asian election and scam ecosystems.', source: 'Rest of World / MIT Tech Review', url: 'https://restofworld.org/' }
];

export function getEthicsLayerPayload(layer, liveClusters = []) {
  switch (layer) {
    case 'environmental': {
      const merged = [...ENVIRONMENTAL_JUSTICE_NODES];
      let liveSyncedClusters = 0;
      if (Array.isArray(liveClusters) && liveClusters.length > 0) {
        for (const c of liveClusters) {
          const enriched = enrichFrontierClusterEnvironment(c);
          if (!enriched) continue;
          const dup = merged.some(
            (m) => Math.abs(m.lat - enriched.lat) < 0.25 && Math.abs(m.lon - enriched.lon) < 0.25
          );
          if (!dup) {
            merged.push(enriched);
            liveSyncedClusters += 1;
          }
        }
      }
      return {
        layer,
        title: 'Environmental Justice: Compute Water Stress & Ember 2025 Grid Carbon',
        items: merged,
        arcs: [],
        meta: {
          total: merged.length,
          curatedHotspots: ENVIRONMENTAL_JUSTICE_NODES.length,
          liveSyncedClusters
        }
      };
    }
    case 'supply_chain':
      return {
        layer,
        title: 'AI Supply Chain: 7-Stage Minerals, EUV Lithography, Foundries & E-Waste',
        items: SUPPLY_CHAIN_NODES,
        arcs: SUPPLY_CHAIN_ARCS,
        meta: {
          total: SUPPLY_CHAIN_NODES.length,
          arcs: SUPPLY_CHAIN_ARCS.length
        }
      };
    case 'biometric_welfare':
      return {
        layer,
        title: 'Biometric Borders, Mass Surveillance & Algorithmic Welfare',
        items: BIOMETRIC_WELFARE_NODES,
        arcs: [],
        meta: { total: BIOMETRIC_WELFARE_NODES.length }
      };
    case 'ai_labor':
      return {
        layer,
        title: 'AI Data-Labeling, RLHF & Content-Moderation Global Labor Hubs',
        items: AI_LABOR_NODES,
        arcs: [],
        meta: { total: AI_LABOR_NODES.length }
      };
    default:
      return null;
  }
}
