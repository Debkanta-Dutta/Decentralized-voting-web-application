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

  const { voterId, votingTopicId } = req.body;

  if (!voterId?.trim() || !votingTopicId?.trim()) {
    throw new ApiError(
      400,
      "Invalid input: 'voterId' and 'votingTopicId' are required."
    );
  }

  let voter = await Voter.findOne({ userId: user._id });

  // If voter document doesn't exist, create one with initial topic
  if (!voter) {
    voter = await Voter.create({
      userId: user._id,
      votingTopics: [
        {
          votingTopicId: votingTopicId.trim(),
          voterId: voterId.trim(),
          isRegistered: true,
        },
      ],
    });
  } else {
    // Check if this topic is already present
    const topicIndex = voter.votingTopics.findIndex(
      (t) => t.votingTopicId === votingTopicId.trim()
    );

    if (topicIndex === -1) {
      // Add new topic entry
      voter.votingTopics.push({
        votingTopicId: votingTopicId.trim(),
        voterId: voterId.trim(),
        isRegistered: true,
      });
    } else {
      // Update existing topic entry
      voter.votingTopics[topicIndex].voterId = voterId.trim();
      voter.votingTopics[topicIndex].isRegistered = true;
    }

    await voter.save();
  }

  // Voting History Logic
  let vh = await VotingHistory.findOne({ userId: user._id });

  if (!vh) {
    await VotingHistory.create({
      userId: user._id,
      history: [],
    });
  }

  // Attach voter profile to user if not already set
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

  const { votingTopicId } = req.body;

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

  const { votingTopicId } = req.body;

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
  const { votingTopicId } = req.query;
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

  if (voterTopic.hasVoted !== true || voterTopic.votingPermission !== true) {
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
    throw new ApiError(403, "Voter profile not found. Access denied.");
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

// ----------------------------------------------------------------------------------- // Previously used functions

/*
const updateVoterProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized User: Invalid User Details.");
  }

  const { voterId, votingTopicId } = req.body;

  if (!voterId?.trim() || !votingTopicId?.trim()) {
    throw new ApiError(
      400,
      "Invalid input: 'voterId' and 'votingTopicId' are required."
    );
  }

  let voter = await Voter.findById(user.profileId);

  if (!voter) {
    voter = await Voter.create({
      userId: user._id,
      voterId,
      votingTopicId,
      isRegistered: true,
    });
  } else {
    voter.voterId = voterId;
    voter.votingTopicId = votingTopicId;
    voter.isRegistered = true;
    await voter.save();
  }

  // Voting History Logic
  let vh = await VotingHistory.findOne({ userId: user._id });
  if (!vh) {
    await VotingHistory.create({
      userId: user._id,
      history: [{ votingTopicId }],
    });
  } else {
    // Prevent duplicate entries for same votingTopicId
    const alreadyExists = vh.history.some(
      (entry) => entry.votingTopicId === votingTopicId
    );
    if (!alreadyExists) {
      vh.history.push({ votingTopicId });
      await vh.save();
    }
  }

  // Attach voter profile to user if not already set
  if (!user.profileId || user.profileId.toString() !== voter._id.toString()) {
    user.profileId = voter._id;
    Int32Array;
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

const applyAsCandidate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized: Invalid user.");
  }

  const { bio, party, votingTopicId } = req.body;

  if (!party?.trim() || !votingTopicId?.trim()) {
    throw new ApiError(400, "Party name and Voting Topic ID are required.");
  }

  const voter = await Voter.findById(user.profileId);
  if (!voter) {
    throw new ApiError(404, "Voter profile not found.");
  }

  if (voter.votingTopicId !== votingTopicId) {
    throw new ApiError(
      400,
      "Provided Voting Topic ID does not match your voter profile."
    );
  }

  const existingCandidate = await Candidate.findOne({
    userId: user._id,
    votingTopicId,
  });

  if (existingCandidate) {
    throw new ApiError(
      409,
      "You have already applied as a candidate for this topic."
    );
  }

  const candidate = await Candidate.create({
    userId: user._id,
    votingTopicId,
    party,
    bio,
  });

  if (!candidate) {
    throw new ApiError(
      500,
      "Something went wrong while applying as a candidate."
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, candidate, "Successfully applied as a candidate.")
    );
});

const totalNoOfVoters = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User: User doesn't exist");
  const voter = await Voter.findById(user.profileId);
  if (!voter) throw new ApiError(404, "User must have a voter profile first.");
  const count = await Voter.countDocuments({
    isVerified: true,
    votingTopicId: voter.votingTopicId,
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
  const voter = await Voter.findById(user.profileId);
  if (!voter) throw new ApiError(404, "User must have a voter profile first.");
  const count = await Candidate.countDocuments({
    isApproved: true,
    votingTopicId: voter.votingTopicId,
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

  const voterProfile = await Voter.findById(user.profileId);
  if (!voterProfile) {
    throw new ApiError(404, "User must have a voter profile first.");
  }
  const { votingTopicId } = req.query;
  if (!votingTopicId)
    throw new ApiError(
      403,
      "Voting Topic Id is required to see the voter list"
    );
  const voters = await Voter.find({
    isVerified: true,
    votingTopicId,
  }).populate({
    path: "userId",
    select: "fullname email avatar",
  });

  if (!voters || voters.length === 0) {
    throw new ApiError(404, "No verified voters found.");
  }

  const enrichedVoters = voters.map((v) => ({
    _id: v._id,
    voterId: v.voterId,
    userFullName: v.userId?.fullname || "N/A",
    userEmail: v.userId?.email || "N/A",
    avatar: v.userId?.avatar || null,
    votingTopicId: v.votingTopicId,
  }));

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
  const { votingTopicId } = req.query;
  if (!votingTopicId)
    throw new ApiError(403, "Voting Topic Id is Required to get the list");
  const candidates = await Candidate.find({
    isApproved: true,
    votingTopicId: votingTopicId,
  }).populate({
    path: "userId",
    select: "fullname email avatar",
  });

  if (!candidates || candidates.length === 0) {
    throw new ApiError(404, "No approved candidates found.");
  }

  const enrichedCandidates = candidates.map((c) => ({
    _id: c._id,
    candidateId: c.candidateId || "N/A",
    party: c.party,
    bio: c.bio,
    userFullName: c.userId?.fullname || "N/A",
    userEmail: c.userId?.email || "N/A",
    avatar: c.userId?.avatar || null,
    votingTopicId: c.votingTopicId,
  }));

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

const searchVoters = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User.");

  const { keyword = "", votingTopicId, page = 1, limit = 10 } = req.query;

  if (!votingTopicId || votingTopicId.trim() === "") {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  const voterProfile = await Voter.findById(user.profileId);

  if (!voterProfile || voterProfile.votingTopicId !== votingTopicId) {
    throw new ApiError(403, "Access denied for this topic.");
  }

  const regex = new RegExp(keyword, "i");

  const voters = await Voter.find({
    votingTopicId,
    isVerified: true,
  })
    .populate({
      path: "userId",
      match: {
        $or: [{ fullname: regex }, { email: regex }],
      },
      select: "fullname email avatar",
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Voter.countDocuments({
    votingTopicId,
    isVerified: true,
  });

  const enriched = voters
    .filter((v) => v.userId) // exclude unpopulated ones
    .map((voter) => ({
      _id: voter._id,
      voterId: voter.voterId,
      userFullName: voter.userId.fullname,
      userEmail: voter.userId.email,
      avatar: voter.userId.avatar,
      votingTopicId: voter.votingTopicId,
      hasVoted: voter.hasVoted,
      verifiedAt: voter.verifiedAt,
    }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
        voters: enriched,
      },
      "Voters fetched successfully"
    )
  );
});

const searchCandidates = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User.");

  const {
    keyword = "", // name, email, or candidateId
    votingTopicId,
    page = 1,
    limit = 10,
  } = req.query;

  if (!votingTopicId || votingTopicId.trim() === "") {
    throw new ApiError(400, "Voting Topic ID is required.");
  }

  const voterProfile = await Voter.findById(user.profileId);

  if (!voterProfile || voterProfile.votingTopicId !== votingTopicId) {
    throw new ApiError(403, "Access denied for this topic.");
  }

  const regex = new RegExp(keyword, "i");

  const candidates = await Candidate.find({
    votingTopicId,
    isApproved: true,
    $or: [{ candidateId: regex }, { party: regex }],
  })
    .populate({
      path: "userId",
      match: {
        $or: [{ fullname: regex }, { email: regex }],
      },
      select: "fullname email avatar",
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Candidate.countDocuments({
    votingTopicId,
    isApproved: true,
  });

  const enriched = candidates
    .filter((c) => c.userId)
    .map((candidate) => ({
      _id: candidate._id,
      candidateId: candidate.candidateId,
      party: candidate.party,
      bio: candidate.bio,
      isApproved: candidate.isApproved,
      userFullName: candidate.userId.fullname,
      userEmail: candidate.userId.email,
      avatar: candidate.userId.avatar,
      votingTopicId: candidate.votingTopicId,
    }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
        candidates: enriched,
      },
      "Candidates fetched successfully"
    )
  );
});

const castVote = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(403, "Unauthorized User.");

  const voter = await Voter.findById(user.profileId);
  if (!voter)
    throw new ApiError(403, "Unauthorized User: You must be a voter first.");

  const { votingTopicId, candidateId } = req.body;

  if (!votingTopicId || !candidateId)
    throw new ApiError(400, "All fields are required to cast vote.");

  if (voter.votingTopicId !== votingTopicId)
    throw new ApiError(
      403,
      "Invalid topic. You are not registered in this topic."
    );

  if (!voter.votingPermission || !voter.isVerified)
    throw new ApiError(403, "You are not allowed to vote.");

  if (voter.hasVoted)
    throw new ApiError(403, "You have already cast your vote.");

  const candidate = await Candidate.findOne({
    votingTopicId,
    candidateId,
    isApproved: true,
  });

  if (!candidate)
    throw new ApiError(404, "Invalid Candidate ID. No such candidate found.");

  candidate.voteCount += 1;
  await candidate.save();

  voter.hasVoted = true;
  voter.votedTo = candidateId;
  voter.votedAt = new Date();
  await voter.save();

  // Update voting history
  const rs = await Result.findOne({ votingTopicId });

  const historyEntry = {
    votingTopicId,
    votedTo: candidateId,
    votedAt: new Date(),
    topicName: rs?.votingTopicName || "",
  };

  await VotingHistory.findOneAndUpdate(
    { userId: user._id },
    { $push: { history: historyEntry } },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, {}, "Vote successfully cast."));
});

const getResultList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(401, "Unauthorized user: No such user find");
  const voter = await Voter.findById(user.profileId);
  if (!voter) throw new ApiError(401, "Unauthorized user: No such voter find");

  if (voter.hasVoted !== true && voter.votingPermission == true)
    throw new ApiError(404, "Voting is not End yet");

  const { votingTopicId } = req.query;

  if (!votingTopicId?.trim()) {
    throw new ApiError(400, "Voting topic ID is required.");
  }

  if (voter.votingTopicId !== votingTopicId)
    throw new ApiError(404, "Your Are Not Authorized to See the Result");

  const candidates = await Candidate.find({
    votingTopicId,
    isApproved: true,
  })
    .sort({ voteCount: -1 })
    .populate({
      path: "userId",
      select: "fullname email avatar",
    });

  const formatted = candidates.map((c) => ({
    _id: c._id,
    candidateId: c.candidateId,
    party: c.party,
    bio: c.bio,
    voteCount: c.voteCount,
    userFullName: c.userId?.fullname || "N/A",
    avatar: c.userId?.avatar || null,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, formatted, "Voting result list"));
});

const getHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(401, "Unauthorized User: Access denied.");

  const voter = await Voter.findById(user.profileId);
  if (!voter) throw new ApiError(401, "Unauthorized User: Access denied.");

  const data = await VotingHistory.findOne({ userId: user._id });
  if (!data || !data.history || data.history.length === 0)
    throw new ApiError(404, "No voting history found.");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { history: data.history },
        "Successfully retrieved voting history."
      )
    );
});
*/
