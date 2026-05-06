import exp from 'express'
import { verifyToken, verifyAdmin } from '../middleware/verifytoken.js'
import { userModel } from '../Model/userModel.js'
import { PostModel } from '../Model/postModel.js'

export const adminApp = exp.Router()


//List all users 
adminApp.get('/users', verifyToken, verifyAdmin, async (req, res, next) => {
    const users = await userModel.find().select("-password").sort({ createdAt: -1 })

    res.status(200).json({ message: "All users", payload: users })
})


// View a user's posts 
adminApp.get('/users/:id/posts', verifyToken, verifyAdmin, async (req, res, next) => {
    const user = await userModel.findById(req.params.id).select("-password")

    if (!user)
      return res.status(404).json({ message: "User not found" })

    const posts = await PostModel.find({ userId: req.params.id })
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: `Posts by ${user.username}`,
      payload: { user, posts }
    })

})


//Block user 
adminApp.patch('/users/:id/block', verifyToken, verifyAdmin, async (req, res, next) => {
    const user = await userModel.findById(req.params.id)

    if (!user)
      return res.status(404).json({ message: "User not found" })

    // FIX: prevent admin from blocking another admin
    if (user.isAdmin)
      return res.status(403).json({ message: "Cannot block an admin account" })

    if (user.isBlocked)
      return res.status(400).json({ message: "User is already blocked" })

    user.isBlocked = true
    await user.save()

    res.status(200).json({ message: "User blocked successfully" })
})


// Unblock user 
adminApp.patch('/users/:id/unblock', verifyToken, verifyAdmin, async (req, res, next) => {
    const user = await userModel.findById(req.params.id)

    if (!user)
      return res.status(404).json({ message: "User not found" })

    if (!user.isBlocked)
      return res.status(400).json({ message: "User is not blocked" })

    user.isBlocked = false
    await user.save()

    res.status(200).json({ message: "User unblocked successfully" })

})