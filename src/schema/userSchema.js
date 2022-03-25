import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    discordId: {
      type: String,
      required: true,
      unique: true,
    },
    userName: {
      type: String,
    },
    tag: {
      type: String,
    },
    guilds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Guild" }],
    balance: {
      type: Number,
      required: true,
      default: 1000,
    },
    stats: {
      won: {
        type: Number,
        default: 0,
      },

      lost: {
        type: Number,
        default: 0,
      },
      netWinnings: {
        type: Number, 
        default: 0 
      }
    },
    openBets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bet" }],
    closedBets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bet" }],
  },
  {
    timestamps: true,
  }
);

export default userSchema;
