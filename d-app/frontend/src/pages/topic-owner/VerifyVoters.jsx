import { useEffect, useState } from "react";
import axios from "../../services/api";
import Button from "../../components/Button";
import { verifyVoter as verifyVoterOnChain } from "../../services/contract.js";
import { toast } from "react-toastify";
import FormInput from "../../components/FormInput.jsx";

const VerifyVoters = () => {
  const [voters, setVoters] = useState([]);
  const [votingTopicId, setVotingTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(null);

  const fetchNotVerifiedVoters = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a Voting Topic ID.");
      return;
    }

    setLoading(true);
    setVoters([]);
    try {
      const res = await axios.get("/user/topic-owner/not-verified/voter-list", {
        params: { votingTopicId },
      });
      setVoters(res.data.data.voters);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch voters.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (voter) => {
    if (!window.confirm(`Verify ${voter.userFullName} as a voter?`)) return;

    try {
      setVerifying(voter._id);

      // Step 1: On-chain verification
      await verifyVoterOnChain(votingTopicId, voter.walletAddress);

      // Step 2: Backend sync
      await axios.put("/user/topic-owner/verify/voter", {
        votingTopicId,
        walletAddress: voter.walletAddress,
        voterId: voter.voterId,
      });

      toast.success("Voter verified successfully.");
      fetchNotVerifiedVoters();
    } catch (err) {
      if (err.code === 4001) {
        toast.info("Transaction cancelled by user.");
      } else {
        toast.error(err?.response?.data?.message || "Verification failed.");
      }
    } finally {
      setVerifying(null);
    }
  };

  // Optional: Auto-load if needed
  // useEffect(() => {
  //   if (votingTopicId.trim()) fetchNotVerifiedVoters();
  // }, [votingTopicId]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Not Verified Voters
      </h2>

      <div className="mb-4">
        <FormInput
          label="Voting Topic ID"
          name="votingTopicId"
          value={votingTopicId}
          onChange={(e) => setVotingTopicId(e.target.value)}
          placeholder="e.g. pres2025"
        />
        <Button
          text={loading ? "Loading..." : "Load Voters"}
          onClick={fetchNotVerifiedVoters}
          disabled={!votingTopicId.trim() || loading}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        />
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : voters.length === 0 ? (
        <p className="text-center text-gray-500">No unverified voters found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {voters.map((v) => (
            <div
              key={v._id}
              className="border p-4 rounded-xl shadow-md bg-white flex gap-4"
            >
              <img
                src={v.avatar}
                alt={v.userFullName}
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div className="flex-1">
                <p>
                  <strong>Name:</strong> {v.userFullName}
                </p>
                <p>
                  <strong>Wallet:</strong> {v.walletAddress}
                </p>
                <p>
                  <strong>Voter ID:</strong> {v.voterId}
                </p>
                <Button
                  text={verifying === v._id ? "Verifying..." : "Verify Voter"}
                  onClick={() => handleVerify(v)}
                  disabled={verifying === v._id}
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

export default VerifyVoters;
