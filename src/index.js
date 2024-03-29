import "dotenv/config.js";
import fs from "fs";
import path from "path";
import startup from "./startup.js";
import DiscordJS, { Intents, Collection } from "discord.js";
import mongoose from "mongoose";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function callback() {
  console.log("connected to db");
});

await startup();

const client = new DiscordJS.Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Register commands from commands dir
const commandFiles = fs
  .readdirSync(path.resolve(__dirname, "./commands"))
  .filter((file) => file.endsWith(".js"));
const commands = [];
client.commands = new Collection();

const eventFiles = fs
  .readdirSync(path.resolve(__dirname, "./events"))
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const { default: defaultFunc } = await import(`./events/${file}`);
  const event = defaultFunc;
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, commands));
  } else {
    client.on(event.name, (...args) => event.execute(...args, commands));
  }
}

for (const file of commandFiles) {
  const { default: defaultFunc } = await import(`./commands/${file}`);
  const command = defaultFunc;
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

client.login(process.env.TOKEN);
