import exp from 'express'
import { hash, compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userModel } from '../Model/userModel.js'
import { verifyToken } from '../middleware/verifytoken.js'

const { sign } = jwt
export const commonApp = exp.Router()


// Register
commonApp.post('/register', async (req, res, next) => {
    const userObj = req.body
    userObj.password = await hash(userObj.password, 12)

    const newUserDoc = new userModel(userObj)
    await newUserDoc.save()
    //Not returing password to the payload
    const { password, ...safeUser } = newUserDoc.toObject()

    res.status(201).json({
      message: "User created successfully",
      payload: safeUser
    })

})


// Login
commonApp.post('/login', async (req, res, next) => {
    const { email, password } = req.body
    //validation of email and password
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" })

    const user = await userModel.findOne({ email })

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" })

    if (user.isBlocked === true)
      return res.status(403).json({ message: "Your account has been blocked" })

    if (user.isDeactivated === true)
      return res.status(403).json({ message: "Your account is deactivated. Please reactivate." })

    const isMatched = await compare(password, user.password)
    if (!isMatched)
      return res.status(400).json({ message: "Invalid email or password" })

    const token = sign(
      { id: user._id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    )

    
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    })

    const { _id, firstName, lastName, username, isAdmin } = user.toObject()

    res.status(200).json({
      message: "Login successful",
      payload: { _id, firstName, lastName, username, email, isAdmin }
    })
})


//  Logout 
commonApp.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  })
  res.status(200).json({ message: "Logout successful" })
})

//Change password
commonApp.put('/changepassword',verifyToken,async(req,res)=>{
  //console.log(req.user.id)
  let userId=req.user.id
  let {password,newpassword}=req.body
  if(!userId)
    res.status(401).json({message:"You are not authorised"})
  const userObj=await userModel.findById(userId)
  if(!userObj)
    return res.status(404).json({message:"User not found"})
  const isMatched = await compare(password, userObj.password)
  if(!isMatched)
    return res.status(400).json({message:"Incorrect Password"})
  const hashPassword = await hash(newpassword, 12)
  if(hashPassword === userObj.password)
    return res.status(400).json({message:"Password cannot be same"})
  userObj.password=hashPassword
  await userObj.save()
  return res.status(200).json({message:"Password changed successfully"})
})