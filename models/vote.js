const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  replyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reply",
    default: null,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
    required: true,
  },
  voteType: {
    type: String,
    required: true,
    enum: ["up", "down"],
  },
  votedOn: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
  voteChangeOn: {
    type: Date,
    default: Date.now(),
    immutable: false,
  },
});

voteSchema.pre("save", function (next) {
  this.voteChangeOn = Date.now();
  next();
});

module.exports = mongoose.model("Vote", voteSchema);
