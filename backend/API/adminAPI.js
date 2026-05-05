import exp from 'express'
import { verifyAdmin, verifyToken } from '../middleware/verifytoken.js'
import { userModel } from '../Model/userModel.js'

export const adminApp = exp.Router()

console.log("Admin API loaded");


//  View all users
adminApp.get('/users', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const users = await userModel.find().select("-password")
    res.status(200).json({ message: "All users", payload: users })
  } catch (err) {
    next(err)
  }
})

//  Block user
adminApp.patch('/users/:id/block', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isBlocked) {
      return res.status(400).json({ message: "User already blocked" })
    }

    user.isBlocked = true
    await user.save()

    res.status(200).json({ message: "User blocked successfully" })
  } catch (err) {
    next(err)
  }
})

//  Unblock user
adminApp.patch('/users/:id/unblock', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const user = await userModel.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.isBlocked = false
    await user.save()

    res.status(200).json({ message: "User unblocked successfully" })
  } catch (err) {
    next(err)
  }
})
