import mongoose from "mongoose";
const uri = "mongodb://localhost:27017/dVote";
const dbConnect = async () => {
  try {
    await mongoose.connect(uri);
    console.log("DataBase is Connected Successfully ✅✅🚀🚀 in:", uri);
  } catch (err) {
    console.error("ERROR in DataBase Connection❌❌☠️☠️", err);
  }
};
export { dbConnect };
