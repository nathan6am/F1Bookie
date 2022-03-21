import { SlashCommandBuilder } from "@discordjs/builders";
import { renderClosedBets } from "../builders/claimsEmbed.js";
import { renderOpenBets } from "../builders/openBetsEmbed.js";
import { User, Bet } from "../schema/Models.js";
import { calculatePayout, evaluateBet } from "../services/betManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim any completed bets"),
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
      const bets = user.openBets.map((bet) => bet.toObject());
      console.log(bets);
      if (bets && bets.length > 0) {
        const ids = bets.map((bet) => bet._id);
        let betsToClose = [];
        for (let bet of bets) {
          let result = await evaluateBet(bet);
          if (result.status === "closed") {
            betsToClose.push({
              ...bet,
              status: result.status,
              betWon: result.betWon,
            });
          }
        }
        console.log(betsToClose);
        if (betsToClose.length === 0) {
          interaction.reply({
            content:
              "You have no bets to claim at this time. Use ``/active`` to see a list of your active bets",
            ephemeral: true,
          });
        } else {
          const closedIds = betsToClose.map((bet) => bet._id);
          user.openBets = ids.filter((id) => !closedIds.includes(id));
          user.closedBets = [...user.closedBets, ...closedIds];
          let payout = 0;
          const betsWon = betsToClose.filter((bet) => bet.betWon);
          console.log(betsWon);
          betsWon.forEach(
            (bet) => (payout = payout + calculatePayout(bet.stake, bet.odds))
          );
          console.log(payout);
          const updatedBalance = user.balance + payout;
          user.balance = updatedBalance;
          const updatedUser = await user.save();
          if (updatedUser) {
            const embed = renderClosedBets(betsToClose, payout, updatedBalance);
            interaction.reply({
              content: `Results for <@${interaction.user.id}>`,
              embeds: [embed],
              ephemeral: false,
            });
          } else {
            interaction.reply({
              content: "Unable to claim bets. Please try again later",
              ephemeral: true,
            });
          }
        }
      } else {
        interaction.reply({
          content: "You have no bets to claim at this time",
          ephemeral: true,
        });
      }
    }
  },
};
