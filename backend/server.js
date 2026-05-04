import exp from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import {config} from "dotenv";
import {connect} from "mongoose";
import { userApp } from './API/userAPI.js'
import { commonApp } from './API/commonAPI.js'
import { postApp } from './API/postAPI.js'
import { adminApp } from './API/adminAPI.js'
import {errorHandler} from './middleware/verifytoken.js'
config();

// create express app
const app = exp();

// CORS middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// cookie parser middleware
app.use(cookieParser());

// JSON body parser middleware
app.use(exp.json());

// connect to MongoDB
const connectDB = async () => {
    try {
        await connect(process.env.DB_URL, {dbName: "twitter_clone"});
        console.log("Database Connected");
        const PORT = process.env.PORT || 6435;
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};
// connectDB();

// Testing API working or not 
app.get("/", (req, res) => {
    res.send("Blog API is running");
}); 
//path for routes
app.use("/user-api",userApp)
app.use("/admin-api",adminApp)
app.use("/post-api",postApp)
app.use("/auth",commonApp)

//to handle invalid path
app.use((req, res, next) => {
    console.log(req.url)
    res.status(404).json({message: `Path ${req.url} is invalid`})
})

// app.use((err, req, res, next) => {
//     if (process.env.NODE_ENV === "development") {
//         console.error(err);
//     }
//     // validation error
//     if (err.name === "ValidationError") {
//         return res.status(400).json({ 
//             message: "error occurred", 
//             error: err.message 
//         });
//     }
//     // cast error
//     if (err.name === "CastError") {
//         return res.status(400).json({ 
//             message: "error occurred", 
//             error: `Invalid ${err.path}: ${err.value}` 
//         });
//     }
//     // duplicate key error
//     if (err.code === 11000) {
//         const field = Object.keys(err.keyValue)[0];
//         const value = err.keyValue[field];
//         return res.status(409).json({ 
//             message: "error occurred", 
//             error: `${field} "${value}" already exists` 
//         });
//     }
//     // send server error
//     res.status(500).json({ 
//         message: "error occurred", 
//         error: "Server side error" 
//     });
// });
connectDB();


app.use(errorHandler)
export default app;