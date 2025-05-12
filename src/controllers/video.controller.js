import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    // get title and description from req.body
    // make sure that these both are not empty
    // make sure that another video with the same title and description does not exist
    // get the local path for the video and the thumbnail from req.files
    // make sure that we have successfully received the local path for video and thumbnail
    // upload the received video and thumbnail on cloudinary
    // create a new document in mongodb with these details
    // return appropriate response is everything is done successfully
    
    const { title, description} = req.body

    if (!title || !description) {
        throw new ApiError(400, "title and description both are required")
    }

    const videoExists = await Video.findOne({
        $and: [{title}, {description}]
    })

    if (videoExists) {
        throw new ApiError(400, "Video with title and description already exists, please try another title and description")
    }

    const localVideoPath = req.files?.videoFile?.[0]?.path
    const localThumbnailPath = req.files?.thumbnail?.[0]?.path

    if (!localVideoPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!localThumbnailPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const video = await uploadOnCloudinary(localVideoPath)
    const thumbnail = await uploadOnCloudinary(localThumbnailPath)

    if (!video) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoInDB = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: video.duration,
        owner: req.user?._id
    })

    if (!videoInDB) {
        throw new ApiError(400, "Error while uploading video, please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoInDB,
            "Video has been uploaded successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id

    // get the videoId from the params
    // make sure that it is a valid videoId
    // use mongoDB aggregration pipeline to make sure that the _id in the video model matches our videoId
    // get the likes for that video using lookup
    // get the owner of the video from the users model using another $lookup
    // use a nested pipeline and lookup to get subscribers of the channel
    // use addFields to get the total subscriberCount, check if the user is subscribed to the channel
    // project what data you want to return
    // use another addFeilds to get likesCount, owner and isLiked for the video
    // project the end detils which you want the controller to return 
    // check if you got the video or not
    // increment the views of the video by 1, whenever the video is fetched successfully
    // also add this video to the user's watch history
    // return appropriate response after everything is done

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Please enter valid videoId")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likesOfVideo"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscription",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likesOfVideo"
                },
                owner:{
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$likesOfVideo.likedBy"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
            }
        }
    ])

    if (!video) {
        throw new ApiError(400, "Error, video not found")
    }

    // increment the views if the video is fetched successfully
    await Video.findByIdAndUpdate(
        video._id,
        {
            $inc: { // inc increments the views count by 1
                views: 1
            }
        }
    )

    // add this video to the user's watch history
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $addToSet: { // addToSet adds something to an existing array. In this case, it is adding the videoId
                watchHistory: videoId
            }
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video[0],
            "Video fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    // get videoId from the params
    // make sure that it is a valid Object id
    // get the video based on the videoId 
    // make sure that the owner of the video is trying to toggle the video publish status
    // then toggle the publish status based on what the publish status in the previously fetched video was then reverse it 
    // return appropriate response

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Please enter valid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only the owner of the video can change the toggle status")
    }

    const togglePublishStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {
            new: true
        }
    )

    if (!togglePublishStatus) {
        throw new ApiError(500, "Cannot update video publish status")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isPublished: togglePublishStatus.isPublished},
            "Video publish toggled successfully"
        )
    )


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}