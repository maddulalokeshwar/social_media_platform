import exp from 'express'
import { verifyToken } from '../middleware/verifytoken.js'
import { userModel } from '../Model/userModel.js'
import { NotificationModel } from '../Model/notificationModel.js'
import mongoose from "mongoose"
export const userApp = exp.Router()


//View own profile
userApp.get('/self', verifyToken, async (req, res, next) => {
    const userObj = await userModel.findById(req.user.id).select(
      "-password -isAdmin -isDeactivated -isBlocked -createdAt -updatedAt"
    )

    if (!userObj)
      return res.status(404).json({ message: "User not found" })

    // FIX: original checked isUserActive which doesn't exist in schema
    if (userObj.isBlocked || userObj.isDeactivated)
      return res.status(403).json({ message: "Your account is blocked or deactivated" })

    res.status(200).json({ message: "Profile fetched successfully", payload: userObj })


})


//Update own profile
userApp.put('/updateProfile', verifyToken, async (req, res, next) => {
    // Only pick fields the user is allowed to update
    const { firstName, lastName, username, email, bio, profileImageUrl } = req.body
    const allowed = {}
    if (firstName)       
      allowed.firstName = firstName
    if (lastName)        
      allowed.lastName = lastName
    if (username)
      allowed.username= username
    if (email)
      allowed.email= email
    if (bio !== undefined) 
      allowed.bio= bio
    if (profileImageUrl) 
      allowed.profileImageUrl = profileImageUrl

    const userObj = await userModel.findById(req.user.id)

    if (!userObj)
      return res.status(404).json({ message: "User not found" })

    if (userObj.isBlocked || userObj.isDeactivated)
      return res.status(403).json({ message: "Your account is blocked or deactivated" })

    // update the fields
    const updated = await userModel.findByIdAndUpdate(
      req.user.id,
      allowed,
      { new: true, runValidators: true }
    ).select("-password")

    res.status(200).json({ message: "Profile updated successfully", payload: updated })
})


//Deactivate account
userApp.put('/deactivate', verifyToken, async (req, res, next) => {
    const userObj = await userModel.findByIdAndUpdate(
      req.user.id,
      { isDeactivated: true },
      { new: true }
    )

    if (!userObj)
      return res.status(404).json({ message: "User not found" })

    // Clear the cookie 
    
    res.clearCookie('token',{
         httpOnly: true,
         sameSite: "lax" 
        })
    res.status(200).json({ message: "Account deactivated successfully" })


})


// Activate account
userApp.put('/activate/:id', async (req, res, next) => {

    const user = await userModel.findById(req.params.id)

    if (!user)
      return res.status(404).json({ message: "User not found" })

    user.isDeactivated = false
    await user.save()

    res.status(200).json({ message: "Account reactivated successfully" })

})


//Follow a user 
userApp.post('/follow/:id', verifyToken, async (req, res, next) => {
    const currentUserId = req.user.id
    const targetUserId  = req.params.id

    if (currentUserId === targetUserId)
      return res.status(400).json({ message: "You cannot follow yourself" })

    const [currentUser, targetUser] = await Promise.all([
      userModel.findById(currentUserId),
      userModel.findById(targetUserId)
    ])

    if (!targetUser)
      return res.status(404).json({ message: "User not found" })

    const alreadyFollowing = currentUser.following.some(
      ({ userId }) => userId.equals(targetUserId)
    )

    if (alreadyFollowing)
      return res.status(400).json({ message: "Already following this user" })

    currentUser.following.push({ userId: targetUserId })
    currentUser.followingCount += 1

    targetUser.followers.push({ userId: currentUserId })
    targetUser.followerCount += 1

    await Promise.all([currentUser.save(), targetUser.save()])

    // Create a follow notification
    let notObj=await NotificationModel.create({
      recipientId: targetUserId,
      senderId:    currentUserId,
      type:        "follow"
    })
    console.log(notObj)



    res.status(200).json({ message: "Followed successfully" })

})


//Unfollow a user 
userApp.post('/unfollow/:id', verifyToken, async (req, res, next) => {
    const currentUserId = req.user.id
    const targetUserId  = req.params.id

    if (currentUserId === targetUserId)
      return res.status(400).json({ message: "You cannot unfollow yourself" })

    const [currentUser, targetUser] = await Promise.all([
      userModel.findById(currentUserId),
      userModel.findById(targetUserId)
    ])

    if (!targetUser)
      return res.status(404).json({ message: "User not found" })

    const wasFollowing = currentUser.following.some(
      ({ userId }) => userId.equals(targetUserId)
    )

    if (!wasFollowing)
      return res.status(400).json({ message: "You are not following this user" })

    currentUser.following = currentUser.following.filter(
      f => !f.userId.equals(targetUserId)
    )
    currentUser.followingCount = Math.max(0, currentUser.followingCount - 1)

    targetUser.followers = targetUser.followers.filter(
      f => !f.userId.equals(currentUserId)
    )
    targetUser.followerCount = Math.max(0, targetUser.followerCount - 1)

    await Promise.all([currentUser.save(), targetUser.save()])

    res.status(200).json({ message: "Unfollowed successfully" })

})


//Followers list 
userApp.get('/followerslist', verifyToken, async (req, res, next) => {
    const userObj = await userModel.findById(req.user.id)
      .populate("followers.userId", "firstName lastName username profileImageUrl")

    if (!userObj)
      return res.status(404).json({ message: "User not found" })

    res.status(200).json({ message: "Followers list", payload: userObj.followers })
})


// Following list 
userApp.get('/followinglist', verifyToken, async (req, res, next) => {
    const userObj = await userModel.findById(req.user.id)
      .populate("following.userId", "firstName lastName username profileImageUrl")

    if (!userObj)
      return res.status(404).json({ message: "User not found" })

    res.status(200).json({ message: "Following list", payload: userObj.following })
})


// Search users 
userApp.get('/search/:username', verifyToken, async (req, res, next) => {
  let username=req.params.username
  if(!username)
    return res.json({message:"Username invalid"})
  let userObj = await userModel.findOne({ username }).select("-password -isDeactivated -isAdmin -isBlocked -updatedAt");
  console.log(userObj)
  res.status(200).json({ message: "Search results", payload: userObj })
})


// Get another user's profile 
userApp.get('/profile/:id', verifyToken, async (req, res, next) => {
    const user = await userModel.findById(req.params.id)
      .select("-password -email -isAdmin -isDeactivated -isBlocked -dob")

    if (!user)
      return res.status(404).json({ message: "User not found" })

    if (user.isDeactivated || user.isBlocked)
      return res.status(404).json({ message: "User not found" })

    res.status(200).json({ message: "User profile", payload: user })
})


//Get notifications 
userApp.get('/notifications', verifyToken, async (req, res, next) => {
    const notifications = await NotificationModel.find({
      recipientId: req.user.id,
      isRead: false
    })
      .populate("senderId", "firstName lastName username profileImageUrl")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(); 

    res.status(200).json({
      message: "Notifications",
      payload: notifications
    });

});


// Mark a notification as read 
userApp.patch('/notifications/:id/read', verifyToken, async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, recipientId: req.user.id, isRead: false }, 
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or already read" });
    }

    res.status(200).json({
      message: "Marked as read",
      payload: notification
    });
});