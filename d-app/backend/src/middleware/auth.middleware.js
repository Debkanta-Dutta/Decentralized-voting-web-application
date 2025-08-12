import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { jwtAccessTokenSecret } from "../constants/constant.js";

const verifyJWT = asyncHandler(async function (req, res, next) {
  try {
    const token =
      req.cookies?.AccessToken ||
      req.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return next(new ApiError(401, "Unauthorized: Access token missing"));
    }
    const decodedToken = jwt.verify(token, jwtAccessTokenSecret);
    if (!decodedToken?._id)
      throw new ApiError(401, "Unauthorized: Token Mismatch");
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user)
      return next(
        new ApiError(
          401,
          "Unauthorized: There is problem in getting user details from jwt"
        )
      );
    req.user = user;
    return next();
  } catch (err) {
    return next(new ApiError(505, err.message || "Issue While Verifying JWT"));
  }
});

export { verifyJWT };
