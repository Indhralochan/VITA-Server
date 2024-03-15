const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { OpenAIChat } = require('@axflow/models/openai/chat');
const FormData = require('form-data');
const bodyParser = require('body-parser');
const OpenAI = require ("openai");
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const model = "whisper-1";
const { execSync } = require('child_process');
const cors = require('cors');
const ytdl = require('ytdl-core');
const base64 = require('base64-js');
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


app.post('/transcribe', (req, res) => {
  const youtubeUrl = req.body.youtubeUrl;
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'Missing youtubeUrl in the request body' });
  }
  downloadYouTubeVideo(youtubeUrl, (filePath) => {
    if (!filePath) {
      return res.status(500).json({ error: 'Failed to download the YouTube video' });
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
        res.json(transcriptionData);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to transcribe audio' });
      });
  });
});
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

// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

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

// function getLastUserMessageContent(messages) {
//   for (let i = messages.length - 1; i >= 0; i--) {
//     if (messages[i].role === "user") {
//       return messages[i].content;
//     }
//   }
//   return null;
// }


// app.post('/chat', async (req, res) => {
//   const { messages , context , url } = req.body;
//   console.log('messages', messages);
//   console.log('context', context);
//   console.log('url', url);
// //   const embedder = new OpenAIEmbedder({ apiKey: process.env.OPENAI_API_KEY });
// //   const pinecone = new Pinecone({
// //     index: 'vite',
// //     namespace: 'default',
// //     environment: 'gcp-starter',
// //     apiKey: process.env.PINECONE_API_KEY,
// //   });
// //   const allMessagesContent = messages.map(msg => msg.content).join(' ');
// //   const combinedContext = `${text} ${allMessagesContent}`;
// //   const template = `Context information is below.
// // ---------------------
// // ${combinedContext}
// // ---------------------
// // Given the context information and not prior knowledge, answer the question: {query}
// // `;
// let query = getLastUserMessageContent(messages);
//   let combinedContext = messages+context ;
//   const template = `Context information is below.
//   ---------------------
//   ${combinedContext}
//   ---------------------
//   Given the context information and not prior knowledge, answer the question: ${query}
//   `;
//   const stream = await OpenAIChat.streamTokens(
//     {
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: template}],
//     },
//     {
//       apiKey: process.env.OPENAI_API_KEY,
//     }
//   );
//   return new StreamingJsonResponse(stream);

// // const rag = new RAG({
// //   embedder: embedder,
// //   model: new OpenAICompletion({
// //     model: 'gpt-3.5-turbo-instruct',
// //     max_tokens: 256,
// //     apiKey: process.env.OPENAI_API_KEY,
// //   }),
// //   prompt: new PromptWithContext({ template }),
// //   retriever: new Retriever({ store: pinecone, topK: 3 }),
// // });
// // const query = getLastUserMessageContent(messages);
// // const { result, info } = rag.stream(
// //   query,
// // );
// // let val='';
// // for await (const chunk of result) {
// //   val+=chunk;
// // }
// // console.log(val)
// // return val;
// });

// const generateImg = async (tikzCode) => {
//   const filename = `temp_${Date.now()}.tex`;

//   fs.writeFileSync(filename, tikzCode);

//   try {
//     execSync(`pdflatex -halt-on-error ${filename}`);

//     // Using pdfimages to convert PDF to images
//     execSync(`pdfimages -svg ${filename.replace('.tex', '.pdf')} ${filename.replace('.tex', '')}`);

//     const svg = fs.readFileSync(filename.replace('.tex', '-000.svg'), 'utf-8');
//     return svg;
//   } catch (error) {
//     console.error('Error rendering TikZ:', error.message);
//     res.status(500).send({ error: 'Error rendering TikZ diagram.' });
//   } finally {
//     fs.unlinkSync(filename);
//     fs.unlinkSync(filename.replace('.tex', '.pdf'));
//     // Remove all generated image files by pdfimages
//     fs.readdirSync('.').forEach(file => {
//       if (file.startsWith(filename.replace('.tex', ''))) {
//         fs.unlinkSync(file);
//       }
//     });
//   }
// };

