import { MessageEmbed, MessageActionRow, MessageButton } from "discord.js";
import { User } from "../schema/Models.js";
import { calculatePayout } from "../services/betManager.js";
export function betSlipEmbed(ticket) {
  const embed = new MessageEmbed()
    .setTitle(ticket.description.title)
    .setDescription(
      ticket.description.sessionTitle +
        "                                                     "
    )
    //.addField("\u200b", "\u200b")
    .addField("Pick:", "```" + ticket.description.optionName + "```")
    .addField(
      "Odds:",
      "```" + (ticket.odds < 0 ? "" : "+") + ticket.odds + "```"
    )
    .addField("Stake:", "```$" + ticket.stake + "```")
    .addField(
      "Potential payout:",
      "```" + "$" + calculatePayout(ticket.stake, ticket.odds) + "```"
    )
    .setFooter({ text: "*This ticket will expire after 3 minutes*" });

  return embed;
}
export function publicConfirmEmbed(ticket) {
  const embed = new MessageEmbed()
    .setTitle(ticket.description.title)
    .setDescription(
      ticket.description.sessionTitle +
        "                                                     "
    )
    //.addField("\u200b", "\u200b")
    .addField("Pick:", "```" + ticket.description.optionName + "```")
    .addField(
      "Odds:",
      "```" + (ticket.odds < 0 ? "" : "+") + ticket.odds + "```"
    )
    .addField("Stake:", "```$" + ticket.stake + "```")
    .addField(
      "Potential payout:",
      "```" + "$" + calculatePayout(ticket.stake, ticket.odds) + "```"
    );

  return embed;
}
