import { createRequire } from "module";
const require = createRequire(import.meta.url);
import scraperProcess from "../processes/scraper.processor.js";

import { scrapeOdds } from "../services/scraper.js";
import { parseOddsData } from "../services/dataParser.js";
import { cacheOdds } from "../services/redisCache.js";
//import { refreshOdds } from "../queues/scraperQueue.js";
// const scraperProcess = async (job, done) => {
//   const scrapedData = await scrapeOdds();
//   if (!scrapedData) throw new Error("Unable to fetch odds data");
//   const updatedOdds = await parseOddsData(scrapedData);
//   await cacheOdds(updatedOdds);
//   refreshOdds();
//   done();
// };

// export default scraperProcess;

const Queue = require("bull");

const crawlerQueue = new Queue("web crawling", {
  redis: process.env.REDIS_CACHE_URL,
});

crawlerQueue.process(scraperProcess);
export function refreshOdds() {
  crawlerQueue.add(
    { testData: "test" },
    {
      repeat: {
        cron: "*/30 * * * *",
      },
      removeOnComplete: 5,
      attempts: 5,
    }
  );
}
