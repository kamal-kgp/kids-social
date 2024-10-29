const express = require("express");
const mongoose = require("mongoose");

const Parent = require("../models/parent");
const ParentGroup = require("../models/parentGroup");
const Group = require("../models/group");
const parentGroup = require("../models/parentGroup");

const router = express.Router();

// API to Create a new parent
router.post("/create", async (req, res) => {
  // start transaction session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parentData = req.body;
    const { school, classNum, section, address } = parentData;

    // create groupTypeId to identify same group/circle
    const schoolId = school.toLowerCase().replace(/\s/g, ""); //assuming school name is unique (but we can use school reg number too) , circle = DPS school
    const classId = `${schoolId}#${classNum}`; // for circle = DPS school, class-1
    const sectionId = `${classId}#${section}`; // for circle = DPS school, class-1, cection-F
    const societyId = `${address?.zipCode}#${address?.societyCommunity
      .toLowerCase()
      .replace(/\s/g, "")}`; // for circle = Brigade society
    const schoolSocietyId = `${schoolId}#${societyId}`; // for circle = DPS school, brigade society

    // create and save parent document in parents collection
    const parent = new Parent(parentData);
    await parent.save({ session });

    // check if standard group exist or not using groupTypeId
    // if exist then add parent, if not exist then create group and add parent in it, finally return group's _id
    const schoolGroupId = await createOrFindGroup(
      schoolId,
      school,
      parent._id,
      session
    );
    const classGroupId = await createOrFindGroup(
      classId,
      `${school}, class ${classNum}`,
      parent._id,
      session
    );
    const sectionGroupId = await createOrFindGroup(
      sectionId,
      `${school}, class-${classNum} section ${section}`,
      parent._id,
      session
    );

    let schoolSocietyGroupId;
    let societyGroupId;
    if (address) {
      // make two groups related with society only if address is given by parent in req body
      schoolSocietyGroupId = await createOrFindGroup(
        schoolSocietyId,
        `${school} - ${address?.societyCommunity}`,
        parent._id,
        session
      );
      societyGroupId = await createOrFindGroup(
        societyId,
        address?.societyCommunity,
        parent._id,
        session
      );
    }

    // finally save all the standard groups ID's corresponding to their type in parentGroup document in parentgroups collection
    const parentGroup = new ParentGroup({
      parentId: parent._id,
      stdGroups: {
        schoolGroup: schoolGroupId,
        classGroup: classGroupId,
        sectionGroup: sectionGroupId,
        societySchoolGroup: schoolSocietyGroupId || undefined,
        societyGroup: societyGroupId || undefined,
      },
    });
    await parentGroup.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: "parent created successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// API to change groups with grade change
router.put("/change-groups/:id", async (req, res) => {
  // start transaction session to ensure atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parentId = req.params.id;
    const { newClass, newSection } = req.body;

    // find parent and update details, if parent does not exist then return error
    const parent = await Parent.findByIdAndUpdate(
      parentId,
      {
        classNum: newClass,
        section: newSection,
      },
      { new: true, session }
    );
    if (!parent) {
      throw new Error("no parent found");
    }

    // find parentGroup document for group ids of classGroup and sectionGroup
    // parentGroup have ids of all groups whose this parent is member
    const parentGroup = await ParentGroup.findOne({
      parentId: parentId,
    }).session(session);
    if (!parentGroup) {
      throw new Error("no group found");
    }
    const classGroupId = parentGroup.stdGroups.classGroup;
    const sectionGroupId = parentGroup.stdGroups.sectionGroup;

    // find groups using classGroupId and sectionGroupId
    // then remove parent as member from members array of both groups
    if (classGroupId) {
      await Group.findByIdAndUpdate(
        classGroupId,
        {
          $pull: { members: parentId },
        },
        { session }
      );
    }
    if (sectionGroupId) {
      await Group.findByIdAndUpdate(
        sectionGroupId,
        {
          $pull: { members: parentId },
        },
        { session }
      );
    }

    // made new groupTypeId using new class and section
    // groupTypeId is used to identify standard groups and check if these groups already exist or not (groups created by application) ?
    const newClassId = `${parent.school
      .toLowerCase()
      .replace(/\s/g, "")}#${newClass}`;
    const newSectionId = `${newClassId}#${newSection}`;

    // create or find groups according to new groupTypeId
    // add parent to those groups as member
    const newClassGroupId = await createOrFindGroup(
      newClassId,
      `${parent.school}, class-${newClass}`,
      parentId,
      session
    );
    const newSectionGroupId = await createOrFindGroup(
      newSectionId,
      `${parent.school}, class-${newClass}, section-${newSection}`,
      parentId,
      session
    );

    // save new class group and section group ids of kid in parentGroup document
    parentGroup.stdGroups.classGroup = newClassGroupId;
    parentGroup.stdGroups.sectionGroup = newSectionGroupId;
    await parentGroup.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: "group changed succesfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// API to create derived groups
router.post("/create-derived-group", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const groupTypeId = new mongoose.Types.ObjectId();
    const derivedGroup = new Group({
      ...req.body,
      groupTypeId: groupTypeId,
    });
    await derivedGroup.save({ session });

    await parentGroup.updateOne(
      { parentId: req.body.createdBy },
      { $push: { other: derivedGroup._id } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ message: "derived group created succesfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// API to discover all potential circles that a parent can join
router.get("/discover-groups/:id", async (req, res) => {
  // start transaction session for ensuring atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const parentId = req.params.id;

    // find parentGroup using parentId for _ids of standard groups
    const parentGroups = await ParentGroup.findOne({
      parentId: parentId,
    }).session(session);
    if (!parentGroups) {
      throw new Error("No groups found");
    }

    const stdGroups = parentGroups.stdGroups;
    const stdGroupsIDs = [
      stdGroups.schoolGroup,
      stdGroups.classGroup,
      stdGroups.sectionGroup,
    ];
    if (stdGroups?.societySchoolGroup) {
      stdGroupsIDs.push(stdGroups.societySchoolGroup);
    }
    if (stdGroups?.societyGroup) {
      stdGroupsIDs.push(stdGroups?.societyGroup);
    }

    // retrieve all the derived potential circles for this parent from groups collection using standard groups _id
    const discoveredGroups = await Group.find({
      relatedTo: { $in: stdGroupsIDs },
    })
      .select("_id groupName createdBy relatedTo")
      .session(session);
    // console.log("discoveredGroups: ", discoveredGroups);

    // commit transaction and send discoveredGroups in response
    await session.commitTransaction();
    res.status(200).json({ data: discoveredGroups });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

/**
 * Creates a new group or finds an existing one based on the provided groupTypeId.
 * If the group exists, adds the parentId to the group's members and returns the group's _id.
 * If the group does not exist, creates a new group with the given groupTypeId and groupName,
 * adds the parentId to the group's members, and returns the new group's _id.
 */
const createOrFindGroup = async (groupTypeId, groupName, parentId, session, retries = 3) => {
  try {
    const group = await Group.findOne({ groupTypeId: groupTypeId }).session(
      session
    );

    if (group) {
      group.members.push(parentId);
      await group.save({ session });
      return group._id;
    } else {
      const group = new Group({
        isStandardGroup: true,
        groupTypeId: groupTypeId,
        groupName: groupName,
        members: [parentId],
      });

      await group.save({ session });
      return group._id;
    }
  } catch (error) {
    if (error.code === 11000 && retries > 0) {
      // If the group already exists, try again
      // This can happen if multiple requests are made to create the same group in parallel
      await createOrFindGroup(groupTypeId, groupName, parentId, session, retries - 1);
    } else {
      throw new Error(error);
    }
  }
};

module.exports = router;
