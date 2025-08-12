import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { Voter } from "../models/voter.model.js";
import { Candidate } from "../models/candidate.model.js";
import { VotingHistory } from "../models/votinghistory.model.js";
import { Result } from "../models/result.model.js";

const updateVoterProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized User: Invalid User Details.");
  }

  const voterId = req.body.voterId?.trim();
  const votingTopicId = req.body.votingTopicId?.trim();

  if (!voterId || !votingTopicId) {
    throw new ApiError(
      400,
      "Invalid input: 'voterId' and 'votingTopicId' are required."
    );
  }

  let voter = await Voter.findOne({ userId: user._id });

  if (!voter) {
    // Create voter document if not found
    voter = await Voter.create({
      userId: user._id,
      votingTopics: [
        {
          votingTopicId,
          voterId,
          isRegistered: true,
        },
      ],
    });
  } else {
    // Check if this voting topic already exists for the user
    const existingTopic = voter.votingTopics.find(
      (topic) => topic.votingTopicId === votingTopicId
    );

    if (!existingTopic) {
      // Add new topic if not already present
      voter.votingTopics.push({
        votingTopicId,
        voterId,
        isRegistered: true,
      });
    } else {
      // Update existing topic
      existingTopic.voterId = voterId;
      existingTopic.isRegistered = true;
    }

    await voter.save();
  }

  // Ensure user has an associated voting history
  const existingHistory = await VotingHistory.findOne({ userId: user._id });
  if (!existingHistory) {
    await VotingHistory.create({
      userId: user._id,
      history: [],
    });
  }

  // Ensure user has profileId pointing to the voter's _id
  if (!user.profileId || user.profileId.toString() !== voter._id.toString()) {
    user.profileId = voter._id;
    await user.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        voter,
        "Voter profile has been updated successfully."
      )
    );
});

// const updateVoterProfile = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);
//   if (!user) {
//     throw new ApiError(401, "Unauthorized User: Invalid User Details.");
//   }

//   const { voterId, votingTopicId } = req.body;

//   if (!voterId?.trim() || !votingTopicId?.trim()) {
//     throw new ApiError(
//       400,
//       "Invalid input: 'voterId' and 'votingTopicId' are required."
//     );
//   }

//   // Get or create the Voter record
//   let voter = await Voter.findOne({ userId: user._id });

//   if (!voter) {
//     voter = await Voter.create({
//       userId: user._id,
//       votingTopics: [
//         {
//           voterId: voterId.trim(),
//           votingTopicId: votingTopicId.trim(),
//           isRegistered: true,
//         },
//       ],
//     });
//   } else {
//     // Check if the topic already exists
//     const existingTopic = voter.votingTopics.find(
//       (topic) => topic.votingTopicId === votingTopicId.trim()
//     );

//     if (existingTopic) {
//       existingTopic.voterId = voterId.trim();
//       existingTopic.isRegistered = true;
//     } else {
//       voter.votingTopics.push({
//         voterId: voterId.trim(),
//         votingTopicId: votingTopicId.trim(),
//         isRegistered: true,
//       });
//     }

//     await voter.save();
//   }

//   // Voting History Logic
//   let vh = await VotingHistory.findOne({ userId: user._id });
//   if (!vh) {
//     await VotingHistory.create({
//       userId: user._id,
//       history: [{ votingTopicId }],
//     });
//   } else {
//     const alreadyExists = vh.history.some(
//       (entry) => entry.votingTopicId === votingTopicId.trim()
//     );
//     if (!alreadyExists) {
//       vh.history.push({ votingTopicId });
//       await vh.save();
//     }
//   }

//   // Attach voter profile ID to user if not already set
//   if (!user.profileId || user.profileId.toString() !== voter._id.toString()) {
//     user.profileId = voter._id;
//     await user.save();
//   }

//   res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         voter,
//         "Voter profile has been updated successfully."
//       )
//     );
// });

const applyAsCandidate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized: Invalid user.");
  }

  const { bio, party, votingTopicId } = req.body;

  if (!party?.trim() || !votingTopicId?.trim()) {
    throw new ApiError(400, "Party name and Voting Topic ID are required.");
  }

  const voter = await Voter.findOne({ userId: user._id });
  if (!voter) {
    throw new ApiError(404, "Voter profile not found.");
  }

  const voterTopicEntry = voter.votingTopics.find(
    (vt) => vt.votingTopicId === votingTopicId.trim()
  );

  if (!voterTopicEntry) {
    throw new ApiError(
      400,
      "Provided Voting Topic ID does not exist in your voter profile."
    );
  }

  // Check if already applied
  const candidateDoc = await Candidate.findOne({ userId: user._id });

  if (candidateDoc) {
    const alreadyApplied = candidateDoc.candidacies.some(
      (c) => c.votingTopicId === votingTopicId.trim()
    );

    if (alreadyApplied) {
      throw new ApiError(
        409,
        "You have already applied as a candidate for this topic."
      );
    }
  }

  const newCandidacy = {
    votingTopicId: votingTopicId.trim(),
    party: party.trim(),
    bio: bio?.trim() || "",
    // `candidateId` will be auto-generated elsewhere (e.g., approval phase)
  };

  let candidate;
  if (!candidateDoc) {
    candidate = await Candidate.create({
      userId: user._id,
      candidacies: [newCandidacy],
    });
  } else {
    candidateDoc.candidacies.push(newCandidacy);
    candidate = await candidateDoc.save();
  }

  if (!candidate) {
    throw new ApiError(
      500,
      "Something went wrong while applying as a candidate."
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, newCandidacy, "Successfully applied as a candidate.")
    );
});

