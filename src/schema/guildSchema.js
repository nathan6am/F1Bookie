import mongoose from "mongoose";
const { Schema } = mongoose;

const guildSchema = new Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
  },
  users: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
});

export default guildSchema;
