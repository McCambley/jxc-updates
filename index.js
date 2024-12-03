import { load } from "cheerio";
const URL = "https://www.jacksonxc.org/trail-report";
async function readTrailReport() {
  const response = await fetch(URL);
  const trailReport = await response.text();
  const $ = load(trailReport);

  const reportBody = $("section.av_textblock_section");
  const reportText = reportBody.text();

  console.log(reportBody.text());

  // TODO
  // Summarize report text with OpenAI API
  // Read grooming report PDF
  // Summarize PDF with OpenAI API
  // Send text update via Twilio
  // Refactor this to work as GCF or Lambda Function
}

readTrailReport();
