import { MessageEmbed } from "discord.js";
import { calculatePayout } from "../services/betManager.js";

function splitBySessionTitle(bets) {
  let sessionTitles = bets.map((bet) => bet.description.sessionTitle);
  let sessions = [...new Set(sessionTitles)];
  let result = sessions.map((session) => {
    return {
      title: session,
      bets: bets.filter((bet) => bet.description.sessionTitle === session),
    };
  });
  return result;
}

export function renderOpenBets(bets) {
  const betsBySession = splitBySessionTitle(bets);
  const fields = betsBySession.map((session) => {
    const valueLines = session.bets.map((bet) => {
      const odds = (bet.odds < 0 ? "" : "+") + bet.odds;
      return (
        "```" +
        `${bet.description.title}: \n ${bet.description.optionName} ${odds} \n Stake: $${bet.stake}` +
        "```"
      );
    });

    return {
      name: session.title,
      value: valueLines.join("\n"),
    };
  });
  const embed = new MessageEmbed()
    .setTitle("Active Bets")
    .setDescription("use ``/claim`` to claim any completed bets")
    .addFields(fields);
  return embed;
}
