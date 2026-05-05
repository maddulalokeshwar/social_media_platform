import exp from 'express'
import { verifyToken } from '../middleware/verifytoken.js'
export const postApp = exp.Router()
import {PostModel} from '../Model/postModel.js'

//Create a new post 
postApp.post("/createpost",verifyToken,async(req,res)=>{
    let userId =req.user.id;
    let descrip=req.body
    if(!userId)
        return res.status(404).json({message:"User is not authorised"})
    if(!descrip)
        return res.status(404).json({message:"Invalis post details"})
    if(!(userId===descrip.userId))
        return res.status(404).json({message:"User is not authenticated"})

    console.log(userId,descrip.userId)
    const newPost =new PostModel(descrip)
   // console.log(newPost)

   await newPost.save()

   return res.status(200).json({message:"Post created successfully"})
})

//View a post by id 
postApp.get('/viewpost/:id',verifyToken,async(req,res)=>{
    let postId=req.params.id
    let userId=req.user.id
    //console.log(postId,userId)
    if(!userId)
        return res.status(404).json({message:"You are not authenticated"})
    if(!postId)
        return res.status(404).json({message:"PostId is invalid"})
    let postObj=await PostModel.findById(postId)
    //console.log(postObj)
    postObj=postObj.toObject()
    if(postObj.isDeleted===true)
        return res.status(404).json({message:"The post is deleted by the User"})
    const {description,likeCount,commentCount,likes,comments}=postObj
    return res.status(200).json({message:"Post fetched successfully",payload:{description,likeCount,commentCount,likes,comments}})
})

//Soft delete a post
postApp.put('/delpost/:id',verifyToken,async(req,res)=>{
    let postId=req.params.id
    let userId=req.user.id
    console.log(postId,userId)
    let postObj=await PostModel.findById(postId)
    console.log(postObj)
    if(!postObj || postObj.isDeleted===true)
        return res.status(404).json({message:"The post is no longer available"})
    console.log(postObj.userId)

    postObj=await PostModel.findByIdAndUpdate(postId,{isDeleted:true},{new:true})
    console.log(postObj)

    res.status(200).json({message:"Post has been deleted successfully"})
    
})
