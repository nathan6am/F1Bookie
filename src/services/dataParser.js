import { createRequire } from "module";
const require = createRequire(import.meta.url);
import moment from "moment";
import { getSchedule, getNextRace } from "./redisCache.js";
const Drivers = require("../json/Drivers.json");
const Constructors = require("../json/Constructors.json");
const drivers = Drivers.Drivers;
const constructors = Constructors.Constructors;
const schedule = await getSchedule();
const nextRace = await getNextRace();
//Parse table categories
export function parseOddsData(oddsData) {
  if (!oddsData || oddsData.length < 1) return;
  return oddsData
    .map((data) => {
      const category = parseCategory(data.category);
      if (category) {
        if (category.type === "session") {
          let tables = data.tables
            .map((table) => parseSessionTable(table, category))
            .filter((n) => n);
          return { ...category, tables: tables };
        } else if (category.type === "constructor") {
          let tables = data.tables
            .map((table) => parseConstructorTable(table))
            .filter((n) => n);
          return { ...category, tables: tables };
        } else if (category.type === "drivers") {
          let tables = data.tables
            .map((table) => parseDriversTable(table))
            .filter((n) => n);
          return { ...category, tables: tables };
        }
      }
    })
    .filter((n) => n);
}

function parseCategory(nameString) {
  //console.log(nameString);
  if (nameString === "Constructor Championship 2022") {
    //console.log("creating constructor odds");
    return {
      lastUpdate: moment(),
      type: "constructor",
      title: "2022 Constructor Championship",
    };
  } else if (nameString === "Drivers Championship 2022") {
    return {
      lastUpdate: moment(),
      type: "drivers",
      title: "2022 Drivers Championship",
    };
  } else {
    const [eventString, sessionString, exclude] = nameString.split(" - ");
    if (exclude) return null;
    let eventExclude = ["gp", "grand", "prix"];
    let expStr = eventExclude.join(" | ");
    const event = eventString.replace(new RegExp(expStr, "gi"), " ").trim();
    const parsedEvent = parseEvent(event);
    if (!parsedEvent) return null;
    if (parsedEvent.round !== nextRace.round) return null;
    const sessionObj = parseSession(sessionString, parsedEvent);

    if (sessionObj) {
      const result = {
        ...sessionObj,
        round: parsedEvent.round,
        type: "session",
        lastUpdate: moment(),
      };
      return result;
    } else {
      return null;
    }
  }
}

function parseSession(sessionString, event) {
  switch (sessionString.toLowerCase().trim()) {
    case "race":
      return {
        sessionTitle: `${event.raceName} - Race`,
        sessionType: "race",
        startTime: `${event.date} ${event.time}`,
      };
    case "qualifying":
      return {
        sessionTitle: `${event.raceName} - Qualifying`,
        sessionType: "qualifying",
        startTime: `${event.Qualifying.date} ${event.Qualifying.time}`,
      };
    //Free Practice Temporarily Removed
    // case "free practice i":
    //   return {
    //     sessionTitle: `${event.raceName} - Practice 1`,
    //     sessionType: "fp1",
    //     startTime: `${event.FirstPractice.date} ${event.FirstPractice.time}`,
    //   };
    // case "free practice ii":
    //   return {
    //     sessionTitle: `${event.raceName} - Practice 2`,
    //     sessionType: "fp2",
    //     startTime: `${event.SecondPractice.date} ${event.SecondPractice.time}`,
    //   };
    // case "free practice iii":
    //   return {
    //     sessionTitle: `${event.raceName} - Practice 3`,
    //     sessionType: "fp3",
    //     startTime: `${event.ThirdPractice.date} ${event.ThirdPractice.time}`,
    //   };
    default:
      console.log(
        "Session Value not included in adapter; session will be discarded"
      );
      return null;
  }
}

function parseEvent(event) {
  return schedule.find((race) => {
    const nameString = race.raceName;
    return nameString.toLowerCase().includes(event.toLowerCase());
  });
}

