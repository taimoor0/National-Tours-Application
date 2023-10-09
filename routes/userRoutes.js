const express = require("express");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

// 1. FOR AUTH CONTROLLER
// SIGNUP
router.post("/signup", authController.signup);

// LOGIN
router.post("/login", authController.login);

// LOGGED OUT
router.get("/logout", authController.logout);

// FORGOT PASSWORD
router.post("/forgotPassword", authController.forgotPassword);

// RESET PASSWORD
router.patch("/resetPassword/:token", authController.resetPassword);

// MAIN POINT: Middleware: Protect all routes after this middleware
router.use(authController.protect);

// UPDATE USER PASSWORD
router.patch("/updatePassword", authController.updatePassword);

// 2. FOR USER CONTROLLER
// GET ME PROFILE
router.get("/me", userController.getMe, userController.getUser);

// UPDATE USER DATA
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

// DELETE USER Temporary active: false the user
router.delete("/deleteMe", userController.deleteMe);

router.use(authController.restrictTo("admin"));

// GET ALL USERS
router.route("/").get(userController.getAllUsers);

// GET USER
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
