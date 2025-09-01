// orchestrator.js
require('dotenv').config();
const OpenAI = require('openai');
const tools = require('./tools');
const prompt = require('./prompt')
const readline = require('readline');

const readlinePrompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/+$/, '');
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const baseURL = `${endpoint}/openai/deployments/${deployment}`;
const c = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview' },
    defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY }
});

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
        // console.log(`🤖 AI wants to call ${responseMessage.tool_calls.length} tool(s)...`);

        // Handle all tool calls
        for (const toolCall of responseMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            // console.log(`   - Tool: ${toolName}`);
            // console.log(`   - Tool Call ID: ${toolCall.id}`);
            console.log(`   - Arguments: ${JSON.stringify(toolArgs)}`);

            // --- Call your local MCP Server ---
            // console.log(`\n📞 Calling MCP Server at: ${MCP_SERVER_URL}`);
            const toolResponse = await fetch(MCP_SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool_name: toolName,
                    parameters: toolArgs,
                }),
            });

            const toolResult = await toolResponse.json();
            // console.log(`✅ MCP Server responded: ${JSON.stringify(toolResult)}`);

            // --- Add tool response to messages ---
            const toolResponseMessage = {
                tool_call_id: toolCall.id,
                role: 'tool',
                name: toolName,
                content: JSON.stringify(toolResult.result || toolResult), // Send back the 'result' part or the whole response
            };
            // console.log(`   - Tool Response Message: ${JSON.stringify(toolResponseMessage)}`);
            messages.push(toolResponseMessage);
        }
        // , {
        //     role: 'system',
        //     content: prompt(),
        // }
        messages.push({
            role: 'system',
            content: prompt(),
        })

        // console.log('\n🤖 Sending tool result back to AI for final answer...');
        // console.log('📋 Final messages array:', JSON.stringify(messages, null, 2));

        const finalResponse = await c.chat.completions.create({
            model: modelName,
            messages: messages,
        });

        const finalMessage = finalResponse.choices[0].message.content;
        console.log(`\n✅ Below are the flight details: ${finalMessage}`);
        return finalMessage;

    } else {
        // The LLM answered directly without a tool
        const finalMessage = responseMessage.content;
        console.log(`\n✅ Below are the flight details: ${finalMessage}`);
        return finalMessage;
    }
}

function askQuestion() {
    readlinePrompt.question('💬 Your question: ', async (input) => {
        const question = input.trim();

        if (question.toLowerCase() === 'quit' || question.toLowerCase() === 'exit') {
            readlinePrompt.close();
            return;
        }

        if (question === '') {
            console.log('Please enter a question.\n');
            askQuestion();
            return;
        }

        try {
            const result = await askAI(question);


        } catch (error) {
            console.error('❌ Error:', error.message);
            console.log('');
        }

        askQuestion();
    });
}

// --- Let's run some examples! ---
async function main() {

    askQuestion();

    // await askAI("i want to fly in business class from Kolkata to Chennai one way for 2025-09-01.");

    console.log('\n-----------------------------------\n');

    // await askAI("Please apply for 5 days of Annual leave for Alice, her ID is EMP101.");
}

main();