import express from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./src/db/db_connect.js";
import userRouter from "./src/routes/user.route.js";
import voterRouter from "./src/routes/voter.route.js";
import topicOwnerRouter from "./src/routes/topicOwner.route.js";
import cors from "cors";

const port = 8081;
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("Hi, Voters App is getting ready for you..");
});

app.use("/user", userRouter);
app.use("/user/voter", voterRouter);
app.use("/user/topic-owner", topicOwnerRouter);

dbConnect()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("DB connection Failed!", err);
  });
