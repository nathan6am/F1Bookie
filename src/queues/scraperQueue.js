import { createRequire } from "module";
const require = createRequire(import.meta.url);
import scraperProcess from "../processes/scraper.processor.js";
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
