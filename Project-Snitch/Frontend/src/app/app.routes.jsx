import {createBrowserRouter} from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import { Navigate } from "react-router-dom";

export const routes = createBrowserRouter([
    {
        path: "/",
        element: 
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-[#1e1b2c] to-[#2c2a3c]">
            <h1 className="text-3xl font-bold text-white">Welcome to the App</h1>
        </div>
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/login",
        element: <Login />
    }
])