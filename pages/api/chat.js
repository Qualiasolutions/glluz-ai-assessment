import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    res.status(200).json({ 
      response: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
    } else if (error.status === 401) {
      res.status(401).json({ error: 'Invalid API key. Please check your OpenAI API configuration.' });
    } else {
      res.status(500).json({ error: 'Failed to generate response. Please try again.' });
    }
  }
}