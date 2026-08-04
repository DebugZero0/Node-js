import express from "express";
import {authenticateSeller} from "../middlewire/auth.middlewire.js";
import { createProduct ,getSellerProducts } from "../controllers/product.controller.js";
import { createProductValidator } from "../validator/product.validator.js";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits:{
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const router = express.Router();

router.post("/", authenticateSeller,upload.array("images", 5),createProductValidator, createProduct);

router.get("/seller", authenticateSeller, getSellerProducts);
export default router;