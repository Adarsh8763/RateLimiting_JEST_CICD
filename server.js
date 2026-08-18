import "dotenv/config"
import express from "express";
import Redis from "ioredis";
import mongoose from "mongoose";
import morgan from "morgan";
import userModel from "./models/user.model.js";
import rateLimit from "express-rate-limit";

// Connect to MongoDB
const connectToDB = async () => {
  try{
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDB();

// Connect to Redis
const redis = new Redis(process.env.REDIS_URI);

redis.once("connect", () => {
  console.log("Connected to Redis");
})

// Middelewares
const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 100,                    // 100 requests per window per IP
  message: {
    error: 'Too many requests. Please try again later.'
  },
  statusCode: 429,
  standardHeaders: true,   // sends RateLimit-* headers
  legacyHeaders: false,
});

// Apply to every route
app.use(globalLimiter);


// Routes
app.get("/user/:id", async (req, res) => {
  try{
    const cachedUser = await redis.get(`user:${req.params.id}`);
    if (cachedUser) {
      return res.json({
        msg: "User fetched from cache",
        user: JSON.parse(cachedUser)
      });
    }
    const user = await userModel.findOne({_id: req.params.id});
    await redis.set(`user:${req.params.id}`, JSON.stringify(user), "EX", 3600); // Cache for 1 hour
    res.json({
      msg: "User fetched from database",
      user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/user", async (req, res) => {
  try{
    const { name, email, password } = req.body;
    const user = new userModel({ name, email, password });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Set EJS as the view engine
app.set('view engine', 'ejs');   //Kaun sa view engine we are using ye batana padega
app.set("views", "./views")

app.use(express.static("public"))

app.get("/", (req, res) => {
  res.render("index", {
    username: "Adarsh",
    bio: "This is the sample bio for this user",
    profileImg: "https://images.unsplash.com/photo-1508341591423-4347099e1f19?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  })
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});