import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageActionRow, MessageSelectMenu } from "discord.js";
import { createRequire } from "module";
import { getOdds } from "../services/redisCache.js";
const require = createRequire(import.meta.url);

export default {
  data: new SlashCommandBuilder()
    .setName("odds")
    .setDescription("Get live betting odds"),
  async execute(interaction) {
    await interaction.deferReply()
    const oddsData = await getOdds();
    if (!oddsData || oddsData.length === 0) {
      await interaction.updateReply({
        content:
          "There are no odds avaialble at this time -- please try again later",
        ephemeral: true,
      });
      return;
    }
    const options = [];
    oddsData.forEach((category) => {
      if (category.type == "session") {
        options.push({
          label:
            category.sessionType.charAt(0).toUpperCase() +
            category.sessionType.slice(1),
          description: category.sessionTitle,
          value: category.sessionType,
        });
      } else {
        options.push({
          label: category.type.charAt(0).toUpperCase() + category.type.slice(1),
          description: category.title,
          value: category.type,
        });
      }
    });
    if (options.length > 0) {
      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId("odds-select")
          .setPlaceholder("Nothing is selected")
          .setMinValues(1)
          .setMaxValues(1)
          .setOptions(options)
      );

      await interaction.updateReply({
        content: "Select a category to view odds",
        components: [row],
        ephemeral: true,
      });
    } else {
      await interaction.updateReply({
        content:
          "There are no odds avaialble at this time -- please try again later",
        ephemeral: true,
      });
    }
  },
};
