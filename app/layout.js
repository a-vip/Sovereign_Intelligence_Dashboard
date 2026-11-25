import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata = {
  metadataBase: new URL('https://app.sovdash.com'),
  title: {
    default: 'Sovereign — Global AI Safety & Policy Observatory',
    template: '%s | Sovereign AI Observatory'
  },
  description:
    'Live cross-layered global observatory tracking binding AI legislation, frontier model safety governance, autonomous weapons (LAWS) diplomacy, cybersecurity operations, and compute sovereignty across 180+ jurisdictions.',
  keywords: [
    'AI safety observatory',
    'global AI policy tracker',
    'EU AI Act compliance',
    'California SB 53',
    'South Korea AI Basic Act',
    'Council of Europe AI Convention',
    'autonomous weapons LAWS',
    'cyber policy OSINT',
    'semiconductor export controls'
  ],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://app.sovdash.com',
    siteName: 'Sovereign Global AI Safety & Policy Observatory',
    title: 'Sovereign — Global AI Safety & Policy Observatory',
    description:
      'Real-time empirical observatory monitoring international AI regulation, frontier safety evaluations, autonomous weapons diplomacy, and cyber operations.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sovereign — Global AI Safety & Policy Observatory',
    description:
      'Real-time empirical observatory for global AI governance, frontier safety policy, LAWS treaties, and cyber operations.'
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

const OBSERVATORY_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Sovereign Global AI Safety & Policy Observatory',
      url: 'https://app.sovdash.com',
      applicationCategory: 'ResearchApplication',
      operatingSystem: 'Web',
      description:
        'Real-time geospatial observatory tracking international AI regulation, frontier safety frameworks, autonomous weapons treaties, digital rights, and compute geopolitics.'
    },
    {
      '@type': 'Dataset',
      name: 'Sovereign Global AI Safety, Cyber & Tech Policy Corpus',
      url: 'https://app.sovdash.com/jurisdictions',
      license: 'https://creativecommons.org/licenses/by-nc/4.0/',
      isAccessibleForFree: true,
      keywords: ['AI governance', 'AI safety', 'AI regulation', 'autonomous weapons', 'cyber policy']
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Modern Custom Premium Favicon Link + Fast CDN/Tile Preconnects */}
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://basemaps.cartocdn.com" crossOrigin="" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{localStorage.removeItem('operator_pref_mapMode');var t=localStorage.getItem('sovdash_ui_theme')||'obsidian';if(['obsidian','cambridge','emerald','light'].indexOf(t)===-1)t='obsidian';document.documentElement.setAttribute('data-ui-theme',t);if(t==='light'){document.documentElement.classList.add('editorial-light');}else{document.documentElement.classList.remove('editorial-light');}}catch(e){}})();`
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(OBSERVATORY_JSON_LD) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
