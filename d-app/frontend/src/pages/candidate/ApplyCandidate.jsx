import { useState } from "react";
import axios from "../../services/api";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import FormInput from "../../components/FormInput";
import { toast } from "react-toastify";

const ApplyCandidate = () => {
  const [form, setForm] = useState({ party: "", bio: "", votingTopicId: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.party.trim() || !form.votingTopicId.trim()) {
      return toast.error("Party name and Voting Topic Id are required.");
    }

    try {
      setLoading(true);
      await axios.post("/user/voter/apply/candidate", form);
      toast.success("Applied successfully as a candidate!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to apply as candidate"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border shadow-md rounded bg-white">
      <h2 className="text-xl font-bold mb-4 text-center">Apply as Candidate</h2>
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Party Name"
          name="party"
          value={form.party}
          onChange={handleChange}
        />
        <FormInput
          label="Voting Topic ID"
          name="votingTopicId"
          value={form.votingTopicId}
          onChange={handleChange}
          placeholder="e.g. pres2025"
        />
        <div className="mb-4">
          <label className="block mb-1 font-medium">Bio (optional)</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Write something about your agenda or background"
            rows="4"
          ></textarea>
        </div>
        <Button type="submit" text={loading ? "Submitting..." : "Apply"} />
      </form>
    </div>
  );
};

export default ApplyCandidate;
