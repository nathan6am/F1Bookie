import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import dotenv from "dotenv";
dotenv.config();

export default {
  name: "ready",
  once: true,
  execute(client, commands) {
    console.log("The bot is ready");
    const CLIENT_ID = client.user.id;
    const rest = new REST({
      version: 9,
    }).setToken(process.env.TOKEN);

    (async () => {
      try {
        if (process.env.ENV === "production") {
          await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
          });
          console.log("registered commands GLOBAL");
        } else {
          await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID),
            {
              body: commands,
            }
          );
          console.log("registered commands LOCAL");
        }
      } catch (e) {
        if (e) console.error(e);
      }
    })();
  },
};
