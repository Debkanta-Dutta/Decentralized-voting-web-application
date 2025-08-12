import { useState } from "react";
import axios from "../../services/api";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import { toast } from "react-toastify";

const ToggleVotingPermission = () => {
  const [loading, setLoading] = useState(false);
  const [votingTopicId, setVotingTopicId] = useState("");

  const handleToggle = async () => {
    if (!votingTopicId.trim()) {
      toast.error("Voting Topic ID is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.put("/user/topic-owner/toggle-voting", {
        votingTopicId,
      });

      const newStatus = res.data.data.newVotingPermission
        ? "enabled"
        : "disabled";
      toast.success(
        `Voting permission ${newStatus.toUpperCase()} successfully.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Toggle failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border shadow-lg rounded bg-white">
      <h2 className="text-xl font-bold text-center mb-6">
        Toggle Voting Permission
      </h2>

      <FormInput
        label="Voting Topic ID"
        name="votingTopicId"
        value={votingTopicId}
        onChange={(e) => setVotingTopicId(e.target.value)}
        placeholder="e.g. pres2025"
      />

      <p className="text-center mb-4 text-gray-600">
        Click the button below to enable or disable voting for all verified
        voters.
      </p>

      <div className="flex justify-center">
        <Button
          text={loading ? "Processing..." : "Toggle Voting Permission"}
          onClick={handleToggle}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        />
      </div>
    </div>
  );
};

export default ToggleVotingPermission;
