import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import morgan from "morgan";

dotenv.config();

const app = express();
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(passport.initialize());

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
    (accessToken, refreshToken, profile, done) => {
        // Here you can handle the user profile and save it to your database if needed
        console.log(profile);
        return done(null, profile);
    }
));

// Redirect the user to Google for authentication 
app.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",passport.authenticate("google", { session: false, failureRedirect: "/" }),
    (req, res) => {
        // Successful authentication, redirect or respond as needed
        res.send("Authentication successful");
    }
);

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
})
