// A safer server-side API route for OpenAI calls
// This file would typically be in a Next.js or Express backend
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Server-side environment variable
});
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { prompt, maxTokens = 500, temperature = 0.7, model = 'gpt-3.5-turbo' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    });
    return res.status(200).json({
      content: response.choices[0]?.message?.content || 'No response generated',
      isError: false
    });
  } catch (error: any) {
    return res.status(500).json({
      content: '',
      isError: true,
      errorMessage: error.message || 'Unknown error occurred'
    });
  }
}
/*
NOTE: For this implementation to work, you would need:
1. A backend framework like Next.js or Express
2. The OpenAI API key in server-side environment variables
3. To update the frontend to call this API endpoint instead of OpenAI directly
This is a safer approach as it:
- Keeps your API key secure on the server
- Provides a centralized place for monitoring and rate limiting
- Allows you to add additional security and validation
*/
