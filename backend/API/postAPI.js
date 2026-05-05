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

//Like a post 
postApp.put('/likepost/:id',verifyToken,async(req,res)=>{
    let userId=req.user.id
    let postId=req.params.id

    if(!userId)
        return res.status(401).json({message:"User is not authorised"})
    if(!postId)
        return res.status(400).json({message:"Post is not found"})
    let postObj=await PostModel.findById(postId)
    console.log(postObj)
    const alreadyLiked = postObj.likes.some(like => like.userId.toString() === userId.toString());
    if (alreadyLiked) {
        return res.status(400).json({ message: "You have already liked this post" });
    }
    if(postObj.isDeleted)
        return res.status(404).json({message:"Post is deleted"})
    
    postObj.likes.push({userId:userId})
    postObj.likeCount+=1
    await postObj.save()

    // console.log(postObj)
    return res.status(200).json({message:"Liked the post"})
})

//Unlike a post 
postApp.put('/unlikepost/:id', verifyToken, async (req, res) => {
    let userId = req.user.id;
    let postId = req.params.id;

    if (!userId)
        return res.status(401).json({ message: "User is not authorised" });

    if (!postId)
        return res.status(400).json({ message: "Post is not found" });

    let postObj = await PostModel.findById(postId);

    if (!postObj)
        return res.status(404).json({ message: "Post not found in DB" });
    if(postObj.isDeleted)
        return res.status(404).json({message:"Post is deleted"})
    // Check if user has liked
    const isLiked = postObj.likes.some(
        like => like.userId.toString() === userId.toString()
    );

    if (!isLiked) {
        return res.status(400).json({ message: "You have not liked this post" });
    }

    // Remove that user's like
    postObj.likes = postObj.likes.filter(
        like => like.userId.toString() !== userId.toString()
    );

    postObj.likeCount -= 1;

    await postObj.save();

    return res.status(200).json({ message: "Unliked the post" });
});

//Add a comment 
postApp.post('/comment/:id',verifyToken,async(req,res)=>{
    let postId=req.params.id
    let userId=req.user.id
    if (!userId)
        return res.status(401).json({ message: "User is not authorised" });

    if (!postId)
        return res.status(400).json({ message: "Post is not found" });
    let {comment}=req.body
    //console.log(comment)
    let postObj=await PostModel.findById(postId)
    if(postObj.isDeleted)
        return res.status(404).json({message:"Post is deleted"})
    postObj.comments.push({
            userId: userId,
            comment: comment
        });
    postObj.commentCount+=1

    //console.log(postObj)
    await postObj.save()

    return res.status(200).json({message:"Comment added succesfully"})

})


//Delete a comment
postApp.put('/delcomment/:id',verifyToken,async(req,res)=>{
    let postid=req.body.pid
    let commentid=req.params.id
    // console.log(postid,commentid)
    if(!postid)
        return res.status(400).json({message:"Invalid Post id"})
    if(!commentid)
        return res.status(400).json("Invalid comment Id")
    let postObj=await PostModel.findById(postid)
    if(!postObj)
        return res.status(404).json({message:"Post not found"})
    if(postObj.isDeleted)
        return res.status(404).json({message:"Post is deleted"} )
    //Check if the comment is there or not 
    const iscmtd = postObj.comments.some(
        comment => comment.id.toString() === commentid.toString()
    );
    // console.log(iscmtd)
    if(!iscmtd)
        return res.status(404).json({message:"You have not commented to the post"})
    postObj.comments = postObj.comments.filter(
        comment => comment.id.toString() !== commentid.toString()
    );
    postObj.commentCount -= 1
    await postObj.save()

    return res.status(200).json({message:"Comment deleted successfully"})
})

