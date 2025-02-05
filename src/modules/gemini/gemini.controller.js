import { Router } from "express";
import upload from "../../utils/multer.js";
import {
  Gemini,
  integrateWithSTT,
  integrateWithTTS,
} from "./gemini.service.js";

const geminiController = Router();

geminiController.post(
  "/integrate-models",
  upload.single("audio"),
  integrateWithSTT,
  Gemini,
  integrateWithTTS
);

export default geminiController;
