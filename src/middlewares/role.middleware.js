export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.account || !roles.includes(req.account.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};