import exp from "express"
import { verifyToken } from "../middleware/verifytoken.js"
import { PostModel } from "../Model/postModel.js"
import { NotificationModel } from "../Model/notificationModel.js"
import { upload } from "../middleware/upload.js"
import {userModel} from '../Model/userModel.js'
export const postApp = exp.Router()


//Create Post
postApp.post('/createpost', verifyToken, upload.single("image"), async (req, res, next) => {
    const { description, mediaType } = req.body

    const newPost = new PostModel({
      userId:      req.user.id,
      description,
      mediaUrl:    req.file?.path  || null,
      mediaType:   req.file ? (mediaType || "image") : null
    })

    await newPost.save()

    res.status(201).json({ message: "Post created successfully", payload: newPost })

})


//Get Home Feed
postApp.get('/feed', verifyToken, async (req, res, next) => {
    const { userModel } = await import('../Model/userModel.js')

    const currentUser = await userModel.findById(req.user.id)

    if (!currentUser)
      return res.status(404).json({ message: "User not found" })

    const followingIds = currentUser.following.map(f => f.userId)

    const posts = await PostModel.find({
      userId:    { $in: followingIds },
      isDeleted: false
    })
      .populate("userId", "firstName lastName username profileImageUrl")
      .sort({ createdAt: -1 })
      .limit(50)

    res.status(200).json({ message: "Feed fetched successfully", payload: posts })
})


//View a Single Post 
postApp.get('/viewpost/:id', verifyToken, async (req, res, next) => {
    const post = await PostModel.findOne({ _id: req.params.id, isDeleted: false })
      .populate("userId", "firstName lastName username profileImageUrl")

    if (!post)
      return res.status(404).json({ message: "Post not found" })

    res.status(200).json({ message: "Post fetched successfully", payload: post })

})


// Like Post
postApp.put('/likepost/:id', verifyToken, async (req, res, next) => {
    const userId = req.user.id
    const post   = await PostModel.findById(req.params.id)

    if (!post || post.isDeleted)
      return res.status(404).json({ message: "Post not found" })

    const alreadyLiked = post.likes.some(l => l.userId.equals(userId))

    if (alreadyLiked)
      return res.status(400).json({ message: "You have already liked this post" })

    post.likes.push({ userId })
    post.likeCount = post.likes.length
    await post.save()

    // Notify the post owner (skip if liking own post)
    if (post.userId.toString() !== userId) {
      await NotificationModel.create({
        recipientId: post.userId,
        senderId:    userId,
        type:        "like",
        postId:      post._id
      })
    }

    res.status(200).json({ message: "Post liked successfully" })

})


//Unlike Post
postApp.put('/unlikepost/:id', verifyToken, async (req, res, next) => {
    const userId = req.user.id
    const post   = await PostModel.findById(req.params.id)

    if (!post || post.isDeleted)
      return res.status(404).json({ message: "Post not found" })

    const liked = post.likes.some(l => l.userId.equals(userId))

    if (!liked)
      return res.status(400).json({ message: "You have not liked this post" })

    post.likes     = post.likes.filter(l => !l.userId.equals(userId))
    post.likeCount = post.likes.length
    await post.save()

    res.status(200).json({ message: "Post unliked successfully" })
})


// Add Comment
postApp.post('/comment/:id', verifyToken, async (req, res, next) => {
    const post = await PostModel.findById(req.params.id)

    if (!post || post.isDeleted)
      return res.status(404).json({ message: "Post not found" })

    if (!req.body.comment)
      return res.status(400).json({ message: "Comment text is required" })

    // username must come from the token, not client body
    const commenter = await userModel.findById(req.user.id).select("username")

    post.comments.push({
      userId:   req.user.id,
      username: commenter.username,
      comment:  req.body.comment
    })
    post.commentCount = post.comments.length
    await post.save()

    // Notify the post owner
    if (post.userId.toString() !== req.user.id) {
      await NotificationModel.create({
        recipientId: post.userId,
        senderId:    req.user.id,
        type:        "comment",
        postId:      post._id
      })
    }

    res.status(201).json({ message: "Comment added successfully", payload: post })

})


// Delete Comment
postApp.put('/delcomment/:cid', verifyToken, async (req, res, next) => {
    const { pid } = req.body

    if (!pid)
      return res.status(400).json({ message: "Post ID (pid) is required in body" })

    const post = await PostModel.findById(pid)

    if (!post || post.isDeleted)
      return res.status(404).json({ message: "Post not found" })

    const comment = post.comments.find(c => c._id.toString() === req.params.cid)

    if (!comment)
      return res.status(404).json({ message: "Comment not found" })

    // Only the comment author or the post owner can delete
    const isCommentAuthor = comment.userId.toString() === req.user.id
    const isPostOwner     = post.userId.toString()    === req.user.id

    if (!isCommentAuthor && !isPostOwner)
      return res.status(403).json({ message: "Not authorised to delete this comment" })

    post.comments     = post.comments.filter(c => c._id.toString() !== req.params.cid)
    post.commentCount = post.comments.length
    await post.save()

    res.status(200).json({ message: "Comment deleted successfully" })


    
})


// Soft Delete Post
postApp.put('/delpost/:id', verifyToken, async (req, res, next) => {
    const post = await PostModel.findById(req.params.id)

    if (!post || post.isDeleted)
      return res.status(404).json({ message: "Post not found" })

    if (post.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorised to delete this post" })

    post.isDeleted = true
    await post.save()

    res.status(200).json({ message: "Post deleted successfully" })
})