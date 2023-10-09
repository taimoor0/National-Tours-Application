const mongoose = require("mongoose");
const dotenv = require("dotenv");

// For Synchronous Code: Uncaught Exception Error Handler
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD,
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then(() => console.log(`DB Connection Successful !!!`));

const port = process.env.PORT || 8000; // localhost = 127.0.0.1
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

// For Asynchronous Code: Express UnHandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLER REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  // console.log(err);
  server.close(() => {
    process.exit(1); // Code zero 0: stands for Success // Code 1: stands for: uncaught exception
  });
});
