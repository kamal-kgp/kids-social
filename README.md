## Table of Contents

- [Overview](#overview)
- [Database-overview](#Database-overview)
- [Solution-1](#Solution-1)
- [Solution-2](#Solution-2)
- [Solution-3](#Solution-3)
- [Solution-4](#Solution-4)
- [Run-backend](#Run-backend)
- [Improvements](#Improvements)

---

## Overview

I have made the database schema and apis for problems 1 and 2 using **Express** and **NodeJS**, while the database is **MongoDB**, and i have used **Mongoose** as ODM. Perhaps i have not solved problem 3 and 4 yet but i have written my approach in corresponding solution section 

---

## Database-overview
***DB :*** kidsSocial
***Collections :*** 
1. parents         // store all the parents details as documents
2. groups          // store all the groups (created by application and parent)
3. parentgroups    // store all the ids of groups of which this parent is member
4. posts           // store all the posts from every group
5. replies         // store all the replies from every thread and group
6. votes           // store all votes

---


## Solution-1

### Data model for storing parent
find it here: "./model/parent.js"

Assumption :- we can extract class and section from student id but here i am taking them as input from parent

### Data model for circle or group
find it here:  "./model/group.js"

### Flow of circle creation by application 
Find code here : "./routes/parentRoutes"

**Step-1**
create a unique id for each standard circle and i call it groupTypeId 
 1. const schoolId = school; // assuming school name is unique (but we can use school reg number)
 2. const classId = `${schoolId}#${classNum}`;  // for DPS school, class 1 circle
 3. const sectionId = `${classId}#${section}`;  // for DPS school, class 1, section F
 4. const societyId = `${address?.zipCode}#${address?.societyCommunity}`; // for Brigade society
 5. const schoolSocietyId = `${schoolId}#${societyId}`; // for Brigade society, DPS School

**Step-2**
save the parent in parents collection 

**Step-3**
code : function named createOrFindGroup in this file "./routes/parentRoutes"

flow :-
check standard group exist or not using their unique ids (groupTypeId created in step-1) 
- if exist -> Save parent id (created by mongoDB in step 2) in members array of that circle and return circle id
- if not exist -> Create a group with groupTypeId created in step 1 and Save parent id (created by mongoDB in step 2) in members array of that circle and return circle id

**Step-4**
save IDs of all standard circle return in step-4 in this collection named "parentGroups"
- schema : "./models/parentGroup.js" ;
- Function of this document :- it store all the ids of circle in which this parent is member

---

## Solution-2
stored reply in replies collection and post in posts collection and used collection refrencing and thread cant be created on reply docs ( can be handeled over frontend )

### Data model for Post created by parent
find it here: "./models/post.js"

### Data model for reply created by parent
find it here: "./models/reply.js"

### Data model for vote 
find it here : "./models/vote.js"

### Flow for post crestion
code: "./routes/postRoutes.js"

check if parent Id is available in members array of group with groupId (coming from req.body)
- Not exist -> return error 
- Exist -> Save post in posts collection

### Flow for reply creation
code : "./routes/replyRoutes.js"

**Step-1** 
first check if this parent is member of this group 
- Not exist -> return error 
- Exist -> Save post in posts collection

**Step-2**
update isThreadCreated key in post so that only one thread is created from each post 
and also update totalCount of replies in thread of this post

**Step-3**
save the reply and send success status

### Flow of voting
code: "./routes/voteRoutes.js" 

**Step-1**
check if voter(parentId) is member of group 
- Not exist -> return error 
- Exist -> move to step-2

**Step-2**
check if post exist (postId) in posts collection 
- Not exist -> return error 
- Exist -> move to step-2

**Step-3**
check if replyId is not null

not null -> It means it is a vote on reply in thread 
check if reply exist
***case-1*** Not exist -> return error 
***case-2*** Exist -> update vote count for that type(up/down) in reply document in replies collection

replyId is null -> It means it is a vote on Original Post in circle -> update vote count for that type(up/down) in post document in posts collection

**Step-4**
save the vote in votes collection and return success status

## Solution-3
I have not coded it yet but i am submitting my approach

### problem : 
Schema Evolution How would the schema adapt to accommodate parent-initiated circles and children changing grades 

### Answer
***Case-1*** children changing grades
***Approach*** 
-> No change in society, school society and school group as these are not changing
-> Remove child from previous class and class section group (By using parentId and standard group Ids from parentsGroup collection )

 ***Flow :***
  input from user = parentId
  1. find parentGroup using parentId in parentgroups collection
  2. find group ids for class and classSection group from standard groups object in parentGroup document for that parent and set them to null 
  3. find groups in groups collection using group IDs found in step-2 and remove parentId from their members arraay

-> and add them into new ones ( check if required group already exists ? or not )

 ***Flow :***
  1. create unique "groupTypeId" as mentioned in solution-1
  2. check if these group exist using  "groupTypeId" in groups collection 
   - Exist -> save parentId in members array of these group
   - Not exist -> make group and save parentId in members array of these group

-> update kids info in parent data and parentsGroups 


***Case-2***  accommodate parent-initiated circles
***Approach***
-> Schema : 
{
    _id:  auto generated by mongoDB
    isStandardGroup : false,
    groupTypeId: 
    groupName: 
    Members : [ array of IDs of parents for this group ],
    createdBy: (parentId who have created this),
    createdOn:
    updatedOn:	
    relatedTo: Id of standard group (schoolId, classId, sectionId, societyId, schoolSocietyId)
}

---

## Solution-4

### Problem 
Enhancements for new circles Allow parents to create new circles based on existing ones (e.g., "Brigade Society Bus No. 92" under "Brigade Society"). These circles are opt-in, requiring a mechanism for discoverability. 

### Solution
On frontend -> while creating group give them family ( standard groups name ) to choose to create group under them
On backend -> Store standard group id in relatedTo key, store parent id under createdBy key 
following this schema: 
{
    _id:  auto generated by mongoDB
    isStandardGroup : false,
    groupTypeId: 
    groupName: 
    Members : [ array of IDs of parents for this group ],
    createdBy: (parentId who have created this),
    createdOn:
    updatedOn:	
    relatedTo: Id of standard group (schoolId, classId, sectionId, societyId, schoolSocietyId)
}

### Problem
Design an API to retrieve all potential circles a parent can join, addressing the discoverability challenge

### Solution
i am stroing Id of standard group as relatedTo in parent created group and these ids also available in parentGroup document in parentgroups collection

retrieve all the group whose relatedId matches with groupIds stored in standardGroup key of parentGroup document 

---

## Run-backend

***Step-1**
```bash
npm install
```
***Step-2***
create a ***.env*** file in root directory and save this field : 
MONGO_URI = "Connection string to your mongoDB database"

***Step-3***
```bash
npm start
```

---

## Improvements 
1. Implementation of all crud apis
2. Implementaion of atomicity for transaction 
3. Improve error handelling
4. Solve problem 3 and 4
