import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import { createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  updateGroupMemberProfile,
} from "../controllers/group.controller.js";

const router = express.Router();
router.put("/:groupId", protectRoute, updateGroup);

router.use(protectRoute);

router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/send", sendGroupMessage);
router.put("/:groupId/member/:memberId", updateGroupMemberProfile);

export default router;

