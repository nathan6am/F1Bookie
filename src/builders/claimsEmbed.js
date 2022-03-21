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

export function renderClosedBets(bets, payout, balance) {
  let totalStake = 0;
  bets.forEach((bet) => (totalStake = totalStake + bet.stake));
  let winnings = payout - totalStake;
  const betsBySession = splitBySessionTitle(bets);
  const fields = betsBySession.map((session) => {
    const valueLines = session.bets.map((bet) => {
      const odds = (bet.odds < 0 ? "" : "+") + bet.odds;
      return (
        "```" +
        `${bet.description.title}: \n ${bet.description.optionName} ${odds} \n Stake: $${bet.stake}\n` +
        ` Result:${
          bet.betWon
            ? `✔️Won - Payout: $${calculatePayout(bet.stake, bet.odds)}`
            : `❌Lost`
        }` +
        "```"
      );
    });

    return {
      name: session.title,
      value: valueLines.join("\n"),
      inline: true,
    };
  });

  const embed = new MessageEmbed()
    .setTitle("Results")
    .setDescription("use ``/active`` to view a list of any remaining open bets")
    .addFields(fields)
    .addField(
      "Summary:",
      "Total Payout:" +
        "```" +
        `$${payout}` +
        "```\n" +
        "Total Stake:" +
        "```" +
        `$${totalStake}` +
        "```\n" +
        "Net Winnings:" +
        "```" +
        `${winnings > 0 ? "$" + winnings : "-$" + winnings * -1}` +
        "```\n" +
        `Your current balance is now $${balance}`
    );

  return embed;
}
