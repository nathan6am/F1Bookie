import { SlashCommandBuilder } from "@discordjs/builders";
import { renderOpenBets } from "../builders/openBetsEmbed.js";
import { User } from "../schema/Models.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("See a list of your active bets"),
  async execute(interaction) {
    let userId = interaction.user.id;
    const user = await User.findOne({ discordId: userId });

    if (!user) {
      interaction.reply({
        content:
          "You are not registered with F1 bookie. Use ``/register`` to start using F1 Bookie",
        ephemeral: true,
      });
      return;
    }
    let balance = user.balance
    let stats = user.stats
  },
};
