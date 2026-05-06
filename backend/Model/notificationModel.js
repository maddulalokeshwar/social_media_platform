import { Schema, model, Types } from "mongoose"


const notificationSchema = new Schema(
    {
        // who receives the notification
        recipientId: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "Recipient ID is required"]
        },
        // who triggered the notification
        senderId: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "Sender ID is required"]
        },
        type: {
            type: String,
            enum: {
                values: ["like", "comment", "follow"],
                message: "type must be 'like', 'comment', or 'follow'"
            },
            required: [true, "Notification type is required"]
        },
        // only populated for like / comment notifications
        postId: {
            type: Types.ObjectId,
            ref: "Post",
            default: null
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,  
        versionKey: false
    }
)

notificationSchema.index({ recipientId: 1, createdAt: -1 })

export const NotificationModel = model("Notification", notificationSchema)
