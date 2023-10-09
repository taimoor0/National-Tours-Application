const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// 1 - ROUTES
// CLIENT SIDE
const viewRouter = require("./routes/viewRoutes");

// SERVER SIDE
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const app = express();

// 2 - SET TEMPLATE ENGINE (pug)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 3 - GLOBAL MIDDLEWARES
// => Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

// => Set security HTTP headers
app.use(helmet());

// => Development logging
console.log(process.env.NODE_ENV, "mode is on ...");
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// => Limit Request from same API
// This allow 100 requests from the same IP in 1 one hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, Please try again in an hour!",
});
// app.use(limiter);
app.use("/api", limiter);

// => Body parser, reading data from body into req.body
// app.use(express.json());
app.use(express.json({ limit: "10kb" })); // If body larger than 10-kilobyte, it will not accepted
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// => Data Sanitization against NoSql query injection
app.use(mongoSanitize());

// => Data Sanitization against XSS (cross-site scripting attacks)
app.use(xss());

// => Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// => Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// 4 - ROUTERS
// Client Side
app.use("/", viewRouter);

// SERVER SIDE
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// 5 - All API routers handler
app.all("*", (req, res, next) => {
  next(new AppError(`Page Not Found ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
