import { useEffect, useState } from "react";
import axios from "../../services/api";
import { toast } from "react-toastify";

const VotingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/user/voter/history");
      setHistory(res.data?.data?.history || []);
      toast.success("Voting history loaded.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        Your Voting History
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading history...</p>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500">No voting history found.</p>
      ) : (
        <ul className="space-y-4">
          {history.map((entry, index) => (
            <li key={index} className="p-4 border rounded-xl shadow bg-white">
              <p>
                <strong>Topic Name:</strong> {entry.topicName || "N/A"}
              </p>
              <p>
                <strong>Voting Topic ID:</strong> {entry.votingTopicId}
              </p>
              <p>
                <strong>Candidate ID:</strong> {entry.votedTo}
              </p>
              <p>
                <strong>Voted At:</strong>{" "}
                {new Date(entry.votedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VotingHistory;
