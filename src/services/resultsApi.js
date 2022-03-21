import axios from "axios";
import moment from "moment";
const baseUrl = "http://ergast.com/api/f1/";
const season = "2022";

export async function getDriverPosition(round, session, driverId) {
  let url;
  let resultType;
  const driver = convertDriverId(driverId);
  if (session === "qualifying") {
    url = `${baseUrl}${season}/${round}/drivers/${driver}/qualifying.json`;
    resultType = "QualifyingResults";
  } else if (session === "race") {
    url = `${baseUrl}${season}/${round}/drivers/${driver}/results.json`;
    resultType = "Results";
  }
  const res = await axios.get(url).catch(function (error) {
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
  let races = res.data.MRData.RaceTable.Races;
  if (!races || races.length < 1) return null;
  let position = races[0][resultType][0]["position"];
  return position;
}
export async function getConstructorPositions(round, session, constructorId) {
  let url;
  let resultType;
  if (session === "qualifying") {
    url = `${baseUrl}${season}/${round}/constructors/${constructorId}/qualifying.json`;
    resultType = "QualifyingResults";
  } else if (session === "race") {
    url = `${baseUrl}${season}/${round}/constructors/${constructorId}/results.json`;
    resultType = "Results";
  }
  const res = await axios.get(url).catch(function (error) {
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
  let races = res.data.MRData.RaceTable.Races;
  if (!races || races.length < 1) return null;
  let drivers = races[0][resultType];
  const results = drivers.map((driver) => {
    return {
      position: driver.position,
      driver: driver.Driver.driverId,
    };
  });
  return results;
}
export async function getWinningQauliMagin(round) {
  let url = `${baseUrl}${season}/${round}/qualifying.json`;
  const res = await axios.get(url).catch(function (error) {
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

  let races = res.data.MRData.RaceTable.Races;
  if (!races || races.length < 1) return null;

  let results = races[0]["QualifyingResults"];

  if (!results) return null;
  let times = results
    .filter((driver) => parseInt(driver.position) <= 2)
    .map((driver) => driver["Q3"]);

  if (times.length != 2) return null;
  const diff = moment(times[1], "m:ss:SSS").diff(moment(times[0], "m:ss:SSS"));
  return diff;
}
export async function getFastestLap(round) {
  let url = `${baseUrl}${season}/${round}/fastest/1/results.json`;

  const res = await axios.get(url).catch(function (error) {
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
  let races = res.data.MRData.RaceTable.Races;
  if (!races || races.length < 1) return null;
  let result = races[0].Results[0].Driver.driverId;
  return result;
}

function convertDriverId(driverId) {
  switch (driverId) {
    case "verstappen":
      return "max_verstappen";
    case "schumacher":
      return "mick_schumacher";
    case "magnussen":
      return "kevin_magnussen";
    default:
      return driverId;
  }
}
