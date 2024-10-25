const express = require("express");
const mongoose = require("mongoose");

const Group = require("../models/group");
const Reply = require("../models/reply");
const Post = require("../models/post");

const router = express.Router();

// API to Create a reply
router.post("/create", async (req, res) => {
  // start transaction session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const replyData = req.body;
    const { parentId, groupId, postId } = replyData;

    // check if parent who is creating reply is member of group/circle
    const group = await Group.findOne({ _id: groupId }).session(session);
    if (
      !group ||
      !group.members.find((id) => id.toString() === parentId.toString())
    ) {
      throw new Error("You are not authorized to reply in this circle") ;
    }

    // update original post's data (for ensuring creation of one thread only) and count of total replies in thread if post exist
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { isThreadCreated: true, $inc: { totalReplies: 1 } },
      { new: true, session }
    );

    if (!updatedPost) {
      throw new Error("Post not found");
    }

    // create and save the reply in replies collection
    const reply = new Reply(replyData);
    await reply.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: "reply created successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
