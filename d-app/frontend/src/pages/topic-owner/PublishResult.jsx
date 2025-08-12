import { useState } from "react";
import axios from "../../services/api";
import Button from "../../components/Button.jsx";
import FormInput from "../../components/FormInput.jsx";
import { toast } from "react-toastify";
import { publishResult } from "../../services/contract.js";

const PublishedResult = () => {
  const [votingTopicId, setVotingTopicId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const publishAndFetchResult = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a valid Voting Topic ID.");
      return;
    }

    try {
      setLoading(true);
      await publishResult(votingTopicId);
      const res = await axios.post("/user/topic-owner/result", {
        votingTopicId,
      });
      setResult(res.data?.data || null);
      toast.success("Result published successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to publish result.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Publish & View Voting Result
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
          text={loading ? "Publishing..." : "Publish Result"}
          onClick={publishAndFetchResult}
          disabled={loading || !votingTopicId.trim()}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        />
      </div>

      {loading && <p className="text-center">Publishing result...</p>}

      {result && (
        <div className="mt-6 p-4 border rounded-xl bg-white shadow-md">
          <h3 className="text-xl font-semibold mb-2 text-green-700">
            🏆 Winner: {result.winnerName}
          </h3>
          <p>
            <strong>Candidate ID:</strong> {result.winnerId}
          </p>
          <p>
            <strong>Total Votes Received:</strong> {result.totalVotes}
          </p>
          <p>
            <strong>Voting Topic ID:</strong> {result.votingTopicId}
          </p>
          <p>
            <strong>Published At:</strong>{" "}
            {new Date(result.publishedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default PublishedResult;
