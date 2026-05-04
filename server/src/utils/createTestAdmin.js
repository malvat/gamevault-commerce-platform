import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const email = "admin@test.com";
const password = "Admin123!";

await mongoose.connect(process.env.MONGO_URI);

const existingUser = await User.findOne({ email });

if (existingUser) {
  existingUser.name = "Test Admin";
  existingUser.password = password;
  existingUser.role = "admin";
  await existingUser.save();
  console.log(`Updated test admin: ${email}`);
} else {
  await User.create({
    name: "Test Admin",
    email,
    password,
    role: "admin"
  });
  console.log(`Created test admin: ${email}`);
}

await mongoose.disconnect();
