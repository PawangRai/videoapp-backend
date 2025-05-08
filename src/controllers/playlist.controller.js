import mongoose, { isValidObjectId, mongo } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    // TODO: Create playlist
    
    // get the name and description from the req.body
    // check if any of them are empty and if they are then show appropriate response
    // if not empty, then store that data in the database with name, description and owner as our logged in user which you can get from auth middleware
    // if successfull, show the data in an appropriate response

    const { name, description } = req.body;
    const userId = req.user?._id

    if (!name || !description) {
        throw new ApiError(400, "Name and description for the playlist is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId
    })

    if (!playlist) {
        throw new ApiError(500, "Error while creating playlist, please try again")
    }

    return res
    .status(200)
    .json(
       new ApiResponse(
        200,
        playlist,
        "Playlist has been created successfully"
       )
    )
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user 
    
    // get the userId from the the params
    // check if the userId is a valid object Id
    // search for a playlist where the owner is the userId received from req.params
    // lookup data in the videos schema for all the videos
    // add fields total videos and total views 
    // project what you want to get in the response and return appropriate response
    
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Please enter valid object Id")
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1
            }
        }
    ])

    if (!userPlaylists) {
        throw new ApiError(500, "Error while fetching user playlists from the database, please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userPlaylists[0],
            "Successfully fetched user playlists"
        )
    )
});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    
    // get the playlistId from the req.params
    // make sure it is a valid object id
    // search for a playlist based on the playlistid
    // write a mongoDB aggregation pipeline that gets playlists where the id is the same as our playlistId
    // use lookup to get videos in that playlist
    // use another lookup to get the owner of those videos
    // use addFields to get total number of videos and total number of views and make sure that the owner is actually an object by using first
    // Use project to return what you want to return
    // give appropriate response

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Please enter valid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    
    if (!playlist) {
        throw new ApiError(400, "Playlist does not exist")
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $match: {
                "$videos.isPublished": true
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
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistVideos[0],
            "Playlist has been fetched successfully"
        )
    )
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // make sure that the playlistId and videoId are valid object Ids
    // find by id a playlist and find by id the video you want to add
    // make sure that only the owner of the playlist is trying to add video to the playlist
    // if done successfully then show appropriate response

    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId || !isValidObjectId(videoId))) {
        throw new ApiError(400, "Please enter valid playlistId and videoId")
    }

    const playlist = await Playlist.findById()
    const video = await Video.findById()

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only the owner of the playlist can add videos to the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!updatePlaylist) {
        throw new ApiError(500, "Failed to add videos to playlist, please try again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatePlaylist,
            "Successfully added video to playlist"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist

    // make sure that the playlistId and videoId are valid object ids
    // get the playlist and video using the playlistId and video Id
    // make sure that they are both found, otherwise return appropriate response
    // make sure that the owner of the playlist and video are the same as our logged in user
    // if everything is true then remove that particular video from the playlist
    // if done successfully, return appropriate response

    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Please input valid playlistId and videoId")
    }

    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner of the playlist and video can remove it from the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Successfully removed video from playlist"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist

    // get the playlistId from the req.params
    // verify if the playlistId is a valid object
    // get the playlist from based on the playlistId
    // make sure that the playlist is not empty
    // make sure that the owner of the playlist is trying to delete it
    // if everything checks out, then remove the particular document
    // return appropriate response

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Please enter valid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner?.toString !== req.user?._id) {
        throw new ApiError(400, "Only the owner of the playlist can delete it")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlist?._id)

    if (!deletedPlaylist) {
        throw new ApiError(500, "Error while deleting playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedPlaylist,
            "Playlist has been successfully deleted"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist

    // get the name and description to be updated for the playlist
    // make sure they are not empty
    // get the playlistId from the params and find the playlist based on the playlistId
    // make sure that the playlist is actually found
    // make sure that the owner of the playlist is actually trying to make the changes
    // if everything checks out, then find the playlistByIdAndUpdate it, inputting new data for the name and description
    // return appropriate response if everything checks out

    const {name, description} = req.body
    const {playlistId} = req.params

    if (!name || !description) {
        throw new ApiError(400, "Name and description for the playlist are required")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner?.toString !== req.user._id?.toString) {
        throw new ApiError(400, "Only the owner of the playlist can make changes to it")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist._id,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true // This here makes sure that the response that we are storing in the updatedPlaylist contains the new document, not the original one before updation. 
            
            // The updated to DB happens either way, new: true affects what response we get after the query has run
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist has been successfully updated"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}