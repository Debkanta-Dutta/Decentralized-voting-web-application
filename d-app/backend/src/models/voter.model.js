import mongoose from "mongoose";

// Subdocument schema for each voting topic
const votingTopicSchema = new mongoose.Schema({
  votingTopicId: {
    type: String,
    required: true,
  },
  voterId: {
    type: String,
    required: true,
  },
  isRegistered: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  hasVoted: {
    type: Boolean,
    default: false,
  },
  votingPermission: {
    type: Boolean,
    default: false,
  },
  votedTo: {
    type: String,
  },
  verifiedAt: {
    type: Date,
  },
  votedAt: {
    type: Date,
  },
});

// Main Voter schema
const voterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ensure one voter record per user
    },
    votingTopics: {
      type: [votingTopicSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// No indexes here

export const Voter = mongoose.model("Voter", voterSchema);
