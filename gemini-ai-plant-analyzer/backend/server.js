const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({limit:"10mb"}));

app.get("/", (req,res) => res.json({message:"Gemini Plant Analyzer API is running"}));

app.post("/api/analyze", async (req,res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) return res.status(400).json({message:"Image is required"});
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({message:"GEMINI_API_KEY is not configured"});

    const prompt = `You are an expert botanist and plant health specialist.
Analyze the uploaded plant image. Return ONLY valid JSON using this exact structure:
{
  "plantName":"",
  "scientificName":"",
  "healthScore":0,
  "healthStatus":"",
  "disease":"",
  "sunlight":"",
  "watering":"",
  "temperature":"",
  "soil":"",
  "causes":[],
  "treatment":[],
  "careTips":[],
  "warning":""
}
Rules: identify the plant if possible; healthScore must be 0-100; identify only visible or reasonably supported problems; explain possible causes; give practical treatment, watering, sunlight, soil and temperature advice; mention uncertainty when image quality prevents confidence.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          contents:[{parts:[
            {text:prompt},
            {inline_data:{mime_type:mimeType,data:image}}
          ]}],
          generationConfig:{temperature:0.2,responseMimeType:"application/json"}
        })
      }
    );

    const raw = await response.text();
    if (!response.ok) return res.status(response.status).json({message:"Gemini API request failed",details:raw});

    const data = JSON.parse(raw);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({message:"No analysis returned by Gemini"});

    let cleaned = text.replace(/```json/gi,"").replace(/```/g,"").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end >= 0) cleaned = cleaned.slice(start,end+1);

    res.json(JSON.parse(cleaned));
  } catch(err) {
    console.error(err);
    res.status(500).json({message:"Analysis failed",error:err.message});
  }
});

app.listen(PORT,()=>console.log(`Plant Analyzer API running at http://localhost:${PORT}`));
