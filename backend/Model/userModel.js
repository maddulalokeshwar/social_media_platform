import { Schema, model, Types } from "mongoose"

//Follows schema
const followsSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"]
        }
    },
    { _id: false }
)


//User Schema
const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            minLength: [3, "First name must be at least 3 characters long"],
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            minLength: [5, "Username must be at least 5 characters long"],
            trim: true,
            lowercase: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: [5, "Password must be at least 5 characters long"]
        },
        gender: {
            type: String,
            enum: {
                values: ["male", "female", "others"],
                message: "Gender must be 'male', 'female', or 'others'"
            },
            required: [true, "Gender is required"]
        },
        dob: {
            type: Date,
            required: [true, "Date of birth is required"],
            validate: {
                validator: function (value) {
                    if (value > new Date()) return false
                    const cutoff = new Date()
                    cutoff.setFullYear(cutoff.getFullYear() - 16)
                    return value <= cutoff
                },
                message: "User must be at least 16 years old and DOB cannot be in the future"
            }
        },
        bio: {
            type: String,
            maxLength: [160, "Bio cannot be more than 160 characters long"],
            trim: true,
            default: null
        },
        profileImageUrl: {
            type: String,
            default: null
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        isDeactivated: {
            type: Boolean,
            default: false
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        followerCount: {
            type: Number,
            default: 0,
            min: [0, "Follower count cannot be negative"]
        },
        followingCount: {
            type: Number,
            default: 0,
            min: [0, "Following count cannot be negative"]
        },
        followers: {
            type: [followsSchema],
            default: []
        },
        following: {
            type: [followsSchema],
            default: []
        }
    },
    {
        timestamps: true,
        versionKey: false,
        strict: "throw"
    }
)

export const userModel = model("User", userSchema)
