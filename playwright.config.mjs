export default {
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'https://app.sovdash.com',
    headless: true
  }
};
