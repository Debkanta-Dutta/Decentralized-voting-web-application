import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    votingTopicName: {
      type: String,
      required: true,
    },
    votingTopicId: {
      type: String,
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    winnerId: Number,
    winnerName: String,
    totalVotes: Number,
    resultData: [
      {
        candidateId: Number,
        name: String,
        voteCount: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Result = mongoose.model("Result", resultSchema);
