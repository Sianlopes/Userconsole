const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"]
    },
    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [120, "Age cannot exceed 120"]
    },
    hobbies: {
      type: [String],
      default: [],
      validate: {
        validator(hobbies) {
          return hobbies.every((hobby) => typeof hobby === "string" && hobby.trim().length > 0);
        },
        message: "Each hobby must be a non-empty string"
      }
    },
    bio: {
      type: String,
      default: "",
      trim: true
    },
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    timestamps: false,
    collection: "users"
  }
);

userSchema.index({ name: 1 });
userSchema.index({ email: 1, age: 1 });
userSchema.index({ hobbies: 1 });
userSchema.index({ bio: "text" });
userSchema.index({ userId: "hashed" });
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model("User", userSchema);
