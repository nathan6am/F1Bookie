import { SlashCommandBuilder } from "@discordjs/builders";
import { placeBet, validateTicket } from "../services/betManager.js";
import { MessageActionRow, MessageButton } from "discord.js";
import { cacheTicket, getOdds } from "../services/redisCache.js";
import { betSlipEmbed } from "../builders/betSlipEmbed.js";
// const oddsData = await getOdds();
// const choices = [];
// oddsData.forEach((category) => {
//   if (category.type == "session") {
//     choices.push(category.sessionType);
//   } else {
//     choices.push(category.type);
//   }
// });
// console.log(choices);
export default {
  data: new SlashCommandBuilder()
    .setName("bet")
    .setDescription("use /help for more information on how to place bets")
    .addStringOption((option) =>
      option
        .setName("event")
        .setDescription("The event you would like to bet on")
        .setRequired(true)
        .addChoice("qualifying", "qualifying")
        .addChoice("race", "race")
        .addChoice("drivers", "drivers")
        .addChoice("constructor", "constructor")
    )
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription(`use /odds to find bet-codes e.g. "win" or "podium"`)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("pick")
        .setDescription(`Your pick for the bet`)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount you would like to bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    
    const prelimTicket = {
      userId: interaction.user.id,
      event: interaction.options.getString("event"),
      betCode: interaction.options.getString("code"),
      optionValue: interaction.options.getString("pick"),
      stake: interaction.options.getInteger("amount"),
    };
    // verify ticket
    const { valid, ticket, message } = await validateTicket(prelimTicket);
    if (!valid) {
      await interaction.reply({
        content: message,
      });
    } else {
      const embed = betSlipEmbed(ticket);
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setLabel("Cancel")
            .setStyle("DANGER")
            .setCustomId("bet-cancel")
        )
        .addComponents(
          new MessageButton()
            .setLabel("Confirm")
            .setStyle("SUCCESS")
            .setCustomId("bet-confirm")
        );
      await cacheTicket(ticket, interaction.user.id);
      await interaction.reply({
        content: "Confirm your bet",
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    }
  },
};
