const mongoose = require("mongoose");

const parentGroupsSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parent",
  },
  stdGroups: {
    schoolGroup: {
      // DPS school
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    classGroup: {
      // DPS school, class-1
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sectionGroup: {
      // DPS school, class-1, section-f
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    societySchoolGroup: {
      // DPS school, brigade society
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false,
    },
    societyGroup: {
      // Brigade society
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false,
    },
  },
  other: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false,
    },
  ],
  createdOn: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
  updatedOn: {
    type: Date,
    default: Date.now(),
    immutable: false,
  },
});

parentGroupsSchema.pre("save", function (next) {
  this.updatedOn = Date.now();
  next();
});

module.exports = mongoose.model("ParentGroups", parentGroupsSchema);