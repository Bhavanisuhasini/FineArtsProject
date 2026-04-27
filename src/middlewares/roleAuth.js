export const roleAuth = (...roles) => {
  return (req, res, next) => {
    if (!req.account) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.account.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};