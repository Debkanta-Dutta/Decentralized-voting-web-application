import { Voter } from "../models/voter.model.js";
import { Candidate } from "../models/candidate.model.js";
import contract from "../utils/contract.utils.js";

export const toggleVotingPermission = async (votingTopicId, newState) => {
  const voters = await Voter.find({
    "votingTopics.votingTopicId": votingTopicId,
    "votingTopics.isVerified": true,
  });
  const bulkOps = voters.map((voter) => {
    const updates = voter.votingTopics.map((topic) => {
      if (topic.votingTopicId === votingTopicId && topic.isVerified) {
        topic.votingPermission = newState;
      }
      return topic;
    });

    return {
      updateOne: {
        filter: { _id: voter._id },
        update: { $set: { votingTopics: updates } },
      },
    };
  });

  await Voter.bulkWrite(bulkOps);
};

export const syncVotesFromContract = async (votingTopicId) => {
  const candidatesFromContract = await contract.getAllCandidates(votingTopicId);

  return await Promise.all(
    candidatesFromContract.map(async (cand) => {
      const candidateId = cand.id.toString(); // string, as per new schema
      const voteCount = parseInt(cand.voteCount.toString());
      const name = cand.name;

      return await Candidate.updateOne(
        {
          candidacies: {
            $elemMatch: {
              votingTopicId,
              candidateId,
            },
          },
        },
        {
          $set: {
            "candidacies.$[c].voteCount": voteCount,
            "candidacies.$[c].name": name,
          },
        },
        {
          arrayFilters: [
            {
              "c.votingTopicId": votingTopicId,
              "c.candidateId": candidateId,
            },
          ],
        }
      );
    })
  );
};
