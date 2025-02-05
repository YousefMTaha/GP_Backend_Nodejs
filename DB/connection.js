import mongoose from "mongoose";

async function connectDB() {
  await mongoose
    .connect("mongodb://localhost:27017/Gemini")
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(`Db err..... ${err}`));
}

export default connectDB;
