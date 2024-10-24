const express = require("express");

const Group = require("../models/group");
const Post = require("../models/post");

const router = express.Router();

// Create a new post
router.post("/create", async (req, res) => {
  try {
    const postData = req.body;
    const { parentId, groupId } = postData;

    const group = await Group.findOne({ _id: groupId });
    if (
      !group ||
      !group.members.find(
        (memberId) => memberId.toString() === parentId.toString()
      )
    ) {
      res
        .status(403)
        .json({ message: "You are not authorized to post in this circle" });
    }

    const post = new Post(postData);
    await post.save();

    res.status(201).json({ message: "post created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;