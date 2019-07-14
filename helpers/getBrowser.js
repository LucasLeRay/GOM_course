const puppeteer = require("puppeteer");

const options = {
  headless: true,
  slowMo: 100,
  args: ["--no-sandbox"]
};

function getBrowser() {
  return puppeteer.launch(options);
}

module.exports = getBrowser;
