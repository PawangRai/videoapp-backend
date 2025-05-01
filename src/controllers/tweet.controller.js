import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    // get tweet content from the user
    // check if the content is good to go or not
    // create a new entry in the document of tweet with the content and the owner
    // if created successfully then return it's response
    let {content} = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(404, "Tweet content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if (!tweet) {
        throw new ApiError(500, "Tweet could not be uploaded to database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet uploaded successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const tweets = await Tweet.aggregate[{
        $match: {
            owner: new mongoose.Types.ObjectId(req.user._id) // we are looking for the data where the owner field is equal to our logged in user which we will get from req.user._id
        }
    },
    {
        $lookup: { // Then we will combine that data with users, where owners is our local field name in tweet and foreign field is named as _id and we want that info as ownerInfo.
            from: "users",
            localField: "owners",
            foreignField: "_id",
            as: "ownerInfo",
            pipeline: [
                {
                    $project: { // Then we have another pipeline in which project will decide what data we want, here we only want username and avatar
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    },
   {
    $lookup: { // We are also getting data from the likes document, our local field is which is _id in our tweets document and foreign field is tweet in likes table. We want it as likeDetails.
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
            {
                $project: { // We only want likedBy
                    likedBy: 1
                }
            }
        ]
    }
   },
   {
    $addFields: { // We are adding different field to our document such as likesCount and ownerDetails and isLiked. likesCount is retrieved by counted the number of documents of likeDetails and owner details are received by getting the first element of the array ownerDetails. isLiked is a condition which checks if our logged in user is already in the likeDetails.
        likesCount: {$size: "$likeDetails"},
        ownerDetails: {$first: "$ownerDetails"},
        isLiked: {
            $cond: {
                if: {$in: [req.user?._id, "$likeDetails.likedBy"] },
                then: true,
                else: false
            }
        }
    }
   },
   {
    $sort: { // This sorts tweets in newest first order
        createdAt: -1
    }
   },
   {
    $project: { // We only want content, ownerDetails, likesCount, createdAt and isLiked from the query.
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        createdAt: 1,
        isLiked: 1
    }
   }
]   

    if (!tweets) {
        throw new ApiError(500, "Error while fetching tweets")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "Tweets fetched successfully"
    ))

   
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    // get the tweetid and new tweet content from the user
    // find the tweet based on the tweet id, also apply validation for tweet content, and make sure only the owner of the tweet can edit it
    // if tweet is successfully found then update the previous tweet content with our new tweet content
    // if updated successfully, then return an appropriate response

    const {tweetId} = req.params
    const {content} = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet?.owner.toString !== req?.user._id.toString()) {
        throw new ApiError(400, "Only owner can edit the tweet")
    }

    const updatedTweet = await Tweet.updateOne(
        {_id: tweetId},
        {
            $set: {
                content
            }
    })
    if (!updateTweet) {
        throw new ApiError(500, "Something went wrong while updating the tweet on the server")
    }

    return res
    .status(200)
    .json(
       new ApiResponse ( 
        200,
        updateTweet,
        "Tweet has been successfully edited")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    // get the tweetId from req.params
    // make sure the tweetId is a valid object id
    // find the tweet based on the tweetId
    // make sure that only the owner of the tweet is trying to delete the tweet
    // Delete that particular tweet from the database
    // return a appropriate response if the tweet is deleted successfully

    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Tweet")
    }

    const tweet = await Tweet.findById(tweetId)

    if (tweet?.owner.toString !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner of the tweet can delete it")
    }

    const deletedTweet = await Tweet.deleteOne({
        _id: tweetId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedTweet,
            "Tweet has been deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}