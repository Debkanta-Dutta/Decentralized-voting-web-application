import mongoose from "mongoose";

const voteEntrySchema = new mongoose.Schema(
  {
    votingTopicId: {
      type: String,
      required: true,
      index: true,
    },
    topicName: {
      type: String,
    },
    votedTo: {
      type: String, // changed from Number to String for better cross-chain or formatted IDs
      required: true,
    },
    candidateName: {
      type: String,
    },
    voteCountAtTime: {
      type: Number,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const votingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    history: {
      type: [voteEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const VotingHistory = mongoose.model(
  "VotingHistory",
  votingHistorySchema
);
