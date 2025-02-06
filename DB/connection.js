import mongoose from "mongoose";

async function connectDB() {
  await mongoose
    .connect("mongodb+srv://tyousef262:pFRnRyJt4BhXXsRA@cluster0.cwz5mhe.mongodb.net/Gemini")
    .then(() => console.log("DB connected"))
    .catch((err) => console.log(`Db err..... ${err}`));
}

export default connectDB;
