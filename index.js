// @ts-check
import { load } from "cheerio";
import OpenAI from "openai";
import "dotenv/config";

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey });

/**
 *
 * @param {string} text
 */
async function summarizeText(text) {
  const completion = await openai.chat.completions.create({
    // model: "gpt-4o",
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Translate the input into a concise, user-friendly text message for skiers. The message should include essential details such as trail conditions, grooming updates, special notes, and any relevant instructions or policies. Ensure the tone is clear, friendly, and professional. The message must not exceed 500 characters. Prioritize clarity and brevity. Sign off as SkiBot.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  console.log(completion.choices[0].message);
}

const URL = "https://www.jacksonxc.org/trail-report";
async function readTrailReport() {
  const response = await fetch(URL);
  const trailReport = await response.text();
  const $ = load(trailReport);

  const reportBody = $("section.av_textblock_section");
  const reportText = reportBody.text();
  const usableText = reportText.split("Season passes")[0];

  await summarizeText(usableText);

  console.log(usableText);

  // TODO
  // Summarize report text with OpenAI API
  // PROMPT: "Translate the input into a concise, user-friendly text message for skiers. The message should include essential details such as trail conditions, grooming updates, special notes, and any relevant instructions or policies. Ensure the tone is clear, friendly, and professional. The message must not exceed 160 characters. Prioritize clarity and brevity."
  // EXAMPLE RESPONSE: Boggy & Quail groomed for classic/skate. Fun loop test groomed in Village; more soon! $15 tickets. No dogs/walking on Wave. Carpool/park in permitted spots.
  // Read grooming report PDF
  // Summarize PDF with OpenAI API
  // Send text update via Twilio
  // Refactor this to work as GCF or Lambda Function
}

readTrailReport();
