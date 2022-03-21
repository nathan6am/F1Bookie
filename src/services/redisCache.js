import { createClient } from "redis";
import axios from "axios";
import mongoose from "mongoose";

const baseUrl = "http://ergast.com/api/f1/";
const season = "2022";
const ttl = 3600;
const redisClient = createClient({ url: process.env.REDIS_CACHE_URL });

redisClient.on("error", (err) => console.log("Redis redisClient Error", err));

console.log("connecting to redisClient");
await redisClient.connect();
console.log("connected");

export async function cacheOdds(oddsData) {
  console.log("caching odds");
  await redisClient.setEx("oddsData", ttl, JSON.stringify(oddsData));
  console.log("cached");
}
export async function cacheTicket(ticket, discordId) {
  const open = await redisClient.get(discordId);
  if (open) return false;
  const hexId = ticket.user.toString();
  let cacheTicket = ticket;
  cacheTicket.user = hexId;
  await redisClient.setEx(discordId, 300, JSON.stringify(cacheTicket));
  return true;
}
export async function clearCache(key) {
  await redisClient.del(key);
  return;
}
export async function restoreTicket(discordId) {
  const cachedTicketString = await redisClient.get(discordId);
  if (!cachedTicketString) {
    return null;
  }
  const cachedTicket = JSON.parse(cachedTicketString);
  const hexString = cachedTicket.user;
  const user = mongoose.Types.ObjectId.createFromHexString(hexString);
  let restoredTicket = cachedTicket;
  restoredTicket.user = user;
  await redisClient.del(discordId);
  return restoredTicket;
}

export async function getOdds() {
  const jsonString = await redisClient.get("oddsData");
  if (jsonString) {
    return JSON.parse(jsonString);
  } else {
    return null;
  }
}

export async function getSchedule() {
  let data = null;

  const jsonData = await redisClient.get("raceSchedule");

  if (jsonData !== null) {
    console.log("cacheHit");
    data = JSON.parse(jsonData);
  } else {
    //Fetch schedule from api, cache to redis
    console.log("no cached data for race schedule, fetching data");
    const res = await axios
      .get(`${baseUrl}${season}.json`)
      .catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
      });
    console.log("data fetched, caching to redis");
    data = res.data["MRData"]["RaceTable"]["Races"];
    await redisClient.setEx("raceSchedule", ttl, JSON.stringify(data));

    console.log("data cached");
  }
  return data;
}

export async function getNextRace() {
  let data = null;
  const jsonData = await redisClient.get("nextRace");

  //Check if nextRace exists in the redis cache
  if (jsonData !== null) {
    console.log("cacheHit");
    data = JSON.parse(jsonData);
  } else {
    //Fetch next race from api, cache to redis
    console.log("no cached data for upcoming race, fetching data");
    const res = await axios
      .get(`${baseUrl}${season}/next.json`)
      .catch(function (error) {
        if (error.response) {
          // Request made and server responded
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
      });
    console.log("data fetched, caching to redis");
    data = res.data["MRData"]["RaceTable"]["Races"][0];
    await redisClient.setEx("nextRace", ttl, JSON.stringify(data));

    console.log("data cached");
  }
  return data;
}
