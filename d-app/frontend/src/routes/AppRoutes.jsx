import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Home from "../pages/user/Home.jsx";
import Login from "../pages/user/Login.jsx";
import Register from "../pages/user/Register.jsx";
import Voting from "../pages/voter/Voting.jsx";
import UpdateVoterProfile from "../pages/voter/UpdateVoterProfile.jsx";
import CandidateList from "../pages/voter/CandidateList.jsx";
import VoterList from "../pages/voter/VoterList.jsx";
import Dashboard from "../pages/voter/Dashboard.jsx";
import ApplyCandidate from "../pages/candidate/ApplyCandidate.jsx";
import UnapprovedCandidates from "../pages/topic-owner/UnApprovedCandidates.jsx";
import VerifyVoters from "../pages/topic-owner/VerifyVoters.jsx";
import EnableVoting from "../pages/topic-owner/EnableVoting.jsx";
import PublishResult from "../pages/topic-owner/PublishResult.jsx";
import SetVotingTopic from "../pages/user/SetVotingTopic.jsx";
import VotingResult from "../pages/voter/VotingResult.jsx";
import VotingHistory from "../pages/voter/VotingHistory.jsx";
import Options from "../pages/user/Options.jsx";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/voting" element={<Voting />} />
      <Route path="/update-profile" element={<UpdateVoterProfile />} />
      <Route path="/candidate-list" element={<CandidateList />} />
      <Route path="/voter-list" element={<VoterList />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/apply-candidate" element={<ApplyCandidate />} />
      <Route path="/approve-candidate" element={<UnapprovedCandidates />} />
      <Route path="/verify-voter" element={<VerifyVoters />} />
      <Route path="/enable-voting" element={<EnableVoting />} />
      <Route path="/admin/result" element={<PublishResult />} />
      <Route path="/set-voting" element={<SetVotingTopic />} />
      <Route path="/voting/result" element={<VotingResult />} />
      <Route path="/history" element={<VotingHistory />} />
      <Route path="/options" element={<Options />} />
    </Route>
  </Routes>
);

export default AppRoutes;
