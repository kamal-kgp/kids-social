const express = require("express");

const Parent = require("../models/parent");
const ParentGroup = require("../models/parentGroup");
const Group = require("../models/group");

const router = express.Router();

// Create a new parent
router.post("/create", async (req, res) => {
  try {
    const parentData = req.body;
    // console.log("parent data: ", parentData) ;
    const { school, classNum, section, address } = parentData;

    const schoolId = school; //assuming school name is unique (but we can use school reg number)
    const classId = `${schoolId}#${classNum}`;
    const sectionId = `${classId}#${section}`;
    const societyId = `${address?.zipCode}#${address?.societyCommunity}`;
    const schoolSocietyId = `${schoolId}#${societyId}`;

    const parent = new Parent(parentData);
    await parent.save();

    const schoolGroupId = await createOrFindGroup(schoolId, school, parent._id);
    const classGroupId = await createOrFindGroup(
      classId,
      `${school}, class ${classNum}`,
      parent._id
    );
    const sectionGroupId = await createOrFindGroup(
      sectionId,
      `${school}, class-${classNum} section ${section}`,
      parent._id
    );

    let schoolSocietyGroupId;
    let societyGroupId;
    if (address) {
      schoolSocietyGroupId = await createOrFindGroup(
        schoolSocietyId,
        `${school} - ${address?.societyCommunity}`,
        parent._id
      );
      societyGroupId = await createOrFindGroup(
        societyId,
        address?.societyCommunity,
        parent._id
      );
    }

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
    await parentGroup.save();

    res.status(201).json({ message: "parent created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
});

const createOrFindGroup = async (groupTypeId, groupName, parentId) => {
  try {
    const group = await Group.findOne({ groupTypeId: groupTypeId });

    if (group) {
      group.members.push(parentId);
      await group.save();
      return group._id;
    } else {
      const group = new Group({
        isStandardGroup: true,
        groupTypeId: groupTypeId,
        groupName: groupName,
        members: [parentId],
      });

      await group.save();
      return group._id;
    }
  } catch (error) {
    throw new Error(error);
  }
};
module.exports = router;