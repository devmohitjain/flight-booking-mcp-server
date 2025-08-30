// // import OpenAI from "openai";
// require('dotenv').config();
// const OpenAI = require('openai');

// const apiKey = process.env.OPENAI_API_KEY;
// // const apiKey = "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";
// if (!apiKey) {
//   console.error('Missing OPENAI_API_KEY environment variable.');
//   process.exit(1);
// }

// const client = new OpenAI({ apiKey });

// async function bedTime() {
//   try {
//     const response = await client.responses.create({
//       model: "gpt-4o-mini",
//       input: "Write a short bedtime story about a unicorn.",
//     });
//     console.log(response.output_text);
//   } catch (error) {
//     console.error('Failed to generate bedtime story:', error.message || error);
//     process.exitCode = 1;
//   }
// }

// bedTime();

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();