import { model, Schema } from "mongoose";

const geminiHistoryModel = model(
  "Gemini-history",
  new Schema(
    {
      userId: Number,
      sessionId: Number,
      history: [{ prompt: String, response: String }],
    },
    { timestamps: { createdAt: true } }
  )
);

export default geminiHistoryModel;
