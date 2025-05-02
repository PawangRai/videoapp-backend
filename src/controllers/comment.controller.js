import mongoose from "mongoose";
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    // TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    // find the video for which you want the comments based on the videoId
    // get the user details by using lookup with the user document
    // get the like details by using lookup with the likes document
    // get the count of likes and get the first item from the user details document which you will get
    // count the number of likes and if the user has liked the current comment
    // decide how many comments you want to display

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video does not exist")
    }

    const commentsAggregate = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(commentsAggregate, options)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments for the video retrieved successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    let {content} = req.body

   if (!content || content.trim() === "") {
    throw new ApiError(404, "Comment content is required")
   }
   content = content.trim()

   const video = await Video.findById(videoId)

   if (!video) {
    throw new ApiError(404, "Video not found")
   }

   const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id
   })

   if (!comment) {
    throw new ApiError(500, "Comment could not be uploaded")
   }

   return res
   .status(200)
   .json(new ApiResponse(200, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    let {content} = req.body
    const {commentId} = req.params
    
    if (!content || content.trim() === "") {
        throw new ApiError(404, "Comment content is required")
    }

    content = content.trim()

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment?.owner.toString() !== req?.user._id.toString()) {
        throw new ApiError(400, "Only original owner of the comment can update")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        {new: true}
    );

    if (!updatedComment) {
        throw new ApiError(500, "Comment could not be updated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updateComment,
            "Comment has been updated"
        )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment 
    const {commentId} = req.params

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    if (comment?.owner.toString() !== req?.user._id) {
        throw new ApiError(400, "Only the creator of the comment can delete it")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    })

    if (!deletedComment) {
        throw new ApiError(500, "Comment could not be deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedComment,
            "Comment has been deleted successfully"
        )
    )

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}