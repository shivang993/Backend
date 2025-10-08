import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/config_database.js";
import { errorMiddleware } from "./middleware/error.js";
import router from "./routes/userRouter.js";


// ✅ Load environment variables
dotenv.config({ path: "./config.env" });

const app = express();

// ================= MIDDLEWARES =================

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Parse cookies
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // make sure FRONTEND_URL is set correctly in .env
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ================= ROUTES =================
app.use("/api/v1/user", router);
app.use(errorMiddleware);
// ================= DATABASE CONNECTION =================
connection();




export default app;
