require('dotenv').config(); 
const OpenAI = require('openai'); 
const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/+$/, ''); 
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT; 
const baseURL = `${endpoint}/openai/deployments/${deployment}`; 
const c = new OpenAI({ apiKey: process.env.AZURE_OPENAI_API_KEY, baseURL, defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview' }, defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY } }); 
(async () => { 
    const r = await c.chat.completions.create( 
        { model: process.env.AZURE_OPENAI_DEPLOYMENT, 
            messages: [{ role: 'user', content: 'Joyce' }] 
        }); 
    console.log(r.choices[0].message); })() 