import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFormattedDate = () => DateTime.now().toISO({ suppressMilliseconds: true });

const kebabCase = str =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export async function main() {

  const client = new OpenAI({
    baseURL: "https://models.github.ai/inference",
    apiKey: process.env.GITHUB_TOKEN
  });

  const response = await client.chat.completions.create({
    messages: [
      { role: "developer", content: "You work on trivia-generating (in Bahasa Indonesia) agency for people in indonesia especially parents." },
      { role:"user", content: `
        You work on trivia - generating( in Bahasa Indonesia) agency for people in indonesia especially parents.

        PROMPT START

        I want you to make no more than 500 words content in Bahasa Indonesia, its like trivia, facts, about financial and law for education purpose, keep the language simple and relatable. To help people in indonesia especially parents. Make it fun, engaging with emoji, and markdown style.

        Isinya trivia harus memuat satu-satu dari hal dibawah ini. 
        Fakta menarik
        Apa artinya?
        Contoh 
        Kenapa penting untuk orang tua?

        Format the pragrapghs in markdown ready style.

        Create light non - cheesy moral message of the story(max 2 sentences).Don 't force the moral messages in story paragraph.
        Create trivia hook with curiosity hooking question(max 2 sentences) for trivia overview.Lets call it summary.
        Create list of keywords for good vocabulary enriching.

        Use Output Format: JSON {title: string,summary: string,moral: string,paragraphs: string[],keywords: string[5 - 10 words]}
        Just give me the JSON oputput without any additional answers.

        PROMPT END 
        ` }
    ],
    model: "openai/gpt-4.1-nano",
    response_format: {
      type: "json_object"
    }
  });

  const source = JSON.parse(response.choices[0].message.content);
  source.date = getFormattedDate()
  source.draft = false

  // Generate filename
  const timestamp = Math.floor(Date.now() / 1000);
  const filename = `${timestamp}-${kebabCase(source.title)}.md`;

  // Split sentences and join with newlines
  const sentenceSplit = paragraph =>
    paragraph.match(/[^.!?]+[.!?]+["”]?/g) || [paragraph];

  const paragraphText = source.paragraphs
    .map(p => sentenceSplit(p).join('\n'))
    .join('\n\n');

  // Create file content
  const fileContent =
    JSON.stringify(source, null, 2) + '\n\n' + paragraphText;

  // Write to file
  // Target path: one level up from __dirname, then content/post
  const outputPath = path.join(__dirname, '..', 'content', 'posts');

  // Ensure the folder exists
  fs.mkdirSync(outputPath, { recursive: true });

  // Write the file
  fs.writeFileSync(path.join(outputPath, filename), fileContent, 'utf8');

  console.log(`File created: ${filename}`);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
