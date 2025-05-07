import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes, etc

  // get the user id from the auth middleware
  // search for the total video views, total subscribers, total videos total likes based on the userId
  // If it is successfully found, then the proper response otherwise, return appropirate response

  const userId = req.user?._id

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        subscribersCount: { $sum: 1 }
      }
    }
  ])

  const video = await Video.aggregate([
    {
      $match: {
        owner: mongoose.ObjectId.Types(userId)
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $project: {
        totalLikes: { $size: "$likes"},
        totalViews: "$views",
        totalVideos: 1
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$totalLikes" },
        totalViews: { $sum: "$totalViews" },
        totalVideos: { $sum: 1 }
      }
    }
  ])

  if (!video || totalSubscribers.length === 0) {
    throw new ApiError("500", "Error while fetching data from database")
  }

  const channelStats = {
    totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
    totalLikes: video[0]?.totalLikes || 0,
    totalViews: video[0]?.totalViews || 0,
    totalVideos: video[0]?.totalVideos || 0
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      channelStats,
      "Channels Stats have been retrieved successfully")
  )

});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

})

export {
    getChannelStats,
    getChannelVideos
}