// app.post('/answergenerate',async(req,res)=>{
//   const {context , query , marks , format} = req.body;
//   let content=''
//   let imagesdata =''
//   let answer = "";
//   try { 
//         const response = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [{ role: "user", content: `You are a writing assistant which takes the inputs such as question= question on which we you need to generate an answer , context= context from which some relevant information for generating the answer can be found. format=format of the answer can be para or points marks= lenght of the answer depending upon the marks 15 marks = nearly 500 words 10 marks = 400 words 5 marks = 150-200 words 3 marks = 100 words 2 marks = 50 words.general format you need to maintain is that we have headings , subheading may it be with para of points based on the input format.
//             output: generate an answer based on the input and also generate instructions for generting flow chart on relevant information of the question and answer seperate the flow chart  information with flowchartImageContent word. and strictly do not generate any content other than the answer and the flowchartImageContent . if context is present try checking if its context is universal fact. it its false use the correct fact for answer generation.
//             context=${context} , question=${query} , marks=${marks} , format = ${format}
//             ` }],
//         });
//         answer = response.choices[0].message.content;
//         console.log('answer', answer);
//         answer,imagesdata = answer.split('flowchartImageContent')
// } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Internal Server Error");
// }
// let image=''
// try{
//  image = await openai.images.generate({ model: "dall-e-3", prompt: `flow chart of ${imagesdata}`,response_format: "url"
// });
// }
// catch(err){
//   console.log(err);
// }
// res.status(200).json({ "answer":answer , "imagesUrls":image });

// try { 
//   let tags = "";
//       const response = await openai.chat.completions.create({
//           model: "gpt-3.5-turbo",
//           messages: [{ role: "user", content: `you are a master latex code writer.generate a flow chart with shapes that illustrates the following data in a flowchart format input = ${imagesdata} . output = only generte latex code for the input and strictly no other content and adhere to proper formatting.
//           ` }],
//       });
//       tags = response.choices[0].message.content;
//       console.log('tags', tags);
//       content= tags
//       const svgImg = await generateImg(content);
//       // const encodedLatex = base64.fromByteArray(Buffer.from(content, 'utf8'));
//       res.status(200).json({ "answer":answer , "imagesUrls":svgImg });
// } catch (error) {
//   console.error("Error:", error);
// }

// })
// async function searchImage(query) {
//   const endpoint = 'https://api.unsplash.com/search/photos';

//   const accessKey = process.env.UNSPLASH_API_KEY;

//   const params = new URLSearchParams({
//       query: query,
//       per_page: '1',
//       orientation: 'squarish',
//       client_id: accessKey,
//   });

//   try {
//       const response = await fetch(`${endpoint}?${params}`);

//       if (response.ok) {
//           const data = await response.json();
//           const imageUrl = data.results[0].urls.regular;
//           return imageUrl;
//       }
//   } catch (error) {
//       console.error('Error occurred:', error);
//       return 'image not found';
//   }
// }

app.post('/answergenerate', async (req, res) => {
  const { context, query, marks, format } = req.body;
  let answer = "";
  let answerdata = "";
  let imagesdata = "";
  try {
      const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: `You are a writing assistant which takes the inputs such as question= question on which we you need to generate an answer , context= context from which some relevant information for generating the answer can be found. format=format of the answer can be para or points marks= lenght of the answer depending upon the marks 15 marks = nearly 500 words 10 marks = 400 words 5 marks = 150-200 words 3 marks = 100 words 2 marks = 50 words.general format you need to maintain is that we have headings , subheading may it be with para of points based on the input format.
            output: generate an answer based on the input and also generate instructions for generting flow chart on relevant information of the question and answer seperate the flow chart  information with flowchartImageContent word. and strictly do not generate any content other than the answer and the flowchartImageContent . if context is present try checking if its context is universal fact. it its false use the correct fact for answer generation.
            context=${context} , question=${query} , marks=${marks} , format = ${format}
            ` }],
      });
      answer = response.choices[0].message.content;
      console.log('answer', answer);
      answer,imagesdata = answer.split('flowchartImageContent')
      const responseanother = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
            role: "user",
            content: ```you are a master at Mermaid
            Diagramming and charting tool i want you to generate beautiful and useful mermaid flowcharts code based on the given input ${imagesdata} and strictly do not generate any other content and donnot give any title like mermaid etc only generate the code and format it accordingly with \n for new lines and so on.`
        }],
    });
    answerdata = responseanother.choices[0].message.content;
  //     imageUrls = await openai.images.generate({
  //         model: "dall-e-3",
  //         prompt: `flow chart of ${answerdata} the text is to be included in the images.`,
  //         response_format: "url"
  //     });

  } catch (error) {
      console.error("Error:", error);
      return res.status(500).send("Internal Server Error");
  }

  res.status(200).json({ "answer": answer, "imagesUrls": answerdata });
});

module.exports = app;
