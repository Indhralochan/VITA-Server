const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const bodyParser = require('body-parser');
const OpenAI = require ("openai");
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const model = "whisper-1";
const cors = require('cors');
const ytdl = require('ytdl-core');
const fileUpload = require('express-fileupload');
// Use bodyParser middleware to parse JSON in the request body
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

console.log('OPENAI_API_KEY', OPENAI_API_KEY);
const openai = new OpenAI(OPENAI_API_KEY);


const temp = async () => {
  try{
const text = `Here are the liberal news media avengers, or should I say circle jerk avengers, are having an immense and beautiful meltdown on Donald Trump's landslide victory in Iowa last night. And I feel like I can speak for a lot of republicans, but I am waiting for the moment Trump wins again so they can have another major meltdown.`;
const response = await axios.post("https://api-inference.huggingface.co/models/Falconsai/text_summarization", {"inputs": text}, {
      headers: { Authorization: "Bearer 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",
     },
  });
} catch (error) {
}
};
 temp();

const downloadYouTubeVideo = (url, callback) => {
  const videoStream = ytdl(url, { quality: 'highestaudio' });

  const filePath = path.join(__dirname, 'downloads', 'video.mp3');
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const fileStream = fs.createWriteStream(filePath);
  videoStream.on('error', (error) => {
    console.error(`Error downloading video: ${error}`);
    callback(null);
  });
  videoStream.pipe(fileStream);
  fileStream.on('finish', () => {
    callback(filePath);
  });

  fileStream.on('error', (error) => {
    console.error(`Error writing video file: ${error}`);
    callback(null);
  });
};

// app.post('/transcribe', (req, res) => {
//   const youtubeUrl = req.body.youtubeUrl;
//   if (!youtubeUrl) {
//     return res.status(400).json({ error: 'Missing youtubeUrl in the request body' });
//   }
//   downloadYouTubeVideo(youtubeUrl, (filePath) => {
//     if (!filePath) {
//       return res.status(500).json({ error: 'Failed to download the YouTube video' });
//     }
//     const formData = new FormData();
//     formData.append("model", model);
//     formData.append("file", fs.createReadStream(filePath));
//     axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
//       headers: {
//         "Authorization": `Bearer ${OPENAI_API_KEY}`,
//         ...formData.getHeaders(),
//       },
//     })
//       .then((response) => {
//         const transcriptionData = response.data;
//         console.log(transcriptionData); // Get the data from the response
//         res.json(transcriptionData);
//       })
//       .catch((err) => {
//         console.error(err);
//         res.status(500).json({ error: 'Failed to transcribe audio' });
//       });
//   });
// });
const transcribeAudio = (url) => {
  return new Promise((resolve, reject) => {
    const youtubeUrl = url;
    if (!youtubeUrl) {
      reject({ error: 'Missing youtubeUrl in the request body' });
    }
    downloadYouTubeVideo(youtubeUrl, (filePath) => {
      if (!filePath) {
        reject({ error: 'Failed to download the YouTube video' });
      }
      const formData = new FormData();
      formData.append("model", model);
      formData.append("file", fs.createReadStream(filePath));
      axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
      })
        .then((response) => {
          const transcriptionData = response.data;
          console.log(transcriptionData); // Get the data from the response
          resolve(transcriptionData);
        })
        .catch((err) => {
          console.error(err);
          reject({ error: 'Failed to transcribe audio' });
        });
    });
  });
};

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const uploadedFile = req.files.file;
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, uploadedFile.name);
  uploadedFile.mv(filePath, (err) => {
    if (err) {
      console.error('Error saving file:', err);
      return res.status(500).json({ error: 'Failed to save file' });
    }
    res.status(200).json({ message: 'File uploaded successfully', filePath });
  });
});

app.post('/generate', async(req, res) => {
  const link = req.body.link;
  const prompt = req.body.prompt;
  const format = req.body.format;
  console.log('link', link);
  console.log('prompt', prompt);
  console.log('format', format);
  if(!link || !prompt || !format) {
    return res.status(320).json({ error: 'Missing link, prompt, or format in the request body' });
  }
  console.log('link', link);
  console.log('prompt', prompt);
  console.log('format', format);
  const text = await transcribeAudio(link);
  const payload = {
    link: link,
    text: text.text,
  };
  res.status(200).json({ message: 'File uploaded successfully', payload }); 
});

app.post('/summarize', async (req, res) => {
    const text = req.body.text;
    console.log('text', text);
    const length = req.body.length; 
    const points = req.body.points;
    console.log('length', length);
    console.log('points', points);
    try { 
      let summary = "";
          const response = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: `You are a writing assistant which takes the needed summarizes the text correctly crisply and also fact checks universal truths for the text special instructions write summary using following instructions length of the summary is ${length} and in ${points} format. text is ${text} remember that short is 50-100 words at maximum medium is 100-150 words at maximum and lengthy is 150 words at minimum and 250 at maximum. you strictly need to add '\n' after each line if the summary is in points.` }],
          });
          summary = response.choices[0].message.content;
          console.log('summary', summary);
      res.status(200).json({ summary });
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
