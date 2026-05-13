import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata = {
  title: 'Sovereign Intelligence Dashboard',
  description: 'Real-time intelligence analysis dashboard for LAWS tracking, state violations, and corporate complicity monitoring.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
