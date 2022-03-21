import betSchema from "./betSchema.js";
import userSchema from "./userSchema.js";
import guildSchema from "./guildSchema.js";
import mongoose from "mongoose";

export const User = mongoose.model("User", userSchema);

export const Guild = mongoose.model("Guild", guildSchema);

export const Bet = mongoose.model("Bet", betSchema);
