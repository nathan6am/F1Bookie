import { betSlipEmbed, publicConfirmEmbed } from "../builders/betSlipEmbed.js";
import { renderOdds } from "../builders/oddsEmbed.js";
import { placeBet } from "../services/betManager.js";
import { clearCache, restoreTicket } from "../services/redisCache.js";

export default {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        if (err) console.error(err);
      }
    } else if (interaction.isSelectMenu()) {
      if (interaction.customId === "odds-select") {
        const category = interaction.values[0];
        const embed = await renderOdds(category);
        await interaction.reply({
          content: null,
          embeds: [embed],
          ephemeral: false,
        });
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "bet-confirm") {
        const discordId = interaction.user.id;
        const ticket = await restoreTicket(discordId);
        if (ticket) {
          try {
            await placeBet(ticket);
            await interaction.update({
              content: "Your bet has been confirmed",
              embeds: [],
              components: [],
              ephemeral: true,
            });
            const embed = publicConfirmEmbed(ticket);
            interaction.followUp({
              content: `<@${interaction.user.id}> has placed a bet!`,
              embeds: [embed],
            });
          } catch (err) {
            console.error(err);
            await interaction.update({
              content: "Unable to place bet. Please try again later",
              embeds: [],
              components: [],
              ephemeral: true,
            });
          }
        }
      } else if (interaction.customId === "bet-cancel") {
        const discordId = interaction.user.id;
        await clearCache(discordId);
        await interaction.update({
          content: "Bet cancelled.",
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.update({
          content: "This ticket has expired. Create a new bet",
          embeds: [],
          components: [],
          ephemeral: true,
        });
      }
    }
  },
};
