import { scrapeOdds } from "../services/scraper.js";
import { parseOddsData } from "../services/dataParser.js";
import { cacheOdds } from "../services/redisCache.js";
import { refreshOdds } from "../queues/scraperQueue.js";
const scraperProcess = async (job, done) => {
  const scrapedData = await scrapeOdds();
  if (!scrapedData) throw new Error("Unable to fetch odds data");
  const updatedOdds = await parseOddsData(scrapedData);
  await cacheOdds(updatedOdds);
  refreshOdds();
  done();
};

export default scraperProcess;
