import { useState } from "react";
import axios from "../../services/api";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button";
import { toast } from "react-toastify";

const VotingResult = () => {
  const [votingTopicId, setVotingTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const fetchResults = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a Voting Topic ID.");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const res = await axios.get("/user/voter/get-result", {
        params: { votingTopicId },
      });

      setResults(res.data?.data || []);
      toast.success("Voting results fetched.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Voting Results</h2>

      <FormInput
        label="Voting Topic ID"
        name="votingTopicId"
        value={votingTopicId}
        onChange={(e) => setVotingTopicId(e.target.value)}
        placeholder="e.g. pres2025"
      />

      <Button
        text={loading ? "Loading..." : "View Results"}
        onClick={fetchResults}
        disabled={!votingTopicId.trim() || loading}
        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
      />

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-center text-green-600">
            {results[0].userFullName} is leading!
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((candidate, index) => (
              <div
                key={candidate._id}
                className="border p-4 rounded-xl shadow bg-white flex gap-4 items-center"
              >
                <img
                  src={candidate.avatar}
                  alt={candidate.userFullName}
                  className="w-16 h-16 rounded-full border object-cover"
                />
                <div className="flex-1">
                  <p>
                    <strong>#{index + 1}</strong> — {candidate.userFullName}
                  </p>
                  <p>
                    <strong>Party:</strong> {candidate.party}
                  </p>
                  <p>
                    <strong>Votes:</strong> {candidate.voteCount}
                  </p>
                  <p>
                    <strong>Bio:</strong> {candidate.bio}
                  </p>
                  <p>
                    <strong>Candidate Id:</strong> {candidate.candidateId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <p className="mt-4 text-center text-gray-500">No results to show.</p>
      )}
    </div>
  );
};

export default VotingResult;
