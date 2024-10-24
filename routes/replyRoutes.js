const express = require("express");
const mongoose = require("mongoose");

const Group = require("../models/group");
const Reply = require("../models/reply");
const Post = require("../models/post");

const router = express.Router();

// Create a reply
router.post("/create", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const replyData = req.body;
    const { parentId, groupId, postId } = replyData;

    const group = await Group.findOne({ _id: groupId });
    if (
      !group ||
      !group.members.find((id) => id.toString() === parentId.toString())
    ) {
      res
        .status(403)
        .json({ message: "You are not authorized to reply in this circle" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { isThreadCreated: true, $inc: { totalReplies: 1 } },
      { new: true, session }
    );

    if (!updatedPost) {
      throw new Error("Post not found");
    }

    const reply = new Reply(replyData);
    await reply.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "reply created successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
