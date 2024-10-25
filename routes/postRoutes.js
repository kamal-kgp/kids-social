const express = require("express");

const Group = require("../models/group");
const Post = require("../models/post");

const router = express.Router();

// API to create a new post
router.post("/create", async (req, res) => {
  try {
    const postData = req.body;
    const { parentId, groupId } = postData;

    // condition-1 : check if group not exist
    // condition-2 : if group exist then check parent is not member of group
    // if one of above condition is true then return error
    const group = await Group.findOne({ _id: groupId });
    if (
      !group ||
      !group.members.find(
        (memberId) => memberId.toString() === parentId.toString()
      )
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to post in this circle" });
    }

    // finally save post in posts collection
    const post = new Post(postData);
    await post.save();

    res.status(201).json({ message: "post created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
