import { useState } from "react";
import axios from "../../services/api";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { registerVoter } from "../../services/contract";

const UpdateVoterProfile = () => {
  const [voterId, setVoterId] = useState("");
  const [votingTopicId, setVotingTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!voterId.trim() || !votingTopicId.trim()) {
      toast.error("Please provide both Voting Topic ID and Voter ID.");
      return;
    }

    setLoading(true);

    try {
      if (!window.ethereum) {
        toast.error("MetaMask is not installed.");
        setLoading(false);
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const response = await axios.post("/user/voter/update-profile", {
        voterId: voterId.trim(),
        votingTopicId: votingTopicId.trim(),
        address,
      });

      await registerVoter(votingTopicId.trim());

      toast.success(response?.data?.message || "Voter profile updated!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err?.message || "Profile update failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-slow-spin"></div>
          </div>
        )}

        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-8">
          🔄 Update Voter Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Voter ID"
            name="voterId"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="e.g. IMS2025D"
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
            className={`w-full py-3 rounded-xl text-lg font-semibold transition-all ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>

      {/* Custom Spinner Animation */}
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

export default UpdateVoterProfile;
