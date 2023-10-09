const crypto = require("crypto"); // Built-in module
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE Methods!!!
      validator: function (el) {
        return el === this.password; // Custom validator for confirm the both password abc === abc
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: String,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// On SIGNUP controller hash the password
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  //   Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //   Remove passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

// On RESET PASSWORD or CREATE NEW DOCUMENt this middleware is called
userSchema.pre("save", function (next) {
  // If the password has not been modified || if the document isNew, then exist from this middleware
  if (!this.isModified("password") || this.isNew) return next();

  // Otherwise updates passwordChangedAt (In model) property with current date
  this.passwordChangedAt = Date.now() - 1000; // 1000 = small hack, passwordChangedAt is less 1 second before create new token
  next();
});

// QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  // This points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// On LOGIN controller compare the password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // ("pass1234") === 'efewfwefue323288egg8re3e7ehghrgy3f32f32f4gay12f2'
  return await bcrypt.compare(candidatePassword, userPassword);
};

// On PROTECTING ROUTES when user change/update password after this other routes not works, you need to login again
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // Convert the date in the same format for comparing
  if (this.passwordChangedAt) {
    const changedIntoTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    ); //Convert milliseconds to seconds

    // Token iat(issuedAt) time is always less than the password change/updated timestamp
    return JWTTimestamp < changedIntoTimestamp;
  }

  // False means PASSWORD NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
