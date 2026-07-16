import { Router } from "express";
import { body } from "express-validator";
import { updateUserName } from "../controller/user.controller.js";

import { authUser } from "../middlewire/auth.middlewire.js";


const userRouts = Router();


// Full route: /api/user/update-username
userRouts.put("/update-username",authUser, updateUserName);

export default userRouts;