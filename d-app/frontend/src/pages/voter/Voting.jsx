import { useEffect, useState } from "react";
import axios from "../../services/api.js";
import Button from "../../components/Button.jsx";
import FormInput from "../../components/FormInput.jsx";
import { toast } from "react-toastify";
import { castVote as castVoteOnchain } from "../../services/contract.js";
import { ethers } from "ethers";
const CastVotePage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(null);
  const [votingTopicId, setVotingTopicId] = useState("");

  const fetchCandidates = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a Voting Topic ID.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get("/user/voter/candidate-list", {
        params: { votingTopicId },
      });
      setCandidates(res.data?.data?.candidates || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (candidate) => {
    if (
      !window.confirm(
        `Are you sure you want to vote for ${candidate.userFullName}?`
      )
    )
      return;

    try {
      setVoting(candidate._id);
      if (!window.ethereum) {
        toast.error("MetaMask is not installed.");
        setLoading(false);
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      await axios.post("/user/voter/vote", {
        votingTopicId: candidate.votingTopicId,
        candidateId: candidate.candidateId,
        address,
      });
      await castVoteOnchain(candidate.votingTopicId, candidate.candidateId);
      toast.success("Vote successfully cast!");
      setVoting(null);
      fetchCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Vote failed.");
      setVoting(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Cast Your Vote</h2>
      <div className="mb-4">
        <FormInput
          label="Voting Topic ID"
          name="votingTopicId"
          value={votingTopicId}
          onChange={(e) => setVotingTopicId(e.target.value)}
          placeholder="e.g. pres2025"
        />
        <Button
          text={loading ? "Loading..." : "Load Candidates"}
          onClick={fetchCandidates}
          disabled={!votingTopicId.trim() || loading}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        />
      </div>
      {loading ? (
        <p className="text-center">Loading candidates...</p>
      ) : candidates.length === 0 ? (
        <p className="text-center text-gray-500">
          No candidates available for voting.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {candidates.map((candidate) => (
            <div
              key={candidate._id}
              className="border p-4 rounded-xl shadow-md bg-white flex gap-4"
            >
              <img
                src={candidate.avatar}
                alt={candidate.userFullName}
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div className="flex-1">
                <p>
                  <strong>Name:</strong> {candidate.userFullName}
                </p>
                <p>
                  <strong>Email:</strong> {candidate.userEmail}
                </p>
                <p>
                  <strong>Party:</strong> {candidate.party}
                </p>
                <p>
                  <strong>Bio:</strong> {candidate.bio}
                </p>
                <Button
                  text={voting === candidate._id ? "Voting..." : "Vote"}
                  onClick={() => castVote(candidate)}
                  disabled={voting === candidate._id}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CastVotePage;
