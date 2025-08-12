import mongoose from "mongoose";

const topicCandidacySchema = new mongoose.Schema(
  {
    candidateId: {
      type: String, // e.g., "pres2025-C001"
      unique: true,
    },
    votingTopicId: {
      type: String,
      required: true,
    },
    party: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    candidacies: {
      type: [topicCandidacySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Optional: index for searching candidacies by topic
// candidateSchema.index({ "candidacies.votingTopicId": 1 });
// candidateSchema.index({ "candidacies.candidateId": 1 }, { unique: true });

export const Candidate = mongoose.model("Candidate", candidateSchema);
