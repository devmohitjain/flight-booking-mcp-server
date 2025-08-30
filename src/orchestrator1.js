// orchestrator.js
require('dotenv').config();
const OpenAI = require('openai');
const tools = require('./tools');
const prompt = require('./prompt')

// Configure client for either Azure OpenAI or OpenAI

const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/+$/, ''); 
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT; 
const baseURL = `${endpoint}/openai/deployments/${deployment}`; 
console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY);
const c = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY, 
    baseURL, 
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview' }, 
    defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY } });


// function createClient() {
//     const {
//         AZURE_OPENAI_API_KEY,
//         AZURE_OPENAI_ENDPOINT,
//         AZURE_OPENAI_DEPLOYMENT,
//         AZURE_OPENAI_API_VERSION,
//         OPENAI_API_KEY,
//     } = process.env;

//     // Prefer Azure configuration if present
//     if (AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT) {
//         return new OpenAI({
//             apiKey: AZURE_OPENAI_API_KEY,
//             baseURL: `${AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}`,
//             defaultQuery: { 'api-version': AZURE_OPENAI_API_VERSION || '2024-10-01-preview' },
//             defaultHeaders: { 'api-key': AZURE_OPENAI_API_KEY },
//         });
//     }

//     // Fallback to standard OpenAI
//     if (OPENAI_API_KEY) {
//         return new OpenAI({ apiKey: OPENAI_API_KEY });
//     }

//     throw new Error('Missing API configuration. Set Azure envs or OPENAI_API_KEY.');
// }

// const openai = createClient();

// The address of your running MCP server
const MCP_SERVER_URL = 'http://localhost:3000/mcp-api/v1/tool_dispatch';

// This is the main logic loop
async function askAI(userQuery) {
    console.log(`\n👤 User: ${userQuery}`);

    const messages = [{ role: 'user', content: userQuery }];

    // --- First call to the LLM to see if a tool is needed ---
    const modelName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

    const firstResponse = await c.chat.completions.create({
        model: modelName,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
    });

    const responseMessage = firstResponse.choices[0].message;
    messages.push(responseMessage); // Add the AI's response to the conversation history

    // Check if the LLM wants to call a tool
    if (responseMessage.tool_calls) {
        console.log('🤖 AI wants to call a tool...');

        // In a real app, you might have multiple tool calls to handle
        const toolCall = responseMessage.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`   - Tool: ${toolName}`);
        console.log(`   - Arguments: ${JSON.stringify(toolArgs)}`);
        
        // --- Call your local MCP Server ---
        console.log(`\n📞 Calling MCP Server at: ${MCP_SERVER_URL}`);
        const toolResponse = await fetch(MCP_SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool_name: toolName,
                parameters: toolArgs,
            }),
        });

        const toolResult = await toolResponse.json();
        console.log(`✅ MCP Server responded: ${JSON.stringify(toolResult)}`);

        // --- Second call to the LLM with the tool's result ---
        messages.push([
            {
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolName,
            content: JSON.stringify(toolResult.result), // Send back the 'result' part
        }
       ] );

        console.log('\n🤖 Sending tool result back to AI for final answer...');

        const finalResponse = await c.chat.completions.create({
            model: modelName,
            messages: messages
        //     messages: [
        //         {
        //         tool_call_id: toolCall.id,
        //         role: 'tool',
        //         name: toolName,
        //         content: JSON.stringify(toolResult.result), // Send back the 'result' part
        //     }
        //     ,
        //     {
        //         role: "system",
        //         content: prompt(),
        //       }
        //    ]
        });

        const finalMessage = finalResponse.choices[0].message.content;
        console.log(`\n✅ AI Final Answer: ${finalMessage}`);
        return finalMessage;

    } else {
        // The LLM answered directly without a tool
        const finalMessage = responseMessage.content;
        console.log(`\n✅ AI Final Answer: ${finalMessage}`);
        return finalMessage;
    }
}


// --- Let's run some examples! ---
async function main() {
    // Make sure your server.js is running in another terminal before running this.
    
    // await askAI("How many leaves does employee EMP101 have?");
    await askAI("Show me the costly business clas flight having one stop between Kolkata & Chennai.");
    
    console.log('\n-----------------------------------\n');

    // await askAI("Please apply for 5 days of Annual leave for Alice, her ID is EMP101.");
}

main();