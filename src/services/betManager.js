import { createRequire } from "module";
const require = createRequire(import.meta.url);
import moment from "moment";
import { getOdds, getNextRace, getSchedule } from "./redisCache.js";
import { User, Bet } from "../schema/Models.js";
import {
  getConstructorPositions,
  getDriverPosition,
  getFastestLap,
  getWinningQauliMagin,
} from "./resultsApi.js";
import { convertDriverId } from "./conversions.js";

export async function validateTicket({
  event,
  betCode,
  optionValue,
  stake,
  userId,
}) {
  let comparison = null;
  const user = await User.findOne({ discordId: userId }).exec();
  if (!user) {
    return {
      valid: false,
      message:
        "Please register with F1 Bookie using /register to start placing bets!",
    };
  }

  const Drivers = require("../json/Drivers.json");
  const drivers = Drivers.Drivers;
  const driver = drivers.find(
    (driver) => driver.code.toLowerCase() === optionValue.toLowerCase()
  );
  let altId;
  if (driver) {
    altId = driver.driverId;
  }
  const oddsData = await getOdds();
  if (!oddsData) return {valid: false, message: "Unable to place bet, odds are not available right now, please try again later."}
  //verify event val
  const validatedEvent = oddsData.find(
    (cat) =>
      event.toLowerCase() === cat.type ||
      event.toLowerCase() === cat.sessionType
  );
  if (!validatedEvent) {
    return {
      valid: false,
      message:
        `Couldn't find event "${event}".` +
        " Use ``/odds`` to view avilable events",
    };
  } else if (
    validatedEvent.type === "session" &&
    moment().isAfter(moment(validatedEvent.startTime))
  ) {
    return {
      valid: false,
      message:
        `Unable to place bet. Books for ${validatedEvent.sessionTitle} have closed.` +
        " Use ``/odds`` to view avilable events",
    };
  }
  //verify bet code
  const tables = validatedEvent.tables;
  const validatedTable = tables.find(
    (table) => table.betCode.toLowerCase() === betCode.toLowerCase()
  );
  if (!validatedTable) {
    return {
      valid: false,
      message:
        `"${betCode} is not a valid bet code for this event".` +
        " Use ``/odds`` to find the correct code for the bet you would like to place",
    };
  }

  const options = validatedTable.options;
  const optionId = convertDriverId(optionValue)
    .replace("-", "_")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const validatedOption = options.find(
    (option) => option.optionId === optionId || option.optionId === altId
  );
  if (!validatedOption) {
    return {
      valid: false,
      message:
        `"${optionValue} is not a valid selection for this bet".` +
        ' For drivers, use the surname e.g. "verstappen" or the 3 letter driver code e.g. "VER". For constructors, make sure to replace spaces with "-" or "_" e.g. "red-bull/red_bull". For over/unders, simply use "over" or "under". Use ``/help`` for more information on how to place bets.',
    };
  }
  if (betCode.toLowerCase() === "h2h") {
    const opposingOption = options.find(
      (option) => option.optionId !== optionId
    );
    if (opposingOption) {
      comparison = opposingOption.optionId;
    }
  }
  if (!Number.isInteger(stake)) {
    return { valid: false, message: "Amount must be an integer value" };
  } else if (user.balance < stake) {
    return {
      valid: false,
      message:
        "Your balance is too low to place this bet. Your current balance is $" +
        `${user.balance}`,
    };
  } else if (stake < 10) {
    return {
      valid: false,
      message: "Bets must be a minimum of $10",
    };
  }

  return {
    valid: true,
    ticket: {
      stake: parseInt(stake),
      round: parseInt(validatedEvent.round) || 0,
      session: validatedEvent.sessionType || validatedEvent.type,
      betCode: validatedTable.betCode,
      pick: validatedOption.optionId,
      comparePick: comparison,
      user: user._id,
      odds: parseInt(validatedOption.oddsValue),
      description: {
        sessionTitle: validatedEvent.sessionTitle || validatedEvent.title,
        title: validatedTable.title,
        optionName: validatedOption.optionName,
      },
    },
  };
}

export async function placeBet(ticket) {
  const userId = ticket.user;
  const myNewTicket = await Bet.create(ticket);
  await User.findByIdAndUpdate(userId, {
    $push: { openBets: myNewTicket._id },
    $inc: { balance: ticket.stake * -1 },
  });
  console.log("bet placed");
}

export function calculatePayout(stake, odds) {
  if (odds > 0) {
    return Math.round(stake + stake * (odds / 100));
  } else {
    return Math.round(stake + stake * (100 / (odds * -1)));
  }
}
export async function evaluateBet(bet) {
  if (bet.round > 0) {
    let status = "open";
    let betWon = false;
    const schedule = await getSchedule();
    const event = schedule.find((event) => event.round == bet.round);
    const startTime =
      bet.session === "qualifying"
        ? `${event.Qualifying.date} ${event.Qualifying.time}`
        : `${event.date} ${event.time}`;
    if (moment().isBefore(moment(startTime))) {
      return {
        status: "open",
        betWon: betWon,
      };
    }

    switch (bet.betCode) {
      case "pole":
        {
          let position = await getDriverPosition(
            bet.round,
            "qualifying",
            bet.pick
          );
          if (position) {
            status = "closed";
            betWon = position == 1;
          }
        }
        break;
      case "win":
        {
          let position = await getDriverPosition(bet.round, "race", bet.pick);
          if (position) {
            status = "closed";
            betWon = position == 1;
          }
        }
        break;
      case "podium":
        {
          let position = await getDriverPosition(bet.round, "race", bet.pick);
          if (position) {
            status = "closed";
            betWon = position <= 3;
          }
        }
        break;
      case "points":
        {
          let position = await getDriverPosition(bet.round, "race", bet.pick);
          if (position) {
            status = "closed";
            betWon = position <= 10;
          }
        }
        break;
      case "winning-car":
        {
          let results = await getConstructorPositions(
            bet.round,
            "race",
            bet.pick
          );
          if (results) {
            status = "closed";
            betWon = results.some((result) => result.position == 1);
          }
        }
        break;
      case "double-points":
        {
          let results = await getConstructorPositions(
            bet.round,
            "race",
            bet.pick
          );
          if (results) {
            status = "closed";
            betWon = results.every((result) => result.position >= 10);
          }
        }
        break;
      case "margin":
        {
          let margin = await getWinningQauliMagin(bet.round);
          if (margin) {
            let over = margin > 250;
            if (margin === 250) {
              status = "pushed";
            } else if (bet.pick === "over") {
              status = "closed";
              betWon = over;
            } else {
              status = "closed";
              betWon = !over;
            }
          }
        }
        break;
      case "fastest-lap":
        {
          const driver = convertDriverId(bet.pick);
          const result = getFastestLap(bet.round);
          if (result) {
            status = "closed";
            betWon = result === driver;
          }
        }
        break;
      default:
        {
          status = "open";
        }
        break;
    }
    return {
      status: status,
      betWon: betWon,
    };
  }
}