//Parse Tables
function parseSessionTable(table, session) {
  if (session.sessionType === "race") {
    let title = "";
    let betCode = "";
    let type = "";
    let options = [];
    switch (table.title.toLowerCase().trim()) {
      case "race winner": {
        title = "Winner";
        betCode = "win";
        type = "driver";
        options = parseDriverOptions(table.options);
        break;
      }
      case "top 3 bet": {
        title = "Podium Finish";
        betCode = "podium";
        type = "driver";
        options = parseDriverOptions(table.options);
        break;
      }
      case "top-10 bet (driver)": {
        title = "Points Finish";
        betCode = "points";
        type = "driver";
        options = parseDriverOptions(table.options);
        break;
      }
      case "which car will win the race?": {
        title = "Winning Car";
        betCode = "winning-car";
        type = "constructor";
        options = parseConstructorOptions(table.options);
        break;
      }
      case "will both drivers of any team record points in the race?": {
        title = "Double Points Finish";
        betCode = "double-points";
        type = "constructor";
        options = parseConstructorOptions(table.options);
        break;
      }
      case "fastest lap - driver (race)": {
        title = "Fastest Lap ";
        betCode = "fastest-lap";
        type = "driver";
        options = parseDriverOptions(table.options);
        break;
      }
      default: {
        return null;
        // if (table.title.toLowerCase().startsWith("head-to-head")) {
        //   function splitHeadToHeadTitle(title) {
        //     const string = title.replace(/head-to-head/i, "").trim();
        //     const extract = /\((.*?)\)/g;
        //     const expr = /\w+([^\/\w]|^)/g;
        //     const teams = string.match(extract);
        //     if (!(teams.typeOf === "object")) return null;
        //     const res = teams.map(
        //       (str) =>
        //         str
        //           .match(expr)
        //           .map((str) => str.substring(0, str.length - 1))[0]
        //     );

        //     const names = string
        //       .replace(extract, "")
        //       .split("/")
        //       .map((str) => str.trim());
        //     return res;
        //   }

        //   const teams = splitHeadToHeadTitle(table.title);
        //   if (teams[0] === teams[1] && teams[1]) {
        //     const constructorObj = constructors.find((val) =>
        //       val.name.toLowerCase().includes(teams[0].toLowerCase())
        //     );
        //     // parse options
        //     const result = {
        //       title: `Head-to-Head: ${constructorObj.name}`,
        //       betCode: `h2h`,
        //       type: "driver",
        //       options: parseDriverOptions(table.options),
        //     };
        //     return result;
        //   } else {
        //     console.log("non-teammate head to head; discarding");
        //     return null;
        //   }
        // } else {
        //   return null;
        // }
      }
    }
    return {
      title: title,
      betCode: betCode,
      type: type,
      options: options,
    };
  } else if (session.sessionType === "qualifying") {
    let title = "";
    let betCode = "";
    let type = "";
    let options = [];
    switch (table.title.toLowerCase().trim()) {
      case "qualifying winner": {
        title = "Pole Position";
        betCode = "pole";
        type = "driver";
        options = parseDriverOptions(table.options);
        break;
      }
      case "which car will win the qualifying?": {
        title = "Winning Car";
        betCode = "winning-car";
        type = "constructor";
        options = parseConstructorOptions(table.options);
        break;
      }
      case "winning margin 0.250": {
        title = "Winning Margin Over/Under 0.250";
        betCode = "margin";
        type = "margin";
        options = [
          {
            optionType: "margin",
            optionName: "Under",
            optionId: "under",
            oddsValue: parseInt(table.options[0].value),
          },
          {
            optionType: "margin",
            optionName: "Over",
            optionId: "over",
            oddsValue: parseInt(table.options[1].value),
          },
        ];
        break;
      }
      default: {
        return null;
      }
    }
    return {
      title: title,
      betCode: betCode,
      type: type,
      options: options,
    };
  }
}

function parseConstructorTable(table) {
  if (table.title.toLowerCase().includes("winner")) {
    const result = {
      title: "Winner",
      betCode: "win",
      type: "constructor",
      options: parseConstructorOptions(table.options),
    };
    return result;
  }
}

function parseDriversTable(table) {
  if (table.title.toLowerCase().includes("winner")) {
    const result = {
      title: "Winner",
      betCode: "win",
      type: "driver",
      options: parseDriverOptions(table.options),
    };
    return result;
  } else if (table.title.toLowerCase().includes("head-to-head")) {
    function splitHeadToHeadTitle(title) {
      const string = title.replace(/head-to-head/i, "").trim();
      const extract = /\((.*?)\)/g;
      const expr = /\w+([^\/\w]|^)/g;
      const teams = string
        .match(extract)
        .map(
          (str) =>
            str.match(expr).map((str) => str.substring(0, str.length - 1))[0]
        );

      const names = string
        .replace(extract, "")
        .split("/")
        .map((str) => str.trim());
      return teams;
    }

    const teams = splitHeadToHeadTitle(table.title);
    if (teams[0] === teams[1]) {
      const constructorObj = constructors.find((val) =>
        val.name.toLowerCase().includes(teams[0].toLowerCase())
      );
      // parse options
      const result = {
        title: `Head-to-Head: ${constructorObj.name}`,
        betCode: `h2h`,
        type: "driver",
        options: parseDriverOptions(table.options),
      };
      return result;
    } else {
      console.log("non-teammate head to head; discarding");
      return null;
    }
  } else {
    return null;
  }
}

function parseDriverOptions(optionsArr) {
  return optionsArr
    .map((option) => {
      function parseDriverName(option) {
        const extract = /\(([^)]+)\)/i;
        const name = option.replace(extract, "").trim();
        const driverObj = drivers.find((driver) => {
          return name.toLowerCase().includes(
            driver.familyName
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          );
        });
        return driverObj;
      }
      const driver = parseDriverName(option.option);
      if (!driver) return null;
      return {
        optionType: "driver",
        optionName: `${driver.givenName} ${driver.familyName}`,
        optionId: driver.driverId,
        oddsValue: parseInt(option.value),
      };
    })
    .filter((n) => n);
}

function parseConstructorOptions(optionsArr) {
  return optionsArr.map((option) => {
    let constructorName = option.option.toLowerCase();
    //console.log(constructorName);
    let value = parseInt(option.value);
    const constructorObj = constructors.find((val) =>
      val.name.toLowerCase().includes(constructorName)
    );
    if (constructorObj) {
      return {
        optionType: "constructor",
        optionName: constructorObj.name,
        optionId: constructorObj.constructorId,
        oddsValue: value,
      };
    } else {
      return null;
    }
  });
}
