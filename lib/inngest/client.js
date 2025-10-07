import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "koshi", 
  name: "Koshi",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});
