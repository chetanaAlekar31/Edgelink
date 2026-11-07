/* eslint-disable @typescript-eslint/no-require-imports */
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/dataforseo.mock');

async function getRankings() {
  if (USE_MOCKS) return mockData;
  // Real DataForSEO API call goes here
  return null;
}

module.exports = { getRankings };
