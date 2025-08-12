import { useState } from "react";
import axios from "../../services/api";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import { createVotingTopic as createVotingTopicOnChain } from "../../services/contract.js";
import { toast } from "react-toastify";

const SetVotingTopic = () => {
  const [votingTopicName, setVotingTopicName] = useState("");
  const [votingTopicId, setVotingTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!votingTopicName.trim() || !votingTopicId.trim()) {
      toast.error("Please provide both Voting Topic Name and ID.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");

    try {
      // Step 1: Call smart contract
      await createVotingTopicOnChain(
        votingTopicId.trim(),
        votingTopicName.trim()
      );
      toast.success("✅ Voting topic created on blockchain.");

      // Step 2: Store in backend
      const res = await axios.post("/user/set/voting-details", {
        votingTopicName: votingTopicName.trim(),
        votingTopicId: votingTopicId.trim(),
      });

      // Step 3: Show success
      setSuccessMessage(
        `✅ Voting topic "${res.data.data.voting.votingTopicName}" with ID "${res.data.data.voting.votingTopicId}" created successfully.`
      );

      // Step 4: Reset input fields
      setVotingTopicName("");
      setVotingTopicId("");

      toast.info("ℹ️ Please update Voting Topic ID in your voter profile.");
    } catch (err) {
      if (err.code === 4001) {
        toast.info("Transaction rejected by user.");
      } else {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create voting topic.";
        toast.error(`❌ ${errorMessage}`);
        console.error("Error:", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-slow-spin"></div>
          </div>
        )}

        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-8">
          🗳️ Create New Voting Topic
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Voting Topic Name"
            name="votingTopicName"
            value={votingTopicName}
            onChange={(e) => setVotingTopicName(e.target.value)}
            placeholder="e.g. College President Election"
          />

          <FormInput
            label="Voting Topic ID"
            name="votingTopicId"
            value={votingTopicId}
            onChange={(e) => setVotingTopicId(e.target.value)}
            placeholder="e.g. pres2025"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-lg font-semibold transition-all duration-200"
          >
            {loading ? "Creating..." : "Create Voting Topic"}
          </button>
        </form>

        {successMessage && (
          <div className="mt-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm shadow-sm">
            {successMessage}
          </div>
        )}
      </div>

      {/* Custom spinner animation */}
      <style>{`
      @keyframes slow-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .animate-slow-spin {
        animation: slow-spin 1.6s linear infinite;
      }
    `}</style>
    </div>
  );
};

export default SetVotingTopic;
