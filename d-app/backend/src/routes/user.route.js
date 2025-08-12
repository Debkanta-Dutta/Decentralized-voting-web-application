import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  setVotingDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const userRouter = express.Router();

userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  registerUser
);

userRouter.post("/login", loginUser);

userRouter.post("/logout", verifyJWT, logoutUser);

userRouter.post("/set/voting-details", verifyJWT, setVotingDetails);

export default userRouter;
