import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("Admin@123", 10);
console.log(hash);