const Contact = require("../Models/contact");

exports.sendMessage = async (req, res) => {
  const { name, email, contactNo, message } = req.body;

  if (!name || !email || !contactNo || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newMessage = new Contact({ name, email, contactNo, message });
  await newMessage.save();

  res.status(201).json({ message: "Message sent successfully" });
};

exports.getAllMessages = async (req, res) => {
  const messages = await Contact.find().sort({ createdAt: -1 });
  res.json(messages);
};

exports.deleteMessage = async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
};

exports.updateReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const updatedMessage = await Contact.findByIdAndUpdate(
      id,
      { read },
      { new: true },
    );

    res.json(updatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
