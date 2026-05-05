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

connectDB();


app.use(errorHandler)
export default app;