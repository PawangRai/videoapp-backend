import mongoose, {isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    // TODO: toggle like on video
    
    // get the videoId from params and userId from auth middleware
    // check if the videoId is a valid objectId
    // find if the video is already liked, if it is then delete that like and return appropriate response
    // if the video is not liked, then like it by storing a like object and then return an appropriate response
    
    const {videoId} = req.params
    const userId = req.user?._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Please enter valid videoId")
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: userId
        }
    )

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id)
        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false},
                "Video has been unliked"
            )
        )
    }

    const liked = await Like.create({
        video: videoId,
        likedBy: userId
    })

    if (!liked) {
        throw new ApiError(500, "Video could not be liked")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isLiked: true},
            "Video has been liked"
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    // TODO: toggle like on comment
    
    // get the commentId from params and userId from auth middle
    // check if the videoId is a valid object Id
    // check if a like on the comment already exists, if it exists then delete it and show the appropriate response
    // if it doesnt exist then insert that data into the database and show appropriate response

    const {commentId} = req.params
    const userId = req.user?._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Please input valid comment Id")
    }

    const likedAlready = await Like.findOne({
        comment: commentId,
        owner: userId
    })

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false},
                "Comment has been unliked"
            )
        )
    }

    const liked = await Like.create({
        comment: commentId,
        owner: userId
    })

    if (!liked) {
        throw new ApiError(500, "Comment could not be liked")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isLiked: true},
            "Comment has been liked"
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    // TODO: toggle like on tweet
    
    // get the tweetId from params and userId from auth middle
    // check if the tweetId is a valid object Id
    // check if the like on the tweet already exists, if it exists then remove it from the database and show appropriate response
    // if it does not exist then create a document with tweet as tweetId and likedBy as our logged in user and store it in the database and show appropriate response

    const {tweetId} = req.params
    const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Please enter valid tweet Id")
    }

    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {isLiked: false},
                "Tweet has been unliked"
            )
        )
    }

    const liked = await Like.create({
        tweet: tweetId,
        likedBy: userId
    })

    if (!liked) {
        throw new ApiError(500, "Tweet could not be liked")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isLiked: true},
            "Tweet has been liked"
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // TODO: get all liked videos 

    // get the userId from the auth middleware
    // use the mongodb aggregation pipelines to filter out video which are likedBy our current logged in user
    // lookup the data in the video schema and get it
    // use a nested pipeline to also get data from the user schema and get it 
    // project which data you want to return
    // return appropriate response

    const userId = req.user?._id

    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "likerDetails"
            }
        },
        {
            $unwind: "$likerDetails"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideos: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1
                },
                likerDetails: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    if (!likedVideosAggregate) {
        throw new ApiError(500, "Error while fetching liked videos from database")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideosAggregate,
            "Liked videos have been fetched"
        )
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}