import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to add routes in this file

router.use("/:videoId").get(getVideoComments).post(addComment)
router.use("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router
