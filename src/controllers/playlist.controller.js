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
    // make sure that the owner of the playlist and the logged in user are same, as only the logged in user can request for a playlist
    // if found, then return appropriate response

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Please enter valid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    
        if (!playlist) {
            throw new ApiError(400, "Playlist does not exist")
        }

    if (playlist?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only owner of the playlist can get the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Successfully fetched playlist by Id"
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
    
    const {playlistId, videoId} = req.params

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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