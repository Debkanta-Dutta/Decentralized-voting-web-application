import { verifyMessage } from "ethers";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.util.js";

const verifyWalletOwnership = async (req, res, next) => {
  try {
    const { address } = req.body;

    if (!address) {
      throw new ApiError(400, "Address is required.");
    }

    if (!req.user || !req.user._id) {
      throw new ApiError(401, "Unauthorized. User context missing.");
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.walletAddress) {
      throw new ApiError(403, "User not found or wallet not linked.");
    }

    console.log(address);
    console.log(user.walletAddress);
    if (address.toLowerCase() !== user.walletAddress.trim().toLowerCase()) {
      throw new ApiError(
        401,
        "Signature verification failed or wallet mismatch."
      );
    }

    // Respond with success if verified
    next();
  } catch (err) {
    const status = err.statusCode || 401;
    next(new ApiError(status, err.message || "Wallet verification failed"));
  }
};

export default verifyWalletOwnership;
