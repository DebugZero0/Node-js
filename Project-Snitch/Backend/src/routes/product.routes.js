import express from "express";
import {authenticateSeller} from "../middlewire/auth.middlewire.js";
import { createProduct } from "../controllers/product.controller.js";
import { createProductValidator } from "../validator/product.validator.js";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits:{
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

router.post("/", authenticateSeller,createProductValidator,upload.array("images", 5), createProduct);

export default router;