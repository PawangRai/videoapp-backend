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

    

    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}