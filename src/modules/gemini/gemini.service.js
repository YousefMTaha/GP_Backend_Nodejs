import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import geminiHistoryModel from "../../../DB/models/GeminiHistory.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let counter = parseInt(fs.readFileSync("./counter.txt", "utf-8"));

const localhost = "192.168.1.5";

// async function gemini(prompts) {}

async function checkTheHistory(userId, sessionId, newPrompt) {
  let chat = await geminiHistoryModel.findOne({ userId, sessionId });
  if (!chat) {
    chat = await geminiHistoryModel.create({ userId, sessionId });
  }
  return { fullPrompt: mergeAllPrompts(chat.history, newPrompt), chat };
}

function mergeAllPrompts(oldPrompts, newPrompt) {
  const fullPrompt = oldPrompts.map(
    (prompt) => "user:" + prompt.prompt + "\n" + "model:" + prompt.response
  );
  fullPrompt.push(`user:${newPrompt}`);
  fullPrompt.join("\n");

  return fullPrompt;
}

export const testGemini = async (req, res) => {
  do {
    try {
      const { prompt, sessionId } = req.body;

      const { fullPrompt, chat } = await checkTheHistory(1, sessionId, prompt);

      const modelResult = await gemini(fullPrompt);

      await chat.updateOne({
        $push: { history: { prompt, response: modelResult.text() } },
      });

      console.log("usage: ", modelResult.usageMetadata);

      return res.status(200).json({ result: modelResult.text() });
    } catch (error) {
      console.error(error);
    }
  } while (true);
};

// function gemini(userId, sessionId, sttResult) {}

export const Gemini = async (req, res, next) => {
  // do {
  try {
    const { sessionId, prompt } = req.body;
    const genAI = new GoogleGenerativeAI(
      "AIzaSyC8gE0hPvsw2jc2HU7vmWZhsCteFc7aUlE"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { fullPrompt, chat } = await checkTheHistory(1, sessionId, prompt);

    const startDate = new Date();
    console.log(`waiting for Gemini to response at ${startDate}`);
    const modelResult = (await model.generateContent(fullPrompt)).response;

    const endDate = new Date() - startDate;
    console.log(`response at ${new Date(endDate)}`);
    console.log(`took ${endDate / 1000} seconds`);
    console.log(`=======================================================`);
    await chat.updateOne({
      $push: {
        history: { prompt, response: modelResult.text() },
      },
    });

    console.log("usage: ", modelResult.usageMetadata);

    return res.json({ data: modelResult.text() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.toString() });
  }
  // } while (true);
};

export const integrateWithTTS = async (req, res) => {
  try {
    const { text } = req.body;

    const startDate = new Date();
    console.log(`waiting for TTS to response at ${startDate}`);
    const ttsResult = await axios.post(
      `http://${localhost}:5003/tts`,
      {
        text: text || "This for test",
      },
      { responseType: "stream" }
    );
    const endDate = new Date() - startDate;
    console.log(`response at ${new Date(endDate)}`);
    console.log(`took ${endDate / 1000} seconds`);
    console.log(`=======================================================`);

    const audioFolder = __dirname + "/audios";
    if (!fs.existsSync(audioFolder)) {
      fs.mkdirSync(audioFolder);
    }

    const returnedAudioPath = path.join(audioFolder, `${counter}.mp3`);

    const writeStream = fs.createWriteStream(returnedAudioPath);
    fs.writeFileSync("counter.txt", JSON.stringify(++counter));

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="tts-audio-${counter}.wav"`
    );

    ttsResult.data.pipe(res);

    writeStream.on("error", (error) => {
      return res.json({ error: error.message });
    });

    writeStream.on("finish", () => {
      return res.json(`File created on this path ${audioFolder}`);
    });
  } catch (error) {
    console.log(error);

    return res.json({ error: error.message });
  }
};

export const integrateWithSTT = async (req, res, next) => {
  try {
    const audioFilePath = req.file.path;

    const formData = new FormData();
    formData.append("audio", createReadStream(audioFilePath));

    const startDate = new Date();
    console.log(`waiting for STT to response at ${startDate}`);
    const sttResult = await axios.post(`http://${localhost}:5003/stt`, formData);
    const endDate = new Date() - startDate;
    console.log(`response at ${new Date(endDate)}`);
    console.log(`took ${endDate / 1000} seconds`);
    console.log(`=======================================================`);

    req.body.prompt = sttResult.data.text;
    // next();
    console.log(sttResult.data.text)
    return res.json({ data: sttResult.data.text });
  } catch (error) {
    console.log(error);
    return res.json({ error: error.toString() });
  }
};
