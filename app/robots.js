export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/methodology', '/jurisdictions', '/jurisdiction/', '/signal/', '/labs', '/compute', '/compare', '/readiness'],
        disallow: ['/api/admin/', '/api/auth/', '/api/cron/']
      }
    ],
    sitemap: 'https://app.sovdash.com/sitemap.xml'
  };
}