const totalNoOfVoters = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User: User doesn't exist");

  const { votingTopicId } = req.query;

  if (!votingTopicId?.trim()) {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  // Count voters who have this topic and are verified
  const count = await Voter.countDocuments({
    votingTopics: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isVerified: true,
      },
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count },
        "Successfully retrieved total number of verified voters"
      )
    );
});

const totalNoOfCandidate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User: User doesn't exist");

  const { votingTopicId } = req.query; //body

  if (!votingTopicId?.trim()) {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  // Count cadidates who have this topic and are approved
  const count = await Candidate.countDocuments({
    candidacies: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isApproved: true,
      },
    },
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count },
        "Successfully retrieved total number of approved candidates"
      )
    );
});

const voterList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Unauthorized User: User doesn't exist");
  }

  const { votingTopicId } = req.query; // check (query)
  if (!votingTopicId?.trim()) {
    throw new ApiError(
      400,
      "Voting Topic ID is required to see the voter list."
    );
  }

  const voters = await Voter.find({
    votingTopics: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isVerified: true,
      },
    },
  }).populate({
    path: "userId",
    select: "fullname email avatar",
  });

  if (!voters || voters.length === 0) {
    throw new ApiError(404, "No verified voters found.");
  }

  const enrichedVoters = voters.map((v) => {
    const topicEntry = v.votingTopics.find(
      (t) => t.votingTopicId === votingTopicId.trim() && t.isVerified === true
    );

    return {
      _id: v._id,
      voterId: topicEntry?.voterId || "N/A",
      userFullName: v.userId?.fullname || "N/A",
      userEmail: v.userId?.email || "N/A",
      avatar: v.userId?.avatar || null,
      votingTopicId: votingTopicId.trim(),
    };
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { voters: enrichedVoters },
        "Successfully retrieved verified voters"
      )
    );
});

const candidateList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Unauthorized User: User doesn't exist");
  }

  const voterProfile = await Voter.findById(user.profileId);
  if (!voterProfile) {
    throw new ApiError(404, "User must have a voter profile first.");
  }

  const { votingTopicId } = req.query; // check (query)
  if (!votingTopicId?.trim()) {
    throw new ApiError(400, "Voting Topic ID is required to get the list.");
  }

  const candidates = await Candidate.find({
    candidacies: {
      $elemMatch: {
        votingTopicId: votingTopicId.trim(),
        isApproved: true,
      },
    },
  }).populate({
    path: "userId",
    select: "fullname email avatar",
  });

  if (!candidates || candidates.length === 0) {
    throw new ApiError(404, "No approved candidates found.");
  }

  // Extract the matching candidacy from each candidate
  const enrichedCandidates = candidates
    .map((c) => {
      const topic = c.candidacies.find(
        (cand) => cand.votingTopicId === votingTopicId.trim() && cand.isApproved
      );

      if (!topic) return null;

      return {
        _id: c._id,
        candidateId: topic.candidateId,
        party: topic.party,
        bio: topic.bio,
        voteCount: topic.voteCount,
        userFullName: c.userId?.fullname || "N/A",
        userEmail: c.userId?.email || "N/A",
        avatar: c.userId?.avatar || null,
        votingTopicId: topic.votingTopicId,
        approvedAt: topic.approvedAt,
      };
    })
    .filter(Boolean); // remove null entries

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { candidates: enrichedCandidates },
        "Successfully retrieved approved candidates"
      )
    );
});

