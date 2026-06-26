const genericPool = require('generic-pool');
const puppeteer = require('puppeteer');

const factory = {
  create: async function() {
    return await puppeteer.launch({ 
      headless: 'new', 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
  },
  destroy: async function(browser) {
    try {
      await browser.close();
    } catch (e) {
      // Ignore destroy errors
    }
  },
  validate: async function(browser) {
    try {
      // Check if browser is still connected
      return browser.isConnected();
    } catch (e) {
      return false;
    }
  }
};

const browserPool = genericPool.createPool(factory, {
  max: 4, // maximum size of the pool
  min: 1, // minimum size of the pool
  testOnBorrow: true, // validates the browser before using it
});

module.exports = browserPool;
