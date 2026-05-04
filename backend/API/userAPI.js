import exp from 'express'
import { verifyToken } from '../middleware/verifytoken.js'
export const userApp = exp.Router()
import {userModel} from '../Model/userModel.js'
//View own profile
userApp.get('/self',verifyToken,async(req,res)=>{
    // console.log(req.user.id)
    let userObj=await userModel.findById(req.user.id)
    console.log(userObj)
    if(!userObj){
        return res.status(400).json({message:"User not Found"})
    }
    if (userObj.isUserActive === false || userObj.isDeactivated=== true) {
      return res.status(403).json({message: "Your account is blocked or deactivated"});
    }

    userObj = userObj.toObject();
    const {
        email,
        password,
        isAdmin,
        isDeactivated,
        createdAt,
        updatedAt,
        isBlocked,
        ...payload1
    }=userObj
    return res.status(200).json({message:"Profile fetched succesfully",payload:payload1})
})

//Update their profile
userApp.put('/updateProfile',verifyToken,async(req,res)=>{
    const userId=req.user.id;
    console.log(userId)

    if(!userId){
        return res.status(404).json({message:"User not authenticated"})
    }
    const {email,username}=req.body;
    const userObj=await userModel.findByIdAndUpdate(userId,{email:email,username:username},{ new: true })
      .select("-password")
    if (userObj.isUserActive === false || userObj.isDeactivated=== true) {
      return res.status(403).json({message: "Your account is blocked or deactivated"});
    }
    //console.log(userObj)
    if(!userObj){
        return res.status(404).json({message:"User not found"})
    }
    return res.status(200).json({message:"Profile Updated Successfully"})
})

//Deactivate
userApp.put('/deactivate',verifyToken,async(req,res)=>{
    const userId=req.user.id
    console.log(userId)
    if(!userId){
        return res.status(404).json({message:"User is not authenticated"})
    }
    
    const userObj=await userModel.findByIdAndUpdate(userId,{isDeactivated:true},{new:true})

    if(!userObj){
        return res.status(404).json({message:"User not found"})
    }

    return res.status(200).json({message:"User deactivated succesfully"})
})

//Follow a user
userApp.post("/follow/:id", verifyToken, async (req, res, next) => {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You cannot follow yourself"
      })
    }

    const currentUser = await userModel.findById(currentUserId);
    const targetUser = await userModel.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    //  check if already following
    const alreadyFollowing = currentUser.following.some(
  ({ userId }) => userId.equals(targetUserId));

    if (alreadyFollowing) {
      return res.status(400).json({
        message: "Already following this user"
      })
    }

    // add to following
    currentUser.following.push({ userId: targetUserId });
    currentUser.followingCount += 1;

    // add to followers
    targetUser.followers.push({ userId: currentUserId });
    targetUser.followerCount += 1;

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: "Followed successfully"
    });
});

//Unfollow a user
userApp.post("/unfollow/:id", verifyToken, async (req, res, next) => {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: "You cannot unfollow yourself"
      })
    }

    const currentUser = await userModel.findById(currentUserId);
    const targetUser = await userModel.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // remove from following
    currentUser.following = currentUser.following.filter(
      (f) => f.userId.toString() !== targetUserId
    );

    // remove from followers
    targetUser.followers = targetUser.followers.filter(
      (f) => f.userId.toString() !== currentUserId
    );
    targetUser.followerCount -= 1;
    currentUser.followingCount-=1

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: "Unfollowed successfully"
    });
});

//Followes list
userApp.get("/followerslist",verifyToken,async(req,res)=>{
    const userId=req.user.id
   if(!userId){
    return res.status(404).json({message:"User is not authenticated"})
   }

   const userObj=await userModel.findById(userId)
   if(!userObj){
    return res.status(404).json({message:"User not found"})
   }

   return res.status(200).json({message:"Followers list:",payload:userObj.followers})
})

//Following list 
userApp.get("/followinglist",verifyToken,async(req,res)=>{
    const userId=req.user.id
   if(!userId){
    return res.status(404).json({message:"User is not authenticated"})
   }

   const userObj=await userModel.findById(userId)
   if(!userObj){
    return res.status(404).json({message:"User not found"})
   }

   return res.status(200).json({message:"Following list:",payload:userObj.following})
})
