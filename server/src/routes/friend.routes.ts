import { Router } from "express";
import { getFriendList, sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from "../controllers/friend.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate, schemas } from "../middleware/validate.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", getFriendList);
router.get("/requests", getFriendRequests);
router.post("/request", validate(schemas.sendFriendRequest), sendFriendRequest);
router.post("/requests/:id/accept", acceptFriendRequest);
router.post("/requests/:id/reject", rejectFriendRequest);

export default router;
