const puppeteer = require("puppeteer");
const getBrowser = require("./helpers/getBrowser");
const writeFile = require("./helpers/writeFile");

async function startupLinksFromPage(page) {
  await page.waitForSelector("article > section > a");
  return page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll("article > section > a")
    );
    return links.map(link => link.href);
  });
}

async function infosFromPage(browser, url) {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector(".txtArt");
  const company = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll(".txtArt"));
    return sections.reduce((accumulator, section) => {
      return section.attributes.itemprop
        ? {
            ...accumulator,
            [section.attributes.itemprop.nodeValue.replace(
              /'/g,
              ""
            )]: section.innerText.replace(/\t|\n|'/g, " ")
          }
        : accumulator;
    });
  });
  await page.waitForSelector(".deco");
  const infos = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll(".deco > ul > li"));
    return sections.reduce((accumulator, section) => {
      const cleanedChildrens = [...section.children].filter(
        children =>
          ["P", "DIV"].includes(children.nodeName) && children.innerText
      );
      return {
        ...accumulator,
        [cleanedChildrens[0].textContent.replace(
          / |'/g,
          ""
        )]: cleanedChildrens[1].innerText.replace(/\n|'/g, " ")
      };
    });
  });
  await page.close();
  console.log({
    ...company,
    ...infos
  });
  writeFile("data.json", { ...company, ...infos });
  return {
    ...company,
    ...infos
  };
}

async function isNextPage(page) {
  await page.waitForSelector("div.pagination");
  try {
    return page.evaluate(() => {
      return !!document.querySelector("a[rel=next]");
    });
  } catch (err) {
    return false;
  }
}

async function goNextPage(page, pageNumber) {
  await page.goto(
    `https://www.usine-digitale.fr/annuaire-start-up/${pageNumber + 1}/`,
    { waitUntil: "networkidle2" }
  );
}

async function scrap(search) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const pageNumber = 1;
  let infos = [];

  await page.goto(`https://www.usine-digitale.fr/annuaire-start-up/`);

  try {
    do {
      const startups = await startupLinksFromPage(page);
      await Promise.all(
        startups.map(startup => infosFromPage(browser, startup))
      ).then(values => (infos = [...infos, ...values]));
      await goNextPage(page);
      pageNumber += 1;
    } while (await isNextPage());
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
}

scrap();
