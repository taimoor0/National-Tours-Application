const crypto = require("crypto");

const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.nonceValue = (req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
};

exports.setCSP = (req, res, next) => {
  // Define allowed sources for scripts, including 'self', 'nonce', and the Mapbox script source
  const scriptSources = [
    "'self'",
    `'nonce-${res.locals.nonce}'`,
    "https://api.mapbox.com",
    "https://js.stripe.com", // Add this line
  ];

  // Define allowed sources for web workers (add 'blob' to allow blob URLs)
  const workerSources = ["'self'", "https://api.mapbox.com", "blob:"];

  // Combine script and worker sources into the Content Security Policy header
  const cspHeader = `script-src ${scriptSources.join(
    " ",
  )}; worker-src ${workerSources.join(" ")}`;

  // Set the Content Security Policy header
  res.setHeader("Content-Security-Policy", cspHeader);

  next();
};

exports.getOverview = catchAsync(async (req, res) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Render that templates using tour data from step-1
  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get the data, for the requested tour (Including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    select: "review rating user",
  });

  if (!tour) {
    return next(new AppError(`There is no tour with that name.`, 404));
  }

  // 2. Render template using the data from step-1
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Login to your account",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2. Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});
