import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { User } from "../models/user.model.js";
import { Voter } from "../models/voter.model.js";
import { Candidate } from "../models/candidate.model.js";
import { Result } from "../models/result.model.js";
import contract from "../utils/contract.utils.js";
import {
  toggleVotingPermission,
  syncVotesFromContract,
} from "../services/voting.service.js";

function genCandidateId() {
  return Date.now() - Math.floor(Math.random() * 1000);
}

const notVerifiedVoterList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Invalid user.");
  }

  if (!user.isVotingTopicOwner) {
    throw new ApiError(
      403,
      "Unauthorized: Only voting topic owner can view unverified voters."
    );
  }

  const { votingTopicId } = req.query;

  if (!votingTopicId || votingTopicId.trim() === "") {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  const voters = await Voter.find({
    votingTopics: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isVerified: false,
      },
    },
  }).populate({
    path: "userId",
    select: "fullname walletAddress avatar",
  });

  if (!voters || voters.length === 0) {
    throw new ApiError(404, "No unverified voters found.");
  }

  const enrichedVoters = [];

  for (const voter of voters) {
    const topicEntry = voter.votingTopics.find(
      (entry) =>
        entry.votingTopicId === votingTopicId.trim() &&
        entry.isVerified === false
    );

    if (topicEntry) {
      enrichedVoters.push({
        _id: voter._id,
        voterId: topicEntry.voterId,
        userFullName: voter.userId?.fullname || null,
        walletAddress: voter.userId?.walletAddress || null,
        avatar: voter.userId?.avatar || null,
        votingTopicId: topicEntry.votingTopicId,
      });
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { voters: enrichedVoters },
        "Successfully retrieved unverified voters."
      )
    );
});

const verifyVoter = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Unauthorized: Invalid user.");
  }

  if (!user.isVotingTopicOwner) {
    throw new ApiError(
      403,
      "Access Denied: Only voting topic owner can verify voters."
    );
  }

  const { votingTopicId, walletAddress, voterId } = req.body;

  if (
    ![votingTopicId, walletAddress, voterId].every((field) => field?.trim())
  ) {
    throw new ApiError(
      400,
      "All fields (votingTopicId, walletAddress, voterId) are required."
    );
  }

  const voterUser = await User.findOne({ walletAddress: walletAddress.trim() });
  if (!voterUser) {
    throw new ApiError(404, "No user found with the provided wallet address.");
  }

  const voter = await Voter.findOne({ userId: voterUser._id });
  if (!voter) {
    throw new ApiError(404, "No voter profile found for the given user.");
  }

  // Find the topic entry in the nested votingTopics array
  const topicEntry = voter.votingTopics.find(
    (entry) =>
      entry.votingTopicId === votingTopicId.trim() &&
      entry.voterId === voterId.trim() &&
      entry.isRegistered === true
  );

  if (!topicEntry) {
    throw new ApiError(
      404,
      "No matching registered topic found for this voter."
    );
  }

  if (topicEntry.isVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, voter, "Voter is already verified."));
  }

  // Update verification status
  topicEntry.isVerified = true;
  topicEntry.verifiedAt = new Date();
  await voter.save();

  return res
    .status(200)
    .json(new ApiResponse(200, voter, "Voter verified successfully."));
});

const unApprovedCandidateList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Invalid user.");
  }

  if (!user.isVotingTopicOwner) {
    throw new ApiError(
      403,
      "Unauthorized: Only voting topic owner can view unapproved candidates."
    );
  }

  const { votingTopicId } = req.query;

  if (!votingTopicId?.trim()) {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  const candidates = await Candidate.find({
    candidacies: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isApproved: false,
      },
    },
  }).populate({
    path: "userId",
    select: "fullname email avatar",
  });

  if (!candidates || candidates.length === 0) {
    throw new ApiError(404, "No unapproved candidates found.");
  }

  const enrichedCandidates = [];

  for (const c of candidates) {
    const candidacy = c.candidacies.find(
      (item) =>
        item.votingTopicId === votingTopicId.trim() && item.isApproved === false
    );

    if (candidacy) {
      enrichedCandidates.push({
        _id: c._id,
        party: candidacy.party,
        bio: candidacy.bio,
        candidateId: candidacy.candidateId,
        votingTopicId: candidacy.votingTopicId,
        userFullName: c.userId?.fullname || null,
        userEmail: c.userId?.email || null,
        avatar: c.userId?.avatar || null,
      });
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { candidates: enrichedCandidates },
        "Successfully retrieved unapproved candidates."
      )
    );
});

