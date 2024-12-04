import { load } from "cheerio";
const URL = "https://www.jacksonxc.org/trail-report";
async function readTrailReport() {
  const response = await fetch(URL);
  const trailReport = await response.text();
  const $ = load(trailReport);

  const reportBody = $("section.av_textblock_section");
  const reportText = reportBody.text();
  const usableText = reportText.split("Season passes")[0];

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
