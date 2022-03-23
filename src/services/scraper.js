import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const baseUrl = "https://sports.nj.betmgm.com";
const startPage = "/en/sports/formula-1-6/betting/world-6";
function wait(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

async function refreshCatgories(page) {
  try {
    let categories = [];
    console.log(`loding page: ${baseUrl}${startPage}`);
    await page.goto(`${baseUrl}${startPage}`, { waitUntil: "networkidle0" });
    let html = await page.evaluate(() => document.querySelector("*").outerHTML);
    //console.log(html);
    const $ = cheerio.load(html);
    //Get Category names
    $(".event-all-bets").each(function (i, elem) {
      categories[i] = {
        title: $(this).siblings(".event-info").children(".event-name").text(),
        href: $(this).attr("href"),
      };
    });
    console.log(categories);
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
    await page.hover(".column-center.ng-scrollbar");
    await page.mouse.wheel({ deltaY: 6000 });
    await wait(6000);
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

export async function scrapeOdds() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    console.log("browser launched");
    const [page] = await browser.pages();
    let data = [];

    const categories = await refreshCatgories(page);
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
