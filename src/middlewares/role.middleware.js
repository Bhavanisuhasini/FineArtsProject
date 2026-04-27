export const allowRoles = (...roles) => {
  return (req, res, next) => {
    const hasRole = req.roles.some(r => roles.includes(r));

    if (!hasRole) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};