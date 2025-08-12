// dropVoterIndexes.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // if you're using .env for MONGO_URI

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/dVote"; // replace if needed

const dropIndexes = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const indexes = await db.collection("voters").indexes();

    for (const index of indexes) {
      if (index.name !== "_id_") {
        console.log(`Dropping index: ${index.name}`);
        await db.collection("voters").dropIndex(index.name);
      }
    }

    console.log("✅ All non-default indexes dropped successfully.");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error while dropping indexes:", err.message);
    process.exit(1);
  }
};

dropIndexes();
