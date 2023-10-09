const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handlerJWTError = () => {
  return new AppError("Invalid token. Please login again!", 401);
};

const hanlderTokenExpiredError = () => {
  return new AppError("Your token has expired! Please login again.", 401);
};

// Error Response During Development Mode
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) REDERED WEBSITE
  console.error("ERROR 💥", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message,
  });
};

// Error Response During Production Mode
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // a) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // b) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error("ERROR 💥", err);

    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  // B) RENDERED WEBSITE
  // a) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  // b) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR 💥", err);
  // 2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again late.",
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  console.log("... Please fix the error in your code ...");

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Error In Development Mode
  if (process.env.NODE_ENV === "development") {
    console.log("Error In Development Mode");

    sendErrorDev(err, req, res);
  }

  // Error In Production Mode
  else if (process.env.NODE_ENV === "production") {
    console.log("Error In Development Mode");

    // Cast Error
    if (err.name === "CastError") {
      console.log("CastError occurred:", err.message);

      const castError = handleCastErrorDB(err);
      castError.isOperational = true;
      sendErrorProd(castError, res);
    }

    //  Duplicate Fields Error
    else if (err.code === 11000) {
      console.log("DuplicateFieldsError occurred:", err.message);

      const DuplicateFieldsError = handleDuplicateFieldsDB(err);
      DuplicateFieldsError.isOperational = true;
      sendErrorProd(DuplicateFieldsError, res);
    }

    //  Validation Error
    else if (err.name === "ValidationError") {
      console.log("ValidationError occurred: ", err.message);

      const ValidationError = handleValidationErrorDB(err);
      ValidationError.isOperational = true;
      sendErrorProd(ValidationError, res);
    }

    // Json Web Token (JWT) Error
    else if (err.name === "JsonWebTokenError") {
      console.log("JsonWebTokenError occured: ", err.message);

      const JWTError = handlerJWTError();
      JWTError.isOperational = true;
      sendErrorProd(JWTError, res);
    }

    // Token Expired Error
    else if (err.name === "TokenExpiredError") {
      console.log("TokenExpiredError occured: ", err.message);

      const TokenExpiredError = hanlderTokenExpiredError();
      TokenExpiredError.isOperational = true;
      sendErrorProd(TokenExpiredError, res);
    }

    // Programming or other error
    else {
      sendErrorProd(err, req, res);
    }
  }
};
