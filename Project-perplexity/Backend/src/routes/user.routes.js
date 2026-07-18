import { Router } from "express";
import { body } from "express-validator";
import { updateUserName ,deleteUser} from "../controller/user.controller.js";

import { authUser } from "../middlewire/auth.middlewire.js";


const userRouts = Router();


// Full route: /api/user/update-username
userRouts.put("/update-username",authUser, updateUserName);
userRouts.delete("/delete-user", authUser, deleteUser);
export default userRouts;