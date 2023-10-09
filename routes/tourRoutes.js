const express = require("express");

// CONTROLLERS
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");

// ROUTERS
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

// NESTED ROUTES
// POST /tours/abcd1234/reviews
// GET /tours/abcd1234/reviews
router.use("/:tourId/reviews", reviewRouter);

// GET TOP-5 CHEAP TOURS
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

// MONGOOSE AGGREGATE PIPELINE to get specific info using
router.route("/tour-stats").get(tourController.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan,
  );

// GEOJOSN/GEOSPATIAL find tours within a certain radius
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);
// /tours-within/233/center/-40,45/unit/mi
// /tours-within?distance=233&center=-40,45&unit=mi(miles)

// GEOJOSN/GEOSPATIAL calculate distance from a certain point
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour,
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour,
  );

module.exports = router;
