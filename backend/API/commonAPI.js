import exp from 'express'
export const commonApp = exp.Router()
import {verifyToken} from '../middleware/verifytoken.js'
import { hash,compare} from 'bcryptjs'
import jwt from 'jsonwebtoken'
const {sign} =jwt
import {userModel} from '../Model/userModel.js'
//Registration for user
commonApp.post('/register', async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);
    const userObj = req.body;
    userObj.password = await hash(userObj.password, 12);
    const newUserDoc = new userModel(userObj);
    await newUserDoc.save();

    console.log("USER SAVED:", newUserDoc._id);

    res.status(201).json({
      message: "User created successfully",
      payload: newUserDoc
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

//Login route
commonApp.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    //user not found
    if (!user) {
      return res.status(400).json({message: "Invalid email or password"});
    }
    // block check
    if (user.isUserActive === false || user.isDeactivated=== true) {
      return res.status(403).json({message: "Your account is blocked or deactivated"});
    }

    //password safety check
    if (!user.password) {
      return res.status(500).json({message: "User password missing in DB"});
    }

    const isMatched = await compare(password, user.password);

    if (!isMatched) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = sign({ id: user._id, email: user.email },
                      process.env.SECRET_KEY,
                      { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: false
    });

    const { _id, firstName, lastName, username} = user.toObject();

    res.status(200).json({
    message: "Login successful",
    payload: {
        _id,
        firstName,
        lastName,
        username,
        email
    }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);res.status(500).json({message: err.message});
  }
});

//Logout route
commonApp.post("/logout",async(req,res)=>{
    res.clearCookie('token',{
        httpOnly:true,
        secure:false,
        sameSite:"lax"
    });
    res.status(200).json({message:"Logout successfull"})
})