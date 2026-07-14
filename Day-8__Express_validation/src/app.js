import express from "express";
import AuthRoute from "./Routes/auth.route.js";
import handleError from "./Middlewires/error.js";

const app=express();
app.use(express.json()); // Middleware to parse JSON request bodies

app.use("/api/auth",AuthRoute); 

app.get("/",(req,res)=>{
    res.send("Welcome to the API");
});


app.use(handleError); // Error handling middleware.. at end of all routes and middlewares
export default app;