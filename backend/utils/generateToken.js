const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET || "SUPER_SECRET_KEY",
    { expiresIn: "7d" }
  );
};

module.exports = generateToken;
