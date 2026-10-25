// this is my changes in feature branch 


// require("dotenv").config();
// const express = require("express");
const todoRoutes = require("./routes/todoRoutes");
const cors = require("cors");
const session = require("express-session");
const flash = require("connect-flash");
const {MongoStore} = require("connect-mongo");
const passport = require("passport");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const reviewRoutes = require("./routes/Review.js");
const User = require("./models/User");
const ExpressError = require("./utils/ExpressError.js")


const app = express();
const mongoUrl = process.env.MONGO_URI;
const sessionSecret = process.env.SESSION_SECRET;
const frontendUrl = process.env.FRONTEND_URL;
const isProduction = process.env.NODE_ENV === "production";
const missingEnv = [
  ["MONGO_URI", mongoUrl],
  ["SESSION_SECRET", sessionSecret],
  ["FRONTEND_URL", frontendUrl],
].filter(([, value]) => !value);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missingEnv.map(([name]) => name).join(", ")}`);
}

let frontendOrigin;
try {
  const parsedFrontendUrl = new URL(frontendUrl);
  if (!["http:", "https:"].includes(parsedFrontendUrl.protocol)) {
    throw new Error("Unsupported protocol");
  }
  frontendOrigin = parsedFrontendUrl.origin;
} catch {
  throw new Error("FRONTEND_URL must be a valid absolute HTTP or HTTPS URL");
}

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

app.use(express.json());

const sessionObj =   {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
  mongoUrl,
  }),
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}
app.use(session(sessionObj));

app.use(passport.initialize());
app.use(passport.session());
 
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());


app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;

app.use("/review", reviewRoutes);
app.use("/auth", authRoutes);
app.use("/api", todoRoutes);

app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong",
   });
});

async function startServer() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exitCode = 1;
  }
}

startServer();