const castVote = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User.");

  const voter = await Voter.findById(user.profileId);
  if (!voter)
    throw new ApiError(403, "Unauthorized User: You must be a voter first.");
  const { votingTopicId } = req.body;
  const { candidateId } = req.body;

  if (!votingTopicId || !candidateId)
    throw new ApiError(400, "Voting Topic ID and Candidate ID are required.");

  // 1. Find voter's topic record
  const voterTopic = voter.votingTopics.find(
    (topic) => topic.votingTopicId === votingTopicId
  );

  if (!voterTopic)
    throw new ApiError(
      403,
      "Invalid topic. You are not registered in this topic."
    );

  if (!voterTopic.isVerified || !voterTopic.votingPermission)
    throw new ApiError(403, "You are not allowed to vote in this topic.");

  if (voterTopic.hasVoted)
    throw new ApiError(403, "You have already cast your vote for this topic.");

  // 2. Find approved candidate for the topic
  const candidate = await Candidate.findOne({
    candidacies: {
      $elemMatch: {
        votingTopicId,
        candidateId,
        isApproved: true,
      },
    },
  }).populate("userId", "fullname");

  if (!candidate)
    throw new ApiError(404, "Invalid Candidate ID. No such candidate found.");

  // 3. Find matching candidacy record and increment vote
  const matchedCandidacy = candidate.candidacies.find(
    (c) => c.votingTopicId === votingTopicId && c.candidateId === candidateId
  );

  if (!matchedCandidacy)
    throw new ApiError(500, "Candidate record corrupted or mismatched.");

  matchedCandidacy.voteCount += 1;
  matchedCandidacy.updatedAt = new Date(); // might not required
  await candidate.save();

  // 4. Update voter topic status
  voterTopic.hasVoted = true;
  voterTopic.votedTo = candidateId;
  voterTopic.votedAt = new Date();
  await voter.save();

  // 5. Add to Voting History
  const historyEntry = {
    votingTopicId,
    votedTo: candidateId,
    candidateName: candidate.userId?.fullname || "N/A",
    voteCountAtTime: matchedCandidacy.voteCount,
    votedAt: new Date(),
    topicName: "", // Optional: set if Result model has the topicName
  };

  // If you want to fetch the topic name from Result (optional)
  try {
    const result = await Result.findOne({ votingTopicId });
    if (result?.votingTopicName) {
      historyEntry.topicName = result.votingTopicName;
    }
  } catch (err) {
    console.warn("Could not fetch Result for topic name:", err.message);
  }

  await VotingHistory.findOneAndUpdate(
    { userId: user._id },
    { $push: { history: historyEntry } },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, {}, "Vote successfully cast."));
});

const getResultList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(401, "Unauthorized user: No such user found");

  const voter = await Voter.findById(user.profileId);
  if (!voter)
    throw new ApiError(401, "Unauthorized user: Voter profile not found");

  const { votingTopicId } = req.query;
  if (!votingTopicId?.trim()) {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  // Get voter's topic info
  const voterTopic = voter.votingTopics.find(
    (vt) => vt.votingTopicId === votingTopicId
  );

  if (!voterTopic) {
    throw new ApiError(403, "You are not registered in this voting topic.");
  }

  if (voterTopic.hasVoted !== true && voterTopic.votingPermission !== true) {
    throw new ApiError(
      403,
      "Voting is not over yet or you're not authorized to view results."
    );
  }

  // Get candidates for this topic
  const candidates = await Candidate.find({
    candidacies: {
      $elemMatch: {
        votingTopicId,
        isApproved: true,
      },
    },
  }).populate("userId", "fullname avatar email");

  if (!candidates || candidates.length === 0) {
    throw new ApiError(404, "No candidates found for this topic.");
  }

  // Format the result list
  const resultList = candidates
    .map((c) => {
      const candidacy = c.candidacies.find(
        (cd) => cd.votingTopicId === votingTopicId && cd.isApproved
      );
      if (!candidacy) return null;

      return {
        _id: c._id,
        candidateId: candidacy.candidateId,
        party: candidacy.party,
        bio: candidacy.bio,
        voteCount: candidacy.voteCount,
        userFullName: c.userId?.fullname || "N/A",
        avatar: c.userId?.avatar || null,
        userEmail: c.userId?.email || "N/A",
      };
    })
    .filter(Boolean) // remove null entries
    .sort((a, b) => b.voteCount - a.voteCount); // sort by highest vote

  return res
    .status(200)
    .json(new ApiResponse(200, resultList, "Voting result list"));
});

const getHistory = asyncHandler(async (req, res) => {
  // Step 1: Validate authenticated user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized user: Access denied.");
  }

  // Step 2: Validate voter profile existence
  const voter = await Voter.findById(user.profileId);
  if (!voter) {
    throw new ApiError(403, "Voter profile not f=ound. Access denied.");
  }

  // Step 3: Retrieve voting history
  const historyRecord = await VotingHistory.findOne({ userId: user._id });
  if (!historyRecord || historyRecord.history.length === 0) {
    throw new ApiError(404, "No voting history found.");
  }

  // Step 4: Respond with history
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { history: historyRecord.history },
        "Successfully retrieved voting history."
      )
    );
});

export {
  totalNoOfVoters,
  totalNoOfCandidate,
  updateVoterProfile,
  applyAsCandidate,
  voterList,
  candidateList,
  castVote,
  getResultList,
  getHistory,
};
