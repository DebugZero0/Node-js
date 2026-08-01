import {createBrowserRouter} from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import { Navigate } from "react-router-dom";

export const routes = createBrowserRouter([
    {
        path: "/",
        element: <Register />
    },
    {
        path: "/register",
        element: <Navigate to="/" replace = { true } />
    },
    {
        path: "/login",
        element: <Login />
    }
])