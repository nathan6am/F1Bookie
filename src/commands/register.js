import { SlashCommandBuilder } from "@discordjs/builders";
import { User, Guild } from "../schema/Models.js";
export default {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register to start placing bets!"),
  async execute(interaction) {
    const successReply =
      "Your are now registered with F1 Bookie. Your balance is now $1000. Use ``/odds`` to view current odds and start placing bets with ``/bet``";
    const rejectReply =
      "Your account is already registered with F1 Bookie. To see your profile use /profile";
    const id = interaction.user.id;
    const guildId = interaction.guildId;
    const guild = await Guild.findOne({ guildId: guildId }).exec();
    const user = await User.findOne({ discordId: id })
      .populate("guilds", "guildId")
      .exec();
    if (user && guild) {
      if (user.guilds.some((guild) => guild.guildId === guildId)) {
        interaction.reply({
          content: rejectReply,
          ephemeral: true,
        });
      } else {
        User.findByIdAndUpdate(
          user._id,
          { $push: { guilds: guild._id } },
          (err, success) => {
            if (err) {
              console.error(err);
              interaction.reply({
                content: `Something went wrong`,
                ephemeral: true,
              });
            }
          }
        );
      }
    } else if (user) {
      try {
        await Guild.create({ guildId: guildId, users: [user._id] });
        interaction.reply({
          content: rejectReply,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
      }
    } else if (guild) {
      const newUser = await User.create({
        discordId: id,
        username: interaction.user.username,
        tag: interaction.user.tag,
        guilds: [guild._id],
        balance: 1000,
        openBets: [],
        closedBets: [],
      });
      Guild.findByIdAndUpdate(guild._id, {
        $push: { users: newUser._id },
      }).exec();
      interaction.reply({
        content: successReply,
        ephemeral: true,
      });
    } else {
      const created = await Guild.create({ guildId: guildId, users: [] });
      const newUser = await User.create({
        discordId: id,
        username: interaction.user.username,
        tag: interaction.user.tag,
        guilds: [created._id],
        balance: 1000,
        openBets: [],
        closedBets: [],
      });
      console.log(created._id);
      console.log(newUser._id);
      Guild.findByIdAndUpdate(created._id, {
        $push: { users: newUser._id },
      }).exec();
      interaction.reply({
        content: successReply,
        ephemeral: true,
      });
    }
  },
};
