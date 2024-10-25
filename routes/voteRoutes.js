const express = require("express");
const mongoose = require("mongoose");

const Group = require("../models/group");
const Reply = require("../models/reply");
const Post = require("../models/post");
const Vote = require("../models/vote");

const router = express.Router();

// API to submit vote
router.post("/create", async (req, res) => {
  // start transaction session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const voteData = req.body;
    const { groupId, parentId, replyId, postId, voteType } = voteData;

    // check if voter is member of group
    const group = await Group.findOne({ _id: groupId }).session(session);
    if (
      !group ||
      !group.members.find((id) => id.toString() === parentId.toString())
    ) {
      throw new Error("You are not authorized to react in this circle") ;
    }

    // check if post exist or not in circle/group
    const post = await Post.findOne({ _id: postId }).session(session);
    if (!post) {
      throw new Error("post not found") ;
    }

    // replyId != null => vote is for reply message with  _id = replyId
    if (replyId) {
      const reply = await Reply.findOne({ _id: replyId }).session(session);
      if (!reply) {
        throw new Error("reply not found") ;
      }

      reply.votes[voteType] += 1;
      await reply.save({ session });
    } else {
      // replyId === null => vote is for original post in circle/group with _id = postId
      post.votes[voteType] += 1;
      await post.save({ session });
    }

    // create vote and save in votes collection
    const vote = new Vote(voteData);
    await vote.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: "vote created successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
