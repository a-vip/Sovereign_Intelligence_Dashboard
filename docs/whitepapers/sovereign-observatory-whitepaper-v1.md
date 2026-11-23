# Observing the Compute–Governance Gap: A Cryptographically Auditable Architecture for Real-Time Global AI Safety, Statutory, and Epistemic Parity Monitoring

**Author:** Avi Perera  
**Affiliation:** Sovereign Global AI Safety & Policy Observatory (`app.sovdash.com`)  
**Version:** Whitepaper v1.0 (2026)  
**Data & Code License:** CC-BY-4.0 (Open Dataset Exports) / MIT (Evaluation Benchmark)

---

## Abstract

Global artificial intelligence governance is fragmenting along diverging statutory, technical, and geopolitical fault lines—spanning risk-based binding regulation in the European Union (Regulation (EU) 2024/1689), frontier threshold disclosures in California (SB 53) and South Korea (AI Basic Act), state algorithmic registries in China, and voluntary pre-deployment safety testing led by national AI Safety Institutes (UK AISI, US CAISI). Existing trackers fail along three methodological dimensions: (1) reliance on static, manually curated tables that lag behind live legislative and cyber-operational changes; (2) opaque black-box scoring or unverified geographic pins that distort regional representation; and (3) destructive feed rotation that erases longitudinal provenance. We introduce the **Sovereign Observatory Architecture**, an end-to-end, zero-fabrication intelligence platform integrating a 5-pillar policy classifier, position-aware geocoding, SHA-256 content fingerprinting, NATO Admiralty two-axis source reliability grading (`A1`–`D4`), MIT AI Risk Repository 7-domain mapping (`D1`–`D7`), and live Epoch AI frontier compute telemetry. On a reproducible 200-item stratified evaluation suite, the pipeline achieves crisp rejection of non-policy consumer/sports noise and theoretical optimization papers while preserving exact non-territorial classification (`0` fabricated coordinates).

---

## 1. Introduction: The Compute–Governance Gap

Frontier AI training compute has concentrated in multi-gigawatt clusters across a small set of jurisdictions, while statutory enforcement regimes operate at radically different velocities and scopes. Measuring whether binding algorithmic safety obligations keep pace with frontier compute capacity requires unifying statutory instruments, pre-deployment lab commitments, real-world harm/cyber incident feeds, and physical hardware siting inside a single auditable observational frame.

## 2. System Architecture

1. **Five-Pillar Domain Inclusion Gate (`lib/policyClassifier.js`)**: Word-boundary anchored classification across *AI Governance & Policy*, *Autonomous & Defense*, *Cyber & Espionage*, *Digital Rights & Surveillance*, and *Compute & Semiconductors*, paired with noise exclusion for consumer/sports feeds and abstract optimization preprints lacking governance or security anchors.
2. **Zero-Fabrication Sovereign Geocoder (`lib/geocoder.js`)**: Resolves explicit city, agency, or sovereign references via headline-precedence scoring (`115+` urban and multilateral seats). Signals lacking explicit territorial grounding resolve as `Global / Multilateral` (`lat: null, lon: null`) rather than fabricating publisher-headquarters coordinates.
3. **Non-Destructive Archival & Cryptographic Provenance (`lib/provenance.js`, `lib/db.js`)**: Active globe pins age out of the default tactical view after 21 days by transitioning to `lifecycle_state = 'archived'`, retaining permanent URL permalinks (`/signal/[id]`), deterministic SHA-256 content hashes, Wayback snapshot links, NATO Admiralty reliability codes (`A1`–`D4`), and 1-click OSCOLA, APA 7th, and BibTeX citations.
4. **MIT AI Risk Repository & Compute Correlation (`lib/mitRiskTaxonomy.js`, `lib/epochSync.js`)**: Maps every classified signal onto the 7 MIT AI Risk Domains (`D1`–`D7`) and ingests Epoch AI frontier data centers and notable models to quantify **Compute–Governance Coverage**.

## 3. Proprietary Indexes: SAGRI & Epistemic Parity

The **Sovereign AI Governance Readiness Index (SAGRI)** aggregates 5 normalized dimensions—Statutory Force, Evaluation Capacity, Multilateral Treaties, Compute Oversight, and Transparency/Whistleblowing—via user-adjustable sensitivity weights (`0`–`100`), augmented by bounded empirical telemetry bonuses from live statutory and cluster records. The **Epistemic Parity Lens** audits Global North vs. Global South signal volume, megawatt compute share, Admiralty source-grade composition, and MIT domain balance.

## 4. Reproducible 200-Item Benchmark

To prevent benchmark opacity, Sovereign ships `benchmarks/policy-geocoder-benchmark-200.json` (`120` 5-pillar geopolitical/policy items including `15` intentionally non-territorial items, plus `80` adversarial sports, consumer-shopping, routine weather, and pure-math ML distractors) alongside `scripts/run-benchmark.mjs` (`npm run benchmark`). Live evaluation outputs are persisted in `benchmarks/latest-results.json` and surfaced dynamically at `/whitepaper` and `/methodology`.

## 5. Limitations & Dual-Use Ethics

Current automated RSS/API ingestion skews toward English-language disclosures and anglophone civil-society monitors; SAGRI baseline weights carry normative assumptions mitigated via public interactive sensitivity sliders; and cyber/autonomous telemetry is strictly restricted to defensive public-interest advisories (`CISA`, `ENISA`, `NCSC`, `UN CCW`, `AIID`) with SSRF protections across custom feeds and webhooks.

## 6. Open Data Licensing & Citation

Longitudinal datasets are exported programmatically under **CC-BY-4.0** via `/api/v1/export/dataset` (`jsonl`, `csv`, and Frictionless `datapackage.json`) and bundled with `CITATION.cff` for Zenodo DOI archiving.
