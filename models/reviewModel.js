const mongoose = require("mongoose");

const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// 1. QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  // TURN OFF NESTED POPULATES IN MODELS
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

// 2. STATICS METHOD // CALCULATE AVERAGE RATINGS IN TOUR DOCUMENT
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    // 1. Select all REVIEWS that actually belongs to the current tour
    {
      $match: { tour: tourId },
    },
    // 2. Calculate AvgRating On NumberOfReviews
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 }, // Number of ratings For Reviews (5 users reviews on 1doc = 5 nRating)
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  console.log("Calculate Average Ratings", stats);
  // OUTPUT:
  // Calculate Average Ratings [
  //   {
  //     _id: new ObjectId("65092b7fa4b36e292efa94e3"),
  //     nRating: 2,
  //     avgRating: 4
  //   }
  // ]

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
// Now call Above 👆 this method here below
reviewSchema.post("save", function () {
  // this keyword points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // const r = await this.findOne();
  this.r = await this.findOne(); // ERROR: it not work with "await" and not updated in tours
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); //Does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
