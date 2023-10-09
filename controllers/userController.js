const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo"); // Use this as a middleware in "updateMe" route

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  // Step 1: Initialize an empty object to store the filtered fields.
  const newObj = {};

  // Step 2: Get an array of all keys (field names) in the input object.
  const keys = Object.keys(obj);

  // Step 3: Loop through each key (field name) in the input object.
  keys.forEach((key) => {
    // Step 4: Check if the key is included in the allowedFields array.
    if (allowedFields.includes(key)) {
      // Step 5: If the key is allowed, add it to the newObj with its corresponding value.
      newObj[key] = obj[key];
    }
  });

  // Step 6: Return the newObj containing only the allowed fields.
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. please use /updatePassword",
        400,
      ),
    );
  }

  // 2. Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: "success", data: { user: updatedUser } });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // And in respnose the deleted user not show, with query middleware function

  res.status(204).json({ status: "success", data: null });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// ONLY FOR ADMIN
exports.updateUser = factory.updateOne(User); // DO NOT update passwords with this!
exports.deleteUser = factory.deleteOne(User);
