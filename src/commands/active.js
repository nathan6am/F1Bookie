import { SlashCommandBuilder } from "@discordjs/builders";
import { renderOpenBets } from "../builders/openBetsEmbed.js";
import { User, Bet } from "../schema/Models.js";

export default {
  data: new SlashCommandBuilder()
    .setName("active")
    .setDescription("See a list of your active bets"),
  async execute(interaction) {
    let userId = interaction.user.id;
    const user = await User.findOne({ discordId: userId }).populate("openBets");
    if (!user) {
      interaction.reply({
        content:
          "You are not registered with F1 bookie. Use ``/register`` to start using F1 Bookie",
        ephemeral: true,
      });
    } else {
      let bets = user.openBets;
      console.log(user);
      if (bets && bets.length > 0) {
        let embed = renderOpenBets(bets, interaction.user);
        interaction.reply({
          content: `Active bets for <@${interaction.user.id}>`,
          embeds: [embed],
        });
      } else {
        interaction.reply({
          content: "You have no active bets at this time",
          ephemeral: true,
        });
      }
    }
  },
};
