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
  try {
    await page.goto(url);
    await page.waitForSelector(".titreFicheStartUp");
    const title = await page.evaluate(() => {
      const title = document.querySelector(".titreFicheStartUp");
      return title && title.innerText;
    });
    await page.waitForSelector(".txtArt");
    const company = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll(".txtArt"));
      return sections.reduce((accumulator, section) => {
        const sectionName = section.attributes.itemprop
          ? section.attributes.itemprop.nodeValue.replace(/'/g, "").trim()
          : null;
        const sectionValue = section.innerText.replace(/\t|'/g, " ");
        return sectionName
          ? {
              ...accumulator,
              [sectionName]:
                sectionName === "founders"
                  ? sectionValue.split("\n")
                  : sectionValue
            }
          : accumulator;
      });
    });
    await page.waitForSelector(".deco");
    const infos = await page.evaluate(() => {
      const sections = [
        [],
        ...Array.from(document.querySelectorAll(".deco > ul > li"))
      ];
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
    writeFile("data.json", { title, ...company, ...infos });
    return {
      title,
      ...company,
      ...infos
    };
  } catch (err) {
    console.log(err);
  } finally {
    await page.close();
  }
}

async function goNextPage(page, pageNumber) {
  await page.goto(
    `https://www.usine-digitale.fr/annuaire-start-up/start-up-du-web/${pageNumber +
      1}/`,
    { waitUntil: "networkidle2" }
  );
}

async function scrap(beginAt) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  let pageNumber = Number(beginAt) || 1;
  let infos = [];

  await page.goto(
    `https://www.usine-digitale.fr/annuaire-start-up/start-up-du-web/`
  );

  try {
    while (true) {
      console.log(pageNumber);
      const startups = await startupLinksFromPage(page);
      await Promise.all(
        startups.map(startup => infosFromPage(browser, startup))
      ).then(values => (infos = [...infos, ...values]));
      await goNextPage(page, pageNumber);
      pageNumber += 1;
    }
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
}

scrap(process.argv[2]);
