import express from "express";
import multer, { diskStorage } from "multer";
import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// Get the current file path and directory in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import fs from "fs";

const app = express();
const upload = multer({ storage: diskStorage({}) });

let counter = parseInt(fs.readFileSync("./counter.txt", "utf-8"));

app.post("/intgerate-models", upload.single("audio"), async (req, res) => {
  try {
    const audioFilePath = req.file.path;

    const formData = new FormData();
    formData.append("audio", createReadStream(audioFilePath));

    const sttResult = await axios.post("http://localhost:5001/stt", formData);

    const ttsResult = await axios.post(
      "http://localhost:5002/tts",
      {
        text: sttResult.data.text,
      },
      { responseType: "stream" }
    );

    const returnedAudioPath = path.join(__dirname, `${counter}.mp3`);

    const writeStream = fs.createWriteStream(returnedAudioPath);
    fs.writeFileSync("counter.txt", JSON.stringify(++counter));

    ttsResult.data.pipe(writeStream);

    writeStream.on("error", (error) => {
      return res.json({ error: error.message });
    });

    writeStream.on("finish", () => {
      return res.json("file created");
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Node.js server is running on port 3000");
});
