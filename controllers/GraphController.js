// controllers/graphController.js
import { Request } from "../models/requestModel.js";
import fetch from "node-fetch";

export const getUserRequestActivityChart = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ req existe ici
    const stats = await Request.aggregate([
      {
        $facet: {
          postedByMe: [{ $match: { createdBy: userId } }, { $count: "count" }],
          completedByMe: [
            { $match: { completedBy: userId, status: "completed" } },
            { $count: "count" }
          ],
          completedByOthers: [
            { $match: { completedBy: { $ne: userId }, status: "completed" } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const posted = stats[0].postedByMe[0]?.count || 0;
    const completedMe = stats[0].completedByMe[0]?.count || 0;
    const completedOthers = stats[0].completedByOthers[0]?.count || 0;

    const config = {
      type: "bar",
      data: {
        labels: ["Posted by me", "Completed by me", "Completed by others"],
        datasets: [
          { label: "Request Activity", data: [posted, completedMe, completedOthers] }
        ]
      }
    };

    const url =
      "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(config));
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating chart");
  }
};
