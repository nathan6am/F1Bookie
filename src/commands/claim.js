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
    // Prompt to register if user does not exist
    if (!user) {
      interaction.reply({
        content:
          "You are not registered with F1 bookie. Use ``/register`` to start using F1 Bookie",
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply()
    const bets = user.openBets.map((bet) => bet.toObject());

 
    if (!bets || bets.length < 1) {
      interaction.editReply({
        content: "You have no bets to claim at this time",
        ephemeral: true,
      });
      return;
    }

    const ids = bets.map((bet) => bet._id);
    let betsToClose = [];

    //Evaluate open bets 
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

    if (betsToClose.length === 0) {
      interaction.editReply({
        content:
          "You have no bets to claim at this time. Use ``/active`` to see a list of your active bets",
        ephemeral: true,
      });
      return;
    }

    //Update user in memory and save to db
    const closedIds = betsToClose.map((bet) => bet._id);
    user.openBets = ids.filter((id) => !closedIds.includes(id));
    
    let payout = 0;
    const betsWon = betsToClose.filter((bet) => bet.betWon);
    betsWon.forEach(
      (bet) => (payout = payout + calculatePayout(bet.stake, bet.odds))
    );
   
    const updatedBalance = user.balance + payout;
    user.balance = updatedBalance;
    const updatedUser = await user.save();


    if (updatedUser) {
      const embed = renderClosedBets(betsToClose, payout, updatedBalance);
      interaction.editReply({
        content: `Results for <@${interaction.user.id}>`,
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.editReply({
        content: "Unable to claim bets. Please try again later",
        ephemeral: true,
      });
    }
  },
};
