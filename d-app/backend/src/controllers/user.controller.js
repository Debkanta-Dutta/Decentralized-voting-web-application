import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.util.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
import { Result } from "../models/result.model.js";

const generateRefreshTokenAccessToken = async function (userId) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(400, "User Not Exists!");
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    console.error(err);
    throw new ApiError(505, "Internal Server Error in Token Generation!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, walletAddress } = req.body;
  if (
    [fullname, email, password, walletAddress].some(
      (field) => field?.trim() == ""
    )
  )
    throw new ApiError(404, "All Fields are Required to Register.");

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) throw new ApiError(404, "Avatar path is Required!");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar)
    throw new ApiError(404, "Avatar Upload is failed on Cloudinary!");

  const existingUser = await User.findOne({
    $or: [{ email }, { walletAddress }],
  });

  if (existingUser)
    throw new ApiError(400, "The user with the email already exists!");
  const user = await User.create({
    fullname,
    email,
    password,
    walletAddress,
    avatar: avatar.url,
  });
  await user.save();
  if (!user) {
    throw new ApiError(500, "Server problem at creating new User");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Created Succesfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() == ""))
    throw new ApiError(404, "All Fields are Required to Login.");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "There is No user with this Email id.");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Password MisMatch");

  const { accessToken, refreshToken } = await generateRefreshTokenAccessToken(
    user._id
  );
  const Option = {
    httpOnly: true,
    secure: true,
  };
  const logedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  return res
    .status(200)
    .cookie("AccessToken", accessToken, Option)
    .cookie("RefreshToken", refreshToken, Option)
    .json(new ApiResponse(200, logedInUser, "Login Successfully."));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  };
  res
    .status(200)
    .clearCookie("RefreshToken", options)
    .clearCookie("AccessToken", options)
    .json(new ApiResponse(200, {}, "Logout Successfully"));
});

const requestForDelete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const requestedUser = await User.findByIdAndUpdate(req.user._id, {
    deleteRequest: true,
  });

  if (!requestedUser) {
    throw new ApiError(500, "Could not mark delete request, try again later.");
  }

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  };

  res
    .status(200)
    .clearCookie("RefreshToken", options)
    .clearCookie("AccessToken", options)
    .json(
      new ApiResponse(
        200,
        { requestedUser },
        "Delete request submitted successfully."
      )
    );
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  await user.deleteOne();

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  };

  res
    .status(200)
    .clearCookie("RefreshToken", options)
    .clearCookie("AccessToken", options)
    .json(new ApiResponse(200, {}, "Account Deleted Successfully."));
});

const setVotingDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(403, "Invalid user.");
  }
  const { votingTopicName, votingTopicId } = req.body;

  if ([votingTopicId, votingTopicName].some((field) => field?.trim() === "")) {
    throw new ApiError(
      400,
      "Voting ID and Voting Topic are required for new voting process."
    );
  }

  const existing = await Result.findOne({ votingTopicId, votingTopicName });
  if (existing) {
    throw new ApiError(403, "Voting with this ID and Topic already exists.");
  }

  const voting = await Result.create({ votingTopicId, votingTopicName });
  if (!voting) {
    throw new ApiError(
      500,
      "An error occurred while creating the new voting system."
    );
  }

  user.isVotingTopicOwner = true;
  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { voting },
        "Successfully created new voting system."
      )
    );
});

export { registerUser, loginUser, logoutUser, deleteUser, setVotingDetails };
