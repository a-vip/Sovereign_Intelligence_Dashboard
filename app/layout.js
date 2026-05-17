import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'Sovereign Intelligence Dashboard',
  description: 'Real-time intelligence analysis dashboard for LAWS tracking, state violations, and corporate complicity monitoring.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Modern Custom Premium Favicon Link */}
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        {/* Leaflet Fallback Mapping Engine CSS & JS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          crossOrigin=""
        ></script>

        {/* CesiumJS Premium 3D Globe Engine CSS & JS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Widgets/widgets.css"
        />
        <script
          src="https://cdn.jsdelivr.net/npm/cesium@1.115.0/Build/Cesium/Cesium.js"
        ></script>
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
