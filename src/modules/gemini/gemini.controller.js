import { Router } from "express";
import upload from "../../utils/multer.js";
import {
  Gemini,
  integrateWithSTT,
  integrateWithTTS,
} from "./gemini.service.js";

const geminiController = Router();

geminiController.post(
  "/voice-text",
  upload.single("audio"),
  integrateWithSTT,
  Gemini
);

geminiController.post("/text-text", Gemini);
geminiController.post("/text-voice",integrateWithTTS);

export default geminiController;
