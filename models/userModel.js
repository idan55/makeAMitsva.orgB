import mongoose from "mongoose";
import validator from "validator";

// Normalize to E.164 (+972XXXXXXXXX) and reject non‑Israeli numbers early.
export function normalizePhone(phone) {
  if (!phone) return phone;

  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2); // drop international prefix
  if (digits.startsWith("972")) digits = digits.slice(3); // drop country code if present
  while (digits.startsWith("0")) digits = digits.slice(1); // drop leading zeros

  // Require Israeli mobile only: 5XXXXXXXX (9 digits after stripping leading 0)
  if (/^5\d{8}$/.test(digits)) return "+972" + digits;

  return null;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true },
    age: { type: Number, required: true, min: 16, max: 120 },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "Invalid email"],
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (phone) => normalizePhone(phone) ?? phone,
      validate: {
        validator: (phone) => Boolean(normalizePhone(phone)),
        message: "Invalid phone number format",
      },
    },
    stars: { type: Number, default: 0 },
    couponEarned: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },
    profileImage: { type: String, default: "" }, // <-- important
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
