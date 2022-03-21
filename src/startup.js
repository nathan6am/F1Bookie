import { scrapeOdds } from "./services/scraper.js";
import { parseOddsData } from "./services/dataParser.js";
import { cacheOdds } from "./services/redisCache.js";
import { refreshOdds } from "./queues/scraperQueue.js";

export default async function startup() {
  const scrapedData = await scrapeOdds();
  const updatedOdds = await parseOddsData(scrapedData);
  await cacheOdds(updatedOdds);
  console.log("intial odds cached");
  refreshOdds();
}
