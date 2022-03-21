import mongoose from "mongoose";
const { Schema } = mongoose;

const betSchema = new Schema(
  {
    stake: {
      type: Number,
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    betCode: {
      type: String,
      required: true,
    },
    odds: {
      type: Number,
      required: true,
    },
    pick: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comparePick: {
      type: String,
    },
    description: {
      sessionTitle: {
        type: String,
      },
      title: {
        type: String,
      },
      optionName: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default betSchema;
