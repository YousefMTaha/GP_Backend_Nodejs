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

async function gemini(prompts) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

  return (await model.generateContent(prompts)).response;
}

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

export const Gemini = async (req, res, next) => {
  do {
    try {
      const { sttResult } = req;
      const { sessionId } = req.body;

      const { fullPrompt, chat } = await checkTheHistory(
        1,
        sessionId,
        sttResult
      );

      const modelResult = await gemini(fullPrompt);

      await chat.updateOne({
        $push: { history: { prompt, response: modelResult.text() } },
      });

      console.log("usage: ", modelResult.usageMetadata);

      req.geminiResult = modelResult.text();
      next();
    } catch (error) {
      console.error(error);
    }
  } while (true);
};

export const integrateWithTTS = async (req, res) => {
  try {
    const { geminiResult } = req;

    const ttsResult = await axios.post(
      "http://localhost:5003/tts",
      {
        text: geminiResult,
      },
      { responseType: "stream" }
    );

    const audioFolder = __dirname + "/audios";
    if (!fs.existsSync(audioFolder)) {
      fs.mkdirSync(audioFolder);
    }

    const returnedAudioPath = path.join(audioFolder, `${counter}.mp3`);

    const writeStream = fs.createWriteStream(returnedAudioPath);
    fs.writeFileSync("counter.txt", JSON.stringify(++counter));

    ttsResult.data.pipe(writeStream);

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

    const sttResult = await axios.post("http://localhost:5003/stt", formData);
    req.sttResult = sttResult;
    next();
  } catch (error) {
    console.log(error);
    return res.json({ error: error.toString() });
  }
};
