import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const generateAns = async (url, apiKey, model, chatLog, selectedCharacter) => {
  const openai = new OpenAI({
    apiKey,
    baseURL: url,
  });

  const preludeMessagesDict = {
    'CodingExpert': [
      { role: 'system', content: "在接下來的對話中，請不要忘記以下設定：你是一個寫程式的專家，請用繁體中文給提問者解決程式中的錯誤，並給出範例。程式範例請使用<pre><code><code/><pre/>包裹起來，以便我進行特殊處理。" },
      { role: 'assistant', content: "你好我是程式碼專家，請問有什麼需要幫忙的嗎？" },
      { role: 'user', content: `print("Hello world')` },
      { role: 'assistant', content: "在你的程式碼中有一個錯誤：引號沒有正確配對。請將引號正確配對即可解決問題。以下是修正後的程式碼範例：<pre><code>print('Hello world')<code/><pre/>" }
    ],
  };

  const preludeMessages = preludeMessagesDict[selectedCharacter] || [];
  const messages = preludeMessages.concat(chatLog);
  
  // 附加提示信息
  if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
    messages[messages.length - 1].content += '\n若是有代碼範例，請把每段代碼分別用<pre><code><code/><pre/>包裹起來';
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 2000,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error occurred:', error);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let { chatLog, selectedCharacter, model } = req.body;

    let url;
    let apiKey = "your api";

    if (model === 'Llama3-8B') {
      url = 'http://192.168.194.39:8000/v1/';
      apiKey = 'sk-no-key-required'; // llama3 不需要 API key
    } else if(model === 'GPT3.5'){
      model = 'gpt-3.5-turbo-0125';
      url = 'https://api.openai.com/v1/';
    }
    else if(model === 'GPT4'){
      model = 'gpt-4o';
      url = 'https://api.openai.com/v1/';
    }

    const airesponse = await generateAns(url, apiKey, model, chatLog, selectedCharacter);
    if (airesponse) {
      res.status(200).json({ airesponse });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
