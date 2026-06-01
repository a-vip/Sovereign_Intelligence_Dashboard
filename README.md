# 📡 Sovereign Intelligence Dashboard

**Sovereign Intelligence Dashboard** is an advanced, high-fidelity threat intelligence (OSINT) telemetry console and real-time visualization platform. Designed with a premium cyberpunk military HUD aesthetic, it aggregates global conflict alerts, border surveillance metrics, GPS jamming anomalies, and international IHL compliance records into a unified command dashboard.

The application combines a high-performance React front-end, Next.js dynamic routing APIs, real-time map interfaces (Cesium and Leaflet), and automated OSINT harvesters to provide critical clarity in global crisis theaters.

---

## 🚀 Key Features

### 1. Unified Tactical Map Console
*   **Leaflet Interactive 2D Map**: Renders live geo-mapped threat event signals, color-coded by category (Conflict, Cyber, Surveillance, Border, and Space) and size-proportioned by severity level.
*   **3D Cesium Global Globe**: Dynamic rendering of military and imagery satellite tracks, global deep-sea communication cable grids, regional datacenters, and terminal landing stations.
*   **Drift-Free Coordinates Calibration**: Integrates a Leaflet camera `preventFocus` lock. Admins can correct coordinates or threat information in the CMS without disorienting map jumps or camera disruptions.

### 2. Multi-Telemetry RSS & GDELT Harvester Interfaces
*   **Active Crawler Feeds**: Continuously monitors OSINT RSS lists and GDELT global geopolitics event datasets.
*   **Automated Geocoding & Transcription**: Captures and processes events via Gemini-powered parsing.
*   **Self-Healing Source Links**: Runs backend validity checkers. If source articles are deleted or return a `404` error, the engine flags the item and auto-heals links via standard archival fallbacks.

### 3. Wavelength Visualizer & Particle Console
*   **Wavelength Particle Generator**: Runs interactive, high-performance HTML5 Canvas simulation rendering of:
    *   `VIS` (Visible spectrum tracking)
    *   `IR` (Infrared heat telemetry signatures)
    *   `UV` (Ultraviolet indicators)
    *   `X-RAY` (High-energy tactical bursts)
    *   `GRAV` (Einstein ring distortion around heavy celestial anomalies)

### 4. Admin Event Creation & Operational Draft Pipeline
*   **Manual Incident Creation**: Secure manual threat point insertion panel. Define titles, severity ratings, custom summaries, geocoded locations, and validation links.
*   **Draft Staging Workflow**: Supports `draft` and `published` states. Drafts remain safely contained in the database for operator reviews, while published signals instantly stream to live dashboards in real-time.

### 5. Premium Mobile-Responsive sheet Layout
*   Dynamic `isMobile` screen width observers adjust panel placements in real-time.
*   Draggable floating windows automatically transition into elegant bottom-sheet menus on handheld displays, ensuring perfect tactile readability.

---

## ⚙️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router) / React 18 |
| **Styling** | Vanilla CSS (curated HSL palettes, neon HUD, dark glassmorphism) |
| **Mapping Engine** | Leaflet / Cesium Ion 3D Platform |
| **Database & API** | Dynamic Server Side JSON Store (events, RSS, anomalies) / NextJS API |
| **Validation** | Archive.org Wayback API / OpenStreetMap Nominatim |

---

## 🛠️ Installation & Setup

1.  **Clone and Install Dependencies**:
    ```bash
    git clone https://github.com/a-vip/Sovereign_Intelligence_Dashboard.git
    cd Sovereign_Intelligence_Dashboard
    npm install
    ```

2.  **Environment Setup (`.env.local`)**:
    Create a `.env.local` file in the root folder:
    ```env
    # Cesium Ion Access Token for 3D Globe Tiles
    NEXT_PUBLIC_CESIUM_TOKEN=your_cesium_ion_token

    # Admin Session Passphrase
    ADMIN_PASSPHRASE=your_secure_admin_passphrase
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

4.  **Production Compilation (Webpack Mode)**:
    Since Turbopack requires native local bindings, compile using Webpack:
    ```bash
    npx next build --webpack
    npm run start
    ```

---

## 📂 Repository Structure

*   `components/`: Core UI modular components.
    *   `LiveMap.js`: Core Leaflet map wrapper with preventFocus tracking.
    *   `CesiumGlobe.js`: High-fidelity 3D globes overlay manager.
    *   `AdminCMS.js`: Operational dashboard manager with manual event creation forms.
    *   `EventDetailsWindow.js`: Responsive threat detail overlays.
*   `app/api/`: Next.js REST API endpoints.
    *   `/events`: Public GET route with automatic draft exclusion.
    *   `/admin/events`: Operator write endpoints.
*   `lib/`: Shared utility libraries (geocoding, database connection hooks).

---

## 👨‍💻 About the Creator
This system was engineered and designed by **Avi Perera**.
*   🌐 **Personal Website**: [aviperera.com](https://aviperera.com)
*   🚀 **Enterprise Platform**: [sovdash.com](https://sovdash.com) (Sovereign Intel Platform)

---

## 💖 Support & Sponsorship
If this system has added value to your intelligence workflows or global monitoring campaigns, consider supporting the continued development of open-source OSINT systems:

*   ☕ **Buy Me a Coffee**: [buymeacoffee.com/aviperera](https://www.buymeacoffee.com/aviperera)
*   🎗️ **Patreon**: [patreon.com/aviperera](https://www.patreon.com/aviperera)
*   ⭐ **GitHub Sponsors**: Star this repository or sponsor directly via [GitHub Sponsors](https://github.com/sponsors/avi-perera)!
