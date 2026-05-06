import { Schema, model, Types } from "mongoose"

//Comment schema
const commentSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"]
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true
        },
        comment: {
            type: String,
            required: [true, "Comment is required"],
            maxLength: [180, "Comment cannot be more than 180 characters long"],
            trim: true
        }
    },
    { 
        timestamps: true 
    }  
)

// Like schema
const likeSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"]
        }
    },
    { _id: false }
)

//Post schema
const postSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"]
        },
        description: {
            type: String,
            maxLength: [360, "Description cannot be more than 360 characters long"],
            required: [true, "Description is required"],
            trim: true
        },
        mediaUrl: {
            type: String,
            default: null
        },
        mediaType: {
            type: String,
            enum: {
                values: ["image", "video"],
                message: "mediaType must be 'image' or 'video'"
            },
            default: null
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        likes: {
            type: [likeSchema],
            default: []
        },
        likeCount: {
            type: Number,
            default: 0,
            min: [0, "Like count cannot be negative"]
        },
        comments: {
            type: [commentSchema],
            default: []
        },
        commentCount: {
            type: Number,
            default: 0,
            min: [0, "Comment count cannot be negative"]
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

export const PostModel = model("Post", postSchema)
