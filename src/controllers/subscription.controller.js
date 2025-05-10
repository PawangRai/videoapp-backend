import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription

    // get the channelId from the params
    // make sure that it is a valid object Id
    // get if the user is subscribed based on the subscriber as req.user and channel as channelId
    // if it is not found then return appropriate response
    // check if the subscriber is the req.user, if it is then delete it and return appropriate response
    // if it is not found, then add it and then add appropriate response

    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Please enter valid channel Id")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {subscribed: false},
                "Unsubscribed successfully"
            )
        )
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {subscribed: true},
            "Subscribed successfully"
        )
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // first get the channelId from the params
    // check if the channelId is a valid object
    // use $match to find the channel whose channel property equals our channelId
    // use $lookup to then get a list of users who are subscribed to the channel
    // use another nested pipeline to get a list of channels which the user with the channelId has subscribed to
    // Use addFields to get the subscriber count as well as check if the check if the there is a channel in the list of subscribers that the current channel whose subscribers we are trying to find also follows them
    // project what data you want to output
    // give appropriate response


    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Please input valid channel Id")
    }

    const userSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId) // This gives us only that channel which will match our channelId
            }
        },
        {
            $lookup: { // This lookup will give users that are subscribed to that channel
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: { // This nested lookup will help us to find our the channel whose subscribers we are trying to find subscribers back to any of the subscribers in his subscriber list
                            from: "subscribers",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToChannel"
                        }
                    },
                    {
                        $addFields: {
                            subscribedToChannel: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId, // Check if the channelId is subscribed to any of the list of subscribers of channelId
                                            "$subscribedToChannel.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            },
                            subscriberCount: {
                                $size: "$subscribedToChannel"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    subscribedToChannel: 1,
                    subscriber: 1
                }
            }
        }
    ])

    if (!userSubscribers) {
        throw new ApiError(500, "Error while fetching user subscribers")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userSubscribers,
            "User subscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // get the subscriberId from the params
    // make sure that it is a valid object Id
    // use mongoDb aggregate to $match only those subscribers who match our subscriberId
    // use $lookup to get a list of channels (users) to which our subscriber has subscribed
    // use another pipeline and lookup to get the videos of thos channels
    // only get the latest videos
    // project what data you need
    // return appropriate response

    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Please insert valid object Id")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannel"
        },
        {
            $project: {
                _id: 0,
                subscribedChannels: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    latestVideo: {
                        _id: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    }
                }
            }
        }
    ])

    if (!subscribedChannels) {
        throw new ApiError(500, "Error while getting list of subscribed channels")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribedChannels,
            "Successfully retrieved list of user's subscribed channels"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}