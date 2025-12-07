import User from "../models/userModel.js";
import { Request } from "../models/requestModel.js";

const publicUserFields = "_id name email phone role isBanned stars couponEarned profileImage createdAt updatedAt";

export async function listUsers(req, res) {
  try {
    const users = await User.find({}, publicUserFields).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to list users", details: err.message });
  }
}

export async function banUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isBanned: true }, { new: true }).select(publicUserFields);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User banned", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to ban user", details: err.message });
  }
}

export async function unbanUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isBanned: false }, { new: true }).select(publicUserFields);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User unbanned", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to unban user", details: err.message });
  }
}

export async function deleteUserAdmin(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user", details: err.message });
  }
}

export async function listRequests(req, res) {
  try {
    const requests = await Request.find({})
      .populate("createdBy", "name email")
      .populate("completedBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to list requests", details: err.message });
  }
}

export async function deleteRequestAdmin(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Request.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Request not found" });
    res.json({ message: "Request deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete request", details: err.message });
  }
}
