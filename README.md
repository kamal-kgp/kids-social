## Table of Contents

- [Overview](#overview)
- [Database-overview](#Database-overview)
- [Solution-1](#Solution-1)
- [Solution-2](#Solution-2)
- [Solution-3](#Solution-3)
- [Solution-4](#Solution-4)
- [Run-backend](#Run-backend)
- [Improvements](#Improvements)
- [Curl-requests](#curl-requests)

---

## Overview

I have made the database schema and apis using **Express** and **NodeJS**, while the database is **MongoDB**, and i have used **Mongoose** as ODM. 

---

## Database-overview
**DB :** kidsSocial

**Collections :**
1. parents  (store all the parents details as documents)
2. groups  (store all the groups (created by application and parent))
3. parentgroups  (store all the ids of groups of which this parent is member)
4. posts  (store all the posts from every group)
5. replies  (store all the replies from every thread and group)
6. votes  (store all votes)

---


## Solution-1

### Data model for storing parent
find it here: ***"./model/parent.js"***

Assumption 1 :- we can extract class and section from student id but here i am taking them as input from parent

### Data model for circle or group
find it here:  ***"./model/group.js"***

### Flow of circle creation by application 
**Code :** API endpoint = ***post("/create")*** in ***"./routes/parentRoutes"*** file (i have written logic as comments for every step)

**Steps**
1. create a unique id for each standard circle and i call it groupTypeId 
```javascript
  const schoolId = school; // assuming school name is unique (but we can use school reg number)
  const classId = `${schoolId}#${classNum}`;  // for DPS school, class 1 circle
  const sectionId = `${classId}#${section}`;  // for DPS school, class 1, section F
  const societyId = `${address?.zipCode}#${address?.societyCommunity}`; // for Brigade society
  const schoolSocietyId = `${schoolId}#${societyId}`; // for Brigade society, DPS School
 ```

2. save the parent in parents collection 
3. check standard group exist or not using their unique ids (groupTypeId created in step-1)

**Code** : function named ***createOrFindGroup*** in ***"./routes/parentRoutes"*** file

flow :-
- if exist -> Save parent id (created by mongoDB in step 2) in members array of that circle and return circle id
- if not exist -> Create a group with groupTypeId created in step 1 and Save parent id (created by mongoDB in step 2) in members array of that circle and return circle id
4. save IDs of all standard circle return in step-4 in this collection named "parentGroups"
- schema for "parentGroup": ***"./models/parentGroup.js"*** ;
- Function of this document :- it store all the ids of circle in which this parent is member

---


## Solution-2
stored reply in replies collection and post in posts collection and used collection refrencing and thread cant be created on reply docs (can be handeled over frontend)

### Data model for Post created by parent
find it here: ***"./models/post.js"***

### Data model for reply created by parent
find it here: ***"./models/reply.js"***

### Data model for vote 
find it here : ***"./models/vote.js"***

### Flow for post crestion
**Code :** API endpoint = ***post("/create")*** in ***"./routes/postRoutes.js"*** file (i have written logic as comments for every step)

1. check if parent Id is available in members array of group with groupId (coming from req.body)
- Not exist -> return error 
- Exist -> Save post in posts collection

### Flow for reply creation
**Code :** API endpoint = ***post("/create")*** in ***"./routes/replyRoutes.js"*** file (i have written logic as comments for every step)

1. first check if this parent is member of this group 
- Not exist -> return error 
- Exist -> Save post in posts collection
2. update isThreadCreated key in post so that only one thread is created from each post 
and also update totalCount of replies in thread of this post
3. save the reply and send success status

### Flow of voting
**Code :** API endpoint = ***post("/create")*** in ***"./routes/voteRoutes.js"*** file (i have written logic as comments for every step)

1. check if voter(parentId) is member of group 
- Not exist -> return error 
- Exist -> move to step-2
2. check if post exist (postId) in posts collection 
- Not exist -> return error 
- Exist -> move to step-3
3. check if replyId is not null
- not null -> It means it is a vote on reply in thread 
4. check if reply exist
- Not exist -> return error 
- Exist -> update vote count for that type(up/down) in reply document in replies collection
5. replyId is null => It means it is a vote on Original Post in circle => update vote count for that type(up/down) in post document in posts collection
6. save the vote in votes collection and return success status

---


## Solution-3

### Case-1 (children changing grades)

**code:**  API -> ***put("/change-groups/:id")***  in  ***"./routes/parentRoutes.js"*** file (i have written logic as comments for every step)

### Approach
1. No change in society, school society and school group as these are not changing
2. update class and section info in parent details
3. Remove child from previous class and class section group (By using parentId and standard group Ids (present in parentsGroup collection))
4. Create or find new groups and add parent in them 
5. save ids of these new groups in parentGroup 

### Case-2 (accommodate parent-initiated circles)

### Approach
**find schema here :-**  "./models/group.js"

***isStandardGroup***, ***"createdBy"*** and ***"relatedTo"*** keys in group document will help to recognize if this group is standard or derived group (created by parents), who created this group and under which standard group this new group is derived.

**WHOLE SCHEMA FOR GROUPS**
```javascript
{
	_id: mongoose.Schema.Type.ObjectId,  // auto generated by mongoDB
	isStandardGroup : boolean,  // true when created by application, false when created by parent
	groupTypeId: new mongoose.Types.ObjectId(),  // created by application
    groupName: String,  // set by creator (e.g., "Brigade Society Bus No. 92") 
    Members : [mongoose.Schema.Type.ObjectId],  // array of object IDs of members of this group (reference to parents collection),
    createdBy: mongoose.Schema.Type.ObjectId,  // ref to parent (_id) who have created this 
    relatedTo: mongoose.Schema.Type.ObjectId,  // ref to standard groups (_id) under which this group is created
    createdOn: Date.now(),  // default
    updatedOn: Date.now(),  // change with every update
}
```

---


## Solution-4

### Problem 
Enhancements for new circles Allow parents to create new circles based on existing ones (e.g., "Brigade Society Bus No. 92" under "Brigade Society"). These circles are opt-in, requiring a mechanism for discoverability. 

### Solution
**On frontend :** while creating group give them family ( standard groups name ) to choose to create group under them

**On backend :** Store standard groups _id in relatedTo key as reference, store parent _id under createdBy key for reference to creator

***follow this schema :** for creating new groups 
```javascript
{
	_id: mongoose.Schema.Type.ObjectId,  // auto generated by mongoDB
	isStandardGroup : boolean,  // true when created by application, false when created by parent
	groupTypeId: new mongoose.Types.ObjectId(),  // created by application
    groupName: String,  // set by creator (e.g., "Brigade Society Bus No. 92") 
    Members : [mongoose.Schema.Type.ObjectId],  // array of object IDs of members of this group (reference to parents collection),
    createdBy: mongoose.Schema.Type.ObjectId,  // ref to parent (_id) who have created this 
    relatedTo: mongoose.Schema.Type.ObjectId,  // ref to standard groups (_id) under which this group is created
    createdOn: Date.now(),  // default
    updatedOn: Date.now(),  // change with every update
}
```

### Problem
Design an API to retrieve all potential circles a parent can join, addressing the discoverability challenge

### Solution
**API endpoint :** get("/discover-groups/:id") in ***file*** "./routes/parentRoutes.js" (i have written logic as comments for every step)

**Approach**

i am storing _id of standard group in ***relatedTo*** key in new groups and these ids also available in ***parentGroup*** document in ***parentgroups*** collection for every parent. 

1. find standard groups _id from ***parentgroups*** collection for a parent
2. retrieve all new groups from group collection that have reference to these standard group in which this parent is member

---


## Run-backend

**Step-1**
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
1. Implement other possible crud apis 
3. Improve error handelling


---


## Curl-requests 

#### creating parents 
1. send all details
```
curl -X POST http://localhost:5001/api/parent/create \
-H "Content-Type: application/json" \
-d '{
    "parentName": "parent-1",
    "school": "DPS School",
    "classNum": "1",
    "section": "F",
    "schoolIdCard": "base64 string of id card",
    "address": {
        "societyCommunity": "Brigade society",
        "city": "indore",
        "state": "Madhyapradesh",
        "country": "India",
        "zipCode": "345678"
    }
}'
```

2.  parent-2, Not sending address 
```
curl -X POST http://localhost:5001/api/parent/create \
-H "Content-Type: application/json" \
-d '{
    "parentName": "parent-2",
    "school": "DPS School",
    "classNum": "1",
    "section": "F",
    "schoolIdCard": "base64 string of id card"
}'
```

3. send all details but different section
```
curl -X POST http://localhost:5001/api/parent/create \
-H "Content-Type: application/json" \
-d '{
    "parentName": "parent-3",
    "school": "DPS School",
    "classNum": "1",
    "section": "A",                 
    "schoolIdCard": "base64 string of id card",
    "address": { 
        "societyCommunity": "Brigade society",
        "city": "indore",
        "state": "Madhyapradesh",
        "country": "India",
        "zipCode": "345678"
    }
}'
```

#### creating post 
```
curl -X POST http://localhost:5001/api/post/create \
-H "Content-Type: application/json" \
-d '{
    "parentId": "",
     "groupId": "",
     "content": {
        "message": "when is annual function"
     }
}'
```

#### creating reply of above post in thread 
```
curl -X POST http://localhost:5001/api/reply/create \
-H "Content-Type: application/json" \
-d '{
    "parentId": "",
    "postId": "",
     "groupId": "",
     "content": {
        "message": "i heard that it is on 13 december"
     }
}'
```

#### create vote  
1. on original post
```
curl -X POST http://localhost:5001/api/vote/create \
-H "Content-Type: application/json" \
-d '{
    "parentId": "",
    "postId": "",
    "groupId": "",
    "voteType": "up"
}'
```

2. on reply of post 
```
curl -X POST http://localhost:5001/api/vote/create \
-H "Content-Type: application/json" \
-d '{
    "parentId": "",
    "postId": "",
    "groupId": "",
    "replyId": "", 
    "voteType": "down"
}'
```

#### kids changing grade 
```
curl -X PUT http://localhost:5001/api/parent/change-groups/<parentId> \
-H "Content-Type: application/json" \
-d '{
    "newClass": "2",
    "newSection": "A"
}'
```

#### create derived group 
```
curl -X POST http://localhost:5001/api/parent/create-derived-group \
-H "Content-Type: application/json" \
-d '{
    "isStandardGroup": false,
    "groupName": "Brigade society, bus-92",
    "members": [""],
    "createdBy": "",
    "relatedTo": ""
}'
```

#### discover groups 
```
curl -X GET http://localhost:5001/api/parent/discover-groups/<_id of parent-2>
```