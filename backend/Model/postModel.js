import {Schema, model, Types} from "mongoose"

const commentSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },
    comment:{
        type: String,
        required: [true, "Comment is required"],
        maxLength: [180, "Comment cannot be more than 180 characters long"],
        trim: true
    }
}, {
    timestamps: true 
})

const likeSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    }
},{
    _id: false,
    timestamps: true
})

const postSchema = new Schema({
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
    isDeleted:{
        type: Boolean,
        default: false
    },
    likes:{
        type: [likeSchema],
        default: []
    },
    likeCount:{
        type: Number,
        default: 0,
        min : [0, "Like count cannot be negative"]
    },
    comments:{
        type: [commentSchema],
        default: []
    },
    commentCount:{
        type: Number,
        default: 0,
        min : [0, "Comment count cannot be negative"]
    },
    mediaUrl:{
        type: String,
        default: null
    },
},
{
    timestamps: true,
    versionKey: false,
    // strict: "throw"
});


export const PostModel = model("Post", postSchema)