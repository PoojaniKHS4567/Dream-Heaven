const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "SUPER_SECRET_KEY"
    );
    req.user = decoded; // id, username, isAdmin
    next();
  } catch {
    res.status(400).json({ message: "Invalid token." });
  }
};

module.exports = auth;
