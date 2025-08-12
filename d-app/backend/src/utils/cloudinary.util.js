import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  cloud_name,
  cloudinary_api_key,
  cloudinary_api_secret,
} from "../constants/constant.js";

cloudinary.config({
  cloud_name: cloud_name,
  api_key: cloudinary_api_key,
  api_secret: cloudinary_api_secret,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("Successfully Uploaded on Cloudinary", response.url);
    return response;
  } catch (err) {
    fs.unlinkSync(localFilePath);
    console.error("Upload Failed, ERROR:", err);
    return null;
  }
};

export { uploadOnCloudinary };
