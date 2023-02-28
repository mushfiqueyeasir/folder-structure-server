const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();

var ObjectId = require("mongodb").ObjectId;

//middleware
app.use(cors());
app.use(express.json());

//connect mongodb

console.log(process.env.DB_Connect)

mongoose
  .connect(process.env.DB_Connect,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("DB is connected");
  });


const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    children: [
      {
        name: {
          type: String,
          required: true,
        },
      },
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
      },
    ],
  },
  { timestamps: true }
);


const Folder = mongoose.model("Folder", folderSchema);

app.get("/", (req, res) => {
  res.send("connected");
});

app.get("/folders", async (req, res) => {
  try {
    const folder = await Folder.find();
    res.json(folder[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/folders/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const folder = await Folder.findById(id);
    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/folders", async (req, res) => {
  try {

    const { itemId, parentId } = req.body;

    const parentFolder = await Folder.findById(parentId);
    parentFolder.children = parentFolder.children.filter(
      (item) => String(item._id) !== String(itemId)
    );
    await parentFolder.save();

    const folder = await Folder.findByIdAndDelete(itemId);

    res.json(folder);
  } catch (error) {
    // Return an error response
    res.status(400).json({ message: error.message });
  }
});

app.post("/folders", async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = new Folder({ name });
    if (parentId) {
      const parentFolder = await Folder.findById(parentId);
      if (!parentFolder) {
        throw new Error("Parent folder not found");
      }
      folder.parent = parentFolder._id;
      parentFolder.children.push({ name: name, _id: folder._id });
      await parentFolder.save();
    }

    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const port = 5000;

app.listen(port, () => {
  console.log("Database Is listening at port:", port);
});