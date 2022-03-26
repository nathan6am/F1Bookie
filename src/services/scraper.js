import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const retry = require("async-await-retry");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const baseUrl = "https://sports.nj.betmgm.com";
const startPage = "/en/sports/formula-1-6/betting/world-6";

export async function scrapeOdds() {
  try {
    let data = [];
    const browser = await puppeteer.launch({ headless: true });

    console.log("Browser launched");
    const page = await browser.newPage();

    //Get list of available categories
    const categories = await refreshCatgories(page);
    if (!categories || categories.length < 1) return [];
    //Pull odds data for each table of category
    for (const category of categories) {
      const { title, href } = category;
      let tables = await getTable(page, href);
      data.push({
        category: title,
        tables: tables,
      });
    }
    await browser.close();
    return data;
  } catch (err) {
    console.error(err);
  }
}

async function refreshCatgories(page) {
  try {
    let categories = [];
    console.log(`loading page: ${baseUrl}${startPage}`);
    let url = `${baseUrl}${startPage}`;

    await page.goto(url, { waitUntil: "networkidle0" });

    let html = await page.evaluate(() => document.querySelector("*").outerHTML);
    console.log(html)
    const $ = cheerio.load(html);

    //Get links for all bets per event
    $(".event-all-bets").each(function (i, elem) {
      categories[i] = {
        title: $(this).siblings(".event-info").children(".event-name").text(),
        href: $(this).attr("href"),
      };
    });
    console.log(categories.map((category) => category.title));
    return categories;
  } catch (err) {
    console.error(err);
  }
}

async function getTable(page, href) {
  try {
    const url = `${baseUrl}${href}?market=-1`;
    console.log(`loading page: ${url}`);
    await page.goto(url, { waitUntil: "networkidle0" });
    // Scroll down to force lazy-load of all odds data
    await page.hover(".column-center.ng-scrollbar");
    await page.mouse.wheel({ deltaY: 10000 });
    await page.waitForTimeout(5000);
    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );
    console.log("page loaded");
    const $ = cheerio.load(data);
    let tables = [];
    $(".option-panel").each(function (i, elem) {
      let options = [];
      $(this)
        .find(".option-indicator")
        .each(function (i, elem) {
          options[i] = {
            option: $(this).children(".name").text(),
            value: $(this).children(".value").text(),
          };
        });
      tables[i] = {
        title: $(this).find(".option-group-name-info-name").text(),
        options: options,
      };
    });

    return tables;
  } catch (err) {
    console.error(err);
  }
}
