import { useState } from "react";
import axios from "../../services/api";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

const CandidateList = () => {
  const [votingTopicId, setVotingTopicId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a voting topic ID.");
      return;
    }

    try {
      setLoading(true);
      setCandidates([]); // clear old data while loading
      const res = await axios.get("/user/voter/candidate-list", {
        params: { votingTopicId },
      });
      setCandidates(res.data?.data?.candidates || []);
      toast.success("Candidates loaded successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Heading */}
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Candidate List
      </h2>

      {/* Input + Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mb-8">
        <input
          type="text"
          name="votingTopicId"
          value={votingTopicId}
          onChange={(e) => setVotingTopicId(e.target.value)}
          placeholder="Enter voting topic ID..."
          className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
        <button
          onClick={fetchCandidates}
          disabled={!votingTopicId.trim() || loading}
          className={`px-6 py-2 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" /> Loading...
            </span>
          ) : (
            "Get Candidates"
          )}
        </button>
      </div>

      {/* Candidates */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 animate-pulse"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mt-1" />
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <p className="text-center text-gray-400 italic">No candidates found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={c.avatar}
                  alt={c.userFullName}
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {c.userFullName}
                  </h3>
                  <p className="text-sm text-gray-500">{c.userEmail}</p>
                </div>
              </div>
              <p className="text-sm text-indigo-600 font-medium">{c.party}</p>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                {c.bio}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateList;