const approveAndRegisterCandidate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Invalid user.");
  }

  if (!user.isVotingTopicOwner) {
    throw new ApiError(
      403,
      "Unauthorized: Only voting topic owners can approve candidates."
    );
  }

  const { fullname, email, party, votingTopicId } = req.body;

  if ([fullname, email, party, votingTopicId].some((field) => !field?.trim())) {
    throw new ApiError(
      400,
      "Fullname, email, voting topic ID, and party are all required."
    );
  }

  const existingUser = await User.findOne({
    fullname: fullname.trim(),
    email: email.trim().toLowerCase(),
  });

  if (!existingUser) {
    throw new ApiError(404, "User with given details not found.");
  }

  const candidateDoc = await Candidate.findOne({ userId: existingUser._id });

  if (!candidateDoc) {
    throw new ApiError(404, "Candidate application not found for this user.");
  }

  const candidacy = candidateDoc.candidacies.find(
    (c) => c.votingTopicId === votingTopicId.trim()
  );

  if (!candidacy) {
    throw new ApiError(404, "No candidate application for this voting topic.");
  }

  if (candidacy.isApproved) {
    throw new ApiError(400, "Candidate is already approved.");
  }

  if (candidacy.party.trim() !== party.trim()) {
    throw new ApiError(400, "Party name does not match the application.");
  }

  let candidateId;
  let exists = true;

  while (exists) {
    candidateId = genCandidateId(); // generates a unique ID like pres2025-C001
    exists = await Candidate.exists({
      "candidacies.candidateId": candidateId,
    });
  }

  // Update the candidacy subdocument
  candidacy.candidateId = candidateId;
  candidacy.isApproved = true;
  candidacy.approvedAt = new Date();

  await candidateDoc.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { candidateId },
        "Candidate approved and registered successfully."
      )
    );
});

const storePublishedResult = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user || !user.isVotingTopicOwner) {
    throw new ApiError(
      403,
      "Unauthorized: Only topic owners can store results."
    );
  }

  const { votingTopicId } = req.body;

  if (!votingTopicId?.toString().trim()) {
    throw new ApiError(400, "Voting topic ID is required.");
  }

  let winner;
  try {
    winner = await contract.getWinner(votingTopicId); // e.g. { id: "pres2025-C002", name: "John", voteCount: BigInt }
  } catch (err) {
    throw new ApiError(
      500,
      "Failed to fetch winner from contract: " + err.message
    );
  }

  // Sanitize winner data
  const winnerId = winner?.id?.toString();
  const winnerName = winner?.name || "Unknown";
  const totalVotes = parseInt(winner?.voteCount?.toString() || "0");

  if (!winnerId || !winnerName) {
    throw new ApiError(400, "Invalid winner data received from contract.");
  }

  // Update the result document
  const updatedResult = await Result.findOneAndUpdate(
    { votingTopicId },
    {
      winnerId,
      winnerName,
      totalVotes,
      publishedAt: new Date(),
    },
    { new: true }
  );

  if (!updatedResult) {
    throw new ApiError(404, "Voting result record not found.");
  }

  // Optional: Sync blockchain votes to DB and disable further voting
  await syncVotesFromContract(votingTopicId);
  await toggleVotingPermission(votingTopicId, false);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedResult,
        "Result stored in backend successfully."
      )
    );
});

const enableOrDisableVoting = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Invalid user.");
  }

  if (!user.isVotingTopicOwner) {
    throw new ApiError(
      403,
      "Unauthorized: Only voting topic owners can toggle voting permission."
    );
  }

  const { votingTopicId } = req.body;

  if (!votingTopicId?.trim()) {
    throw new ApiError(
      400,
      "Voting Topic ID is required to enable or disable voting."
    );
  }

  // Step 1: Find any verified voter to get current permission state
  const anyVoter = await Voter.findOne({
    votingTopics: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isVerified: true,
      },
    },
  });

  if (!anyVoter) {
    throw new ApiError(404, "No verified voters found to toggle voting.");
  }

  const topicData = anyVoter.votingTopics.find(
    (vt) => vt.votingTopicId === votingTopicId && vt.isVerified
  );

  if (!topicData) {
    throw new ApiError(404, "Unable to determine current voting state.");
  }

  const newVotingState = !topicData.votingPermission;

  // Step 2: Update all matching votingTopics[votingTopicId].votingPermission
  const result = await Voter.updateMany(
    {
      "votingTopics.votingTopicId": votingTopicId.trim(),
      "votingTopics.isVerified": true,
    },
    {
      $set: {
        "votingTopics.$[topic].votingPermission": newVotingState,
      },
    },
    {
      arrayFilters: [
        {
          "topic.votingTopicId": votingTopicId.trim(),
          "topic.isVerified": true,
        },
      ],
    }
  );

  if (!result.acknowledged || result.modifiedCount === 0) {
    throw new ApiError(500, "Failed to update voting permissions.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { newVotingPermission: newVotingState },
        `Voting permission has been ${
          newVotingState ? "enabled" : "disabled"
        } for all verified voters.`
      )
    );
});

export {
  verifyVoter,
  storePublishedResult,
  approveAndRegisterCandidate,
  enableOrDisableVoting,
  unApprovedCandidateList,
  notVerifiedVoterList,
};
