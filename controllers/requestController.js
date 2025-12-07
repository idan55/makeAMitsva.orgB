import { Request } from "../models/requestModel.js";
import User from "../models/userModel.js";

// CREATE REQUEST
export async function postRequest(req, res) {
  try {
    const { title, description, longitude, latitude } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: "Title or description missing" });
    }
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "Location (lat, lng) is required" });
    }

    const newRequest = await Request.create({
      title,
      description,
      createdBy: userId,
      isCompleted: false,
      location: {
        type: "Point",
        coordinates: [longitude, latitude], // [lng, lat]
      },
    });

    res.status(201).json({
      message: "Request created successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error("postRequest error:", error);
    res.status(500).json({
      message: "Error creating request",
      error: error.message,
    });
  }
}

// NEARBY BY DISTANCE
export async function getAllRequestsByDistance(req, res) {
  try {
    const { longitude, latitude, distanceInMeters } = req.query;

    if (latitude == null || longitude == null || distanceInMeters == null) {
      return res
        .status(400)
        .json({ error: "Location (lat, lng) and distance are required" });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistance = parseFloat(distanceInMeters); // meters

    if (Number.isNaN(lng) || Number.isNaN(lat) || Number.isNaN(maxDistance)) {
      return res.status(400).json({ error: "Invalid coordinates or distance" });
    }

    console.log("Geo query:", { lng, lat, maxDistance });

    const requests = await Request.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat], // [lng, lat]
          },
          distanceField: "distance",
          maxDistance: maxDistance,
          spherical: true,
          query: { isCompleted: false },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      { $unwind: "$createdBy" },
    ]);

    res.status(200).json({
      message: "Requests fetched successfully",
      requests,
    });
  } catch (error) {
    console.error("getAllRequestsByDistance error:", error);
    res.status(500).json({
      message: "Error fetching requests",
      error: error.message,
    });
  }
}

// OPEN REQUESTS CREATED BY ME
export async function getMyOpenRequests(req, res) {
  try {
    const userId = req.user.id;

    const requests = await Request.find({
      createdBy: userId,
      isCompleted: false,
    }).populate("createdBy completedBy");

    res.status(200).json({
      message: "My open requests fetched successfully",
      requests,
    });
  } catch (error) {
    console.error("getMyOpenRequests error:", error);
    res.status(500).json({
      message: "Error fetching my open requests",
      error: error.message,
    });
  }
}

// REQUESTS I SOLVED FOR OTHERS (COMPLETED BY ME)
export async function getAllRequestsByCompleterid(req, res) {
  try {
    const completerId = req.user.id;

    const requests = await Request.find({
      completedBy: completerId,
      isCompleted: true,
    }).populate("createdBy");

    res.status(200).json({
      message: "Requests fetched successfully",
      requests,
    });
  } catch (error) {
    console.error("getAllRequestsByCompleterid error:", error);
    res.status(500).json({
      message: "Error fetching requests",
      error: error.message,
    });
  }
}

// HELPER: "I WANT TO HELP"
export async function wantToHelp(req, res) {
  try {
    const requestId = req.params.id;
    const helperId = req.user.id;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // cannot help your own request
    if (request.createdBy.toString() === helperId) {
      return res
        .status(400)
        .json({ error: "You cannot help your own request" });
    }

    // if already has another helper
    if (request.completedBy && request.completedBy.toString() !== helperId) {
      return res
        .status(400)
        .json({ error: "This request already has a helper" });
    }

    request.completedBy = helperId;
    request.helperConfirmed = true;
    await request.save();

    const populated = await request.populate("createdBy completedBy");

    res.status(200).json({
      message: "You are now marked as the helper for this request",
      request: populated,
    });
  } catch (error) {
    console.error("wantToHelp error:", error);
    res.status(500).json({
      error: "Error marking request helper",
      details: error.message,
    });
  }
}

// CREATOR: MARK REQUEST COMPLETED
export async function markRequestCompleted(req, res) {
  try {
    const requestId = req.params.id;
    const seekerId = req.user.id;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // only the creator can confirm completion
    if (request.createdBy.toString() !== seekerId) {
      return res
        .status(403)
        .json({ error: "Only the creator can mark this as completed" });
    }

    if (!request.completedBy) {
      return res
        .status(400)
        .json({ error: "No helper has been assigned to this request yet" });
    }

    // mark that the seeker confirmed
    request.seekerConfirmed = true;

    // if both sides confirmed and not already completed -> close + give stars + coupon check
    if (
      request.helperConfirmed &&
      request.seekerConfirmed &&
      !request.isCompleted
    ) {
      request.isCompleted = true;

      // ⭐ give 10 stars to the helper (if still exists)
      const helperExists = await User.findById(request.completedBy);
      if (helperExists) {
        const updatedHelper = await User.findByIdAndUpdate(
          request.completedBy,
          { $inc: { stars: 10 } },
          { new: true }
        );

        if (updatedHelper && updatedHelper.stars >= 500 && !updatedHelper.couponEarned) {
          updatedHelper.couponEarned = true;
          await updatedHelper.save();
          // here you could also trigger email, SMS, etc.
        }
      } else {
        // Helper was deleted; still mark completed but skip star/coupon logic
        console.warn("Completed request has deleted helper, skipping stars.", {
          requestId: requestId,
          helperId: request.completedBy,
        });
      }
    }

    await request.save();

    const populated = await request.populate("createdBy completedBy");

    res.status(200).json({
      message: "Request marked as completed",
      request: populated,
    });
  } catch (error) {
    console.error("markRequestCompleted error:", error);
    res.status(500).json({
      error: "Error marking request as completed",
      details: error.message,
    });
  }
}

// REQUESTS I CREATED THAT ARE COMPLETED
export async function getMyCompletedRequests(req, res) {
  try {
    const userId = req.user.id;

    const requests = await Request.find({
      createdBy: userId,
      isCompleted: true,
    }).populate("createdBy completedBy");

    res.status(200).json({
      message: "My completed requests fetched successfully",
      requests,
    });
  } catch (error) {
    console.error("getMyCompletedRequests error:", error);
    res.status(500).json({
      message: "Error fetching my completed requests",
      error: error.message,
    });
  }
}
