/* eslint-disable @typescript-eslint/no-require-imports */
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/gsc.mock');

async function getSearchConsole() {
  if (USE_MOCKS) return mockData;
  // Real Google Search Console API call goes here
  return null;
}

module.exports = { getSearchConsole };
