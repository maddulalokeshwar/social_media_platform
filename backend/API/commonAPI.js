import exp from 'express'
import { hash, compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userModel } from '../Model/userModel.js'

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