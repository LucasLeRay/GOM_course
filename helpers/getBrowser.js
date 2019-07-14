const puppeteer = require("puppeteer");

const options = {
  headless: true,
  slowMo: 100
};

function getBrowser() {
  return puppeteer.launch(options);
}

module.exports = getBrowser;
