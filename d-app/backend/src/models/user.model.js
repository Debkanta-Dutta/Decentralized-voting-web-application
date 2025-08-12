import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  jwtAccessTokenExpiry,
  jwtAccessTokenSecret,
  jwtRefreshTokenExpiry,
  jwtRefreshTokenSecret,
} from "../constants/constant.js";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      match: /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      min: [8, "password should have at least 8 char!"],
    },
    isVotingTopicOwner: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    avatar: {
      type: String,
    },
    profileId: {
      type: mongoose.Types.ObjectId,
      ref: "Voter",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const pass = this.password;
    this.password = await bcrypt.hash(pass, 10);
    next();
  } catch (err) {
    console.error("Hashing Error", err);
    next(err);
  }
});

userSchema.methods.isPasswordCorrect = async function (pass) {
  try {
    return await bcrypt.compare(pass, this.password);
  } catch (err) {
    console.error("Comparison Error", err);
    return false;
  }
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      fullname: this.fullname,
      email: this.email,
      profileId: this.profileId,
      walletAddress: this.walletAddress,
      isVotingTopicOwner: this.isVotingTopicOwner,
    },
    jwtAccessTokenSecret,
    {
      expiresIn: jwtAccessTokenExpiry,
    }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    { _id: this._id, profileId: this.profileId },
    jwtRefreshTokenSecret,
    {
      expiresIn: jwtRefreshTokenExpiry,
    }
  );
};

export const User = mongoose.model("User", userSchema);
