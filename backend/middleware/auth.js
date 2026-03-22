const jwt = require("jsonwebtoken");
const User = require("../Models/user");

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "SUPER_SECRET_KEY",
    );

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ message: "User no longer exists." });

    req.user = decoded; // id, username, isAdmin
    next();
  } catch {
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = auth;
