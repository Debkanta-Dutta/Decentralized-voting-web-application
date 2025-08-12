import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  totalNoOfVoters,
  totalNoOfCandidate,
  updateVoterProfile,
  applyAsCandidate,
  voterList,
  candidateList,
  castVote,
  getResultList,
  getHistory,
} from "../controllers/voter.controller.js";
import verifyWalletOwnership from "../middleware/verifyWalletOwnership.middleware.js";

const voterRouter = express.Router();

voterRouter.post(
  "/update-profile",
  verifyJWT,
  verifyWalletOwnership,
  updateVoterProfile
);
voterRouter.post("/apply/candidate", verifyJWT, applyAsCandidate);
voterRouter.get("/voter-list", verifyJWT, voterList);
voterRouter.get("/candidate-list", verifyJWT, candidateList);
// voterRouter.post("/search-voter", verifyJWT, searchVoters);
// voterRouter.post("/search-candidate", verifyJWT, searchCandidates);
voterRouter.get("/get-candidate-no", verifyJWT, totalNoOfCandidate);
voterRouter.get("/get-voter-no", verifyJWT, totalNoOfVoters);
voterRouter.get("/get-result", verifyJWT, getResultList);
voterRouter.get("/history", verifyJWT, getHistory);
voterRouter.post("/vote", verifyJWT, verifyWalletOwnership, castVote);
export default voterRouter;
