import axios from "../../services/api";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button";
import { useState } from "react";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [candidateCount, setCandidateCount] = useState();
  const [voterCount, setVoterCount] = useState();
  const [votingTopicId, setVotingTopicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCount = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a Voting Topic ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data1 = await axios.get("/user/voter/get-voter-no", {
        params: { votingTopicId: votingTopicId.trim() },
      });
      setVoterCount(data1.data.data.count);

      const data2 = await axios.get("/user/voter/get-candidate-no", {
        params: { votingTopicId: votingTopicId.trim() },
      });
      setCandidateCount(data2.data.data.count);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to fetch counts.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <FormInput
        label="Voting Topic ID"
        name="votingTopicId"
        value={votingTopicId}
        onChange={(e) => setVotingTopicId(e.target.value)}
        placeholder="e.g. pres2025"
      />

      <Button
        text={loading ? "Loading..." : "Load Count"}
        onClick={fetchCount}
        disabled={!votingTopicId.trim() || loading}
        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
      />

      {loading ? (
        <p className="mt-4 text-gray-600">Loading stats...</p>
      ) : error ? (
        <p className="mt-4 text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 border rounded shadow">
            <h3 className="text-xl font-semibold">Total Candidates</h3>
            <p className="text-2xl">
              {typeof candidateCount === "number" ? candidateCount : "—"}
            </p>
          </div>
          <div className="p-4 border rounded shadow">
            <h3 className="text-xl font-semibold">Total Voters</h3>
            <p className="text-2xl">
              {typeof voterCount === "number" ? voterCount : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
