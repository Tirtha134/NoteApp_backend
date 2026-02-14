import express from "express";
import Note from "../models/Note.js";
import authMiddleware from "../middleware/middleware.js";

const router = express.Router();

// ✅ Add Note
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ success: false, message: "Title and description required" });

    const newNote = await Note.create({ title: title.trim(), description: description.trim(), userId: req.user._id });
    res.status(201).json({ success: true, message: "Note added successfully", note: newNote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error while adding note" });
  }
});

// ✅ Get Notes
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Notes fetched successfully", notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Can't retrieve notes" });
  }
});

// ✅ Update Note
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ success: false, message: "Title and description cannot be empty" });

    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title: title.trim(), description: description.trim() },
      { new: true }
    );

    if (!updatedNote) return res.status(404).json({ success: false, message: "Note not found" });
    res.status(200).json({ success: true, message: "Note updated successfully", note: updatedNote });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating note" });
  }
});

// ✅ Delete Note
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deletedNote) return res.status(404).json({ success: false, message: "Note not found" });
    res.status(200).json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting note" });
  }
});

export default router;
