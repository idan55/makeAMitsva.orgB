import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [
        true,
        "Please enter the title of the mitsva - max 10 characters",
      ],
      maxlength: [10, "Title cannot exceed 10 characters"],
      trim: true,
    },
    description: {
      type: String,
      required: [
        true,
        "Please enter the description of the mitsva - max 200 characters",
      ],
      maxlength: [200, "Description cannot exceed 200 characters"],
      trim: true,
    },
    urgency: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mitsva must have a creator"],
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    helperConfirmed: {
      type: Boolean,
      default: false,
    },
    seekerConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
requestSchema.index({ location: "2dsphere" });
requestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Request = mongoose.model("Request", requestSchema);
