import { useEffect, useState } from "react";
import axios from "../../services/api.js";
import Button from "../../components/Button";
import { toast } from "react-toastify";
import { addCandidate } from "../../services/contract.js";
import FormInput from "../../components/FormInput.jsx";
const UnapprovedCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(null);
  const [votingTopicId, setVotingTopicId] = useState("");

  const fetchUnapprovedCandidates = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Please enter a Voting Topic ID.");
      return;
    }

    setLoading(true);
    setCandidates([]);
    try {
      const res = await axios.get(
        "/user/topic-owner/unapproved/candidate-list",
        {
          params: { votingTopicId },
        }
      );
      setCandidates(res.data.data.candidates);
    } catch (err) {
      alert(
        err?.response?.data?.message || "Failed to fetch unapproved candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (candidate) => {
    if (!window.confirm(`Approve ${candidate.userFullName} as a candidate?`))
      return;
    try {
      setApproving(candidate._id);
      const payload = {
        fullname: candidate.userFullName,
        email: candidate.userEmail,
        party: candidate.party,
        votingTopicId,
      };
      const res = await axios.post(
        "/user/topic-owner/approve/candidate",
        payload
      );
      const candidateId = res.data?.data?.candidateId;
      if (!candidateId) throw new Error("Candidate ID missing from response");
      await addCandidate(votingTopicId, candidateId, candidate.userFullName);

      toast.success("Candidate approved and added to blockchain!");
      fetchUnapprovedCandidates(); // Refresh list
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approval failed.");
    } finally {
      setApproving(null);
    }
  };

  // useEffect(() => {
  //   fetchUnapprovedCandidates();
  // }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Unapproved Candidates
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
          onClick={fetchUnapprovedCandidates}
          disabled={!votingTopicId.trim() || loading}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        />
      </div>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : candidates.length === 0 ? (
        <p className="text-center text-gray-500">
          No unapproved candidates found.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {candidates.map((c) => (
            <div
              key={c._id}
              className="border p-4 rounded-xl shadow-md bg-white flex gap-4"
            >
              <img
                src={c.avatar}
                alt={c.userFullName}
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div className="flex-1">
                <p>
                  <strong>Name:</strong> {c.userFullName}
                </p>
                <p>
                  <strong>Email:</strong> {c.userEmail}
                </p>
                <p>
                  <strong>Party:</strong> {c.party}
                </p>
                <p>
                  <strong>Bio:</strong> {c.bio}
                </p>
                <p>
                  <strong>Voting Topic Id:</strong> {c.votingTopicId}
                </p>
                <Button
                  text={
                    approving === c._id ? "Approving..." : "Approve & Register"
                  }
                  onClick={() => handleApprove(c)}
                  disabled={approving === c._id}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnapprovedCandidates;
