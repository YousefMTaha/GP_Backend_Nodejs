import express from "express";
import connectDB from "./DB/connection.js";
import geminiController from "./src/modules/Gemini/gemini.controller.js";
const app = express();
const port = 3001;

await connectDB();
app.use(express.json());

app.use("/api/v1/gemini", geminiController);

app.all("*", (req, res) => {
  return res.status(404).send("invalid Method or url");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
