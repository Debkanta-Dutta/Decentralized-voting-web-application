import express from "express";
import {
  verifyVoter,
  storePublishedResult,
  approveAndRegisterCandidate,
  enableOrDisableVoting,
  unApprovedCandidateList,
  notVerifiedVoterList,
} from "../controllers/topicOwner.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const topicOwnerRouter = express.Router();

topicOwnerRouter.put("/verify/voter", verifyJWT, verifyVoter);

topicOwnerRouter.post("/result", verifyJWT, storePublishedResult);

topicOwnerRouter.post(
  "/approve/candidate",
  verifyJWT,
  approveAndRegisterCandidate
);

topicOwnerRouter.put("/toggle-voting", verifyJWT, enableOrDisableVoting);

topicOwnerRouter.get(
  "/unapproved/candidate-list",
  verifyJWT,
  unApprovedCandidateList
);

topicOwnerRouter.get(
  "/not-verified/voter-list",
  verifyJWT,
  notVerifiedVoterList
);

export default topicOwnerRouter;
