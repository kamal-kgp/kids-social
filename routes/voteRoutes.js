const express = require("express");

const Group = require("../models/group"); 
const Reply = require("../models/reply");
const Post = require("../models/post");
const Vote = require("../models/vote");

const router = express.Router();

// Create a new parent
router.post("/create", async (req, res) => {
  try {
    const voteData = req.body;
    const { groupId, parentId, replyId, postId, voteType } = voteData;

    const group = await Group.findOne({ _id: groupId });
    if (!group || !group.members.find((id) => id.toString() === parentId.toString())) {
      res
        .status(403)
        .json({ message: "You are not authorized to react in this circle" });
    }

    const post = await Post.findOne({ _id: postId }); 
    if (!post) {
      res
        .status(404)
        .json({ message: "post not found" });
    }

    if(replyId){
        const reply = await Reply.findOne({_id: replyId});
        if(!reply){
            res.status(404).json({message: "reply not found"})
        }

        reply.votes[voteType] += 1 ;
        await reply.save() ;
    }

    if(!replyId){
        post.votes[voteType] += 1;
        await post.save() ;
    }

    const vote = new Vote(voteData) ;
    await vote.save() ;
    
    res.status(201).json({ message: "vote created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
});

module.exports = router;