const express = require("express");
const cors = require("cors");

const ParentRoutes = require("./routes/parentRoutes");
const PostRoutes = require("./routes/postRoutes");
const replyRoutes = require("./routes/replyRoutes");
const voteRoutes = require("./routes/voteRoutes");

const connectDb = require("./config/connectDb");

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

connectDb();

app.get("/", (req, res) => {
  res.send("Hello World!");
}); 

app.use('/api/parent', ParentRoutes);
app.use('/api/post', PostRoutes);
app.use('/api/reply', replyRoutes);
app.use('/api/vote', voteRoutes);

app.listen(port, () => {
  console.log(`Kids-Social backend listening on port ${port}`);
});