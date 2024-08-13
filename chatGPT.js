const OpenAI = require ('openai');
const dbm = require('./database-manager');

//Api key is in config.json, fourth element named gpt token. Grab it as constant
const apiKey = require('./config.json').gptToken;
//Format to work as gpt key
//const apiToken = "Bearer " + apiKey;


const openai = new OpenAI({apiKey: apiKey});
const Model3_5Turbo = "gpt-3.5-turbo";
const Model4o = "gpt-4o";

const modelChoice = 4.01; //Options are 3.51, 4.01

class chatGPT {
    static async bjorn(numericID, playerName, message) {
        console.log(numericID);
        console.log(playerName);
        console.log(message);  
        //Get prevMessages from database
        let bjornInfo = await dbm.loadFile("gptMessages", "bjorn");
        let prevMessages = bjornInfo.prevMessages
        
        let modelInputCost;
        let modelOutputCost;
        let model;

        switch (modelChoice) {
            case 3.51:
                model = Model3_5Turbo;
                modelInputCost = 0.0005;
                modelOutputCost = 0.0015;
                break;
            case 4.01:
                model = Model4o;
                modelInputCost = 0.005;
                modelOutputCost = 0.015;
                break;
            default:
                model = Model3_5Turbo;
                modelInputCost = 0.0005;
                modelOutputCost = 0.0015;
                break;
        }

        let contextString = await chatGPT.getContextString(message, "Bjorn Ketilsson, Skald of Storms");

        //console.log(contextString);
        
        //Set passed messages to pass to gpt
        //First message is a system message to "Players are speaking to you in a discord game. Respond as if you are the pope. Remember to moderate and avoid getting too deeply involved in the politics.
        //If prevMessages exist, also add on the previous messages in order
        let messages = [{ role: "system", content: `Your name is Bjorn Ketilsson, the Skald of Storms. You are interacting with and responding to players in a Discord RP game called Britannia set in 800 AD. Embody the spirit and knowledge of a 9th-century Norse skald at all times. Engage with others through the lens of Viking culture circa 800 AD, drawing upon the mythology, traditions, and historical events pertinent to that era and region. Refrain from referencing or acknowledging events, technologies, or cultures beyond this temporal and geographical scope. Your speech should be poetic, filled with metaphors and references to Norse legends and sagas. Approach interactions with the wisdom of a seasoned storyteller, offering counsel, recounting heroic tales, and providing entertainment through song and verse. Maintain an air of mystique and gravitas befitting a revered skald, ensuring that every utterance adds depth and authenticity to the world of the Northmen.
                       The following specific information may be relevant to this question. If it contradicts history, trust the following information instead of what you know about history:` + contextString }];
        messages.push();
        if (prevMessages != undefined && prevMessages != null) {
            //Add previous messages to messages
            for (let i = 0; i < prevMessages.length; i++) {
                //Each message should be structured properly with role and everything
                messages.push(prevMessages[i]);
            }
        }
        messages.push({ role: "user", content: playerName + " asked " + message });
        

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: model,
            max_tokens: 500,});
        
        //console.log(completion);

        const dataText = completion.choices[0].message;
        const completionTokens = completion.usage.completion_tokens;
        const promptTokens = completion.usage.prompt_tokens;
        //Add message and datatext to prevMessages, remove first message- there should always be an even number of messages in prevMessages
        prevMessages.push({ role: "user", content: playerName + " said " + message });
        prevMessages.push({ role: "assistant", content: dataText.content });

        if (prevMessages.length > 4) {
            prevMessages.shift();
            prevMessages.shift();
        }
        bjornInfo.prevMessages = prevMessages;
        //Avoid no such document error with save file- TO DO
        await dbm.saveFile("gptMessages", "bjorn", bjornInfo);
        let tokens = await dbm.loadFile("gptMessages", "tokens");
        if (!tokens.completions) {
            tokens.completions = 0;
        }
        if (!tokens.promptTokens) {
            tokens.promptTokens = 0;
        }
        if (!tokens.inputCost) {
            tokens.inputCost = 0;
        }
        if (!tokens.outputCost) {
            tokens.outputCost = 0;
        }
        if (!tokens.totalCost) {
            tokens.totalCost = 0;
        }
        tokens.completions += completionTokens;
        tokens.promptTokens += promptTokens;
        tokens.inputCost += modelInputCost * promptTokens / 1000;
        tokens.outputCost += modelOutputCost * completionTokens / 1000;
        //console.log(modelInputCost * promptTokens / 1000);
        //console.log(modelOutputCost * completionTokens / 1000);
        //console.log(tokens.totalCost);
        tokens.totalCost += (modelInputCost * promptTokens + modelOutputCost * completionTokens) / 1000;
        //console.log(tokens.totalCost);
        await dbm.saveFile("gptMessages", "tokens", tokens);
        
        const returnString = dataText.content;

        return returnString;
    }

    static async getContextString(message, botName) {
        try {

            let modelInputCost = 0.005;
            let modelOutputCost = 0.015;
            // Load the information blocks
            let info = await dbm.loadFile("gptMessages", "info");
    
            // Prepare the prompt messages
            let messages = [
                {   
                    role: "system",
                    content: "You are part of a bot named " + botName +  ". Your job is to decide which info blocks are relevant to this user's inquiry in the Britannia RP game. 1. Bjorn Info, 2. The Main Norse Kingdoms, 3. Bjorn's Knowledge of the World, 4. Recent News, 5. Norse Myths"
                },
                {
                    role: "user",
                    content: "Respond with the array containing ONLY numbers for the following message: " + message
                }
            ];
    
            // Call the OpenAI API to get the structured output
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
                max_tokens: 50,
                temperature: 0,
                functions: [
                    {
                        "name": "setRelevantBlocks",
                        "description": "Select relevant blocks for a given user message",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "blocks": {
                                    "type": "array",
                                    "items": {
                                        "type": "integer"
                                    },
                                    "description": "An array of block numbers relevant to the user's question"
                                }
                            },
                            "required": ["blocks"]
                        }
                    }
                ],
                function_call: { "name": "setRelevantBlocks" }
            });
    
            // Extract the response message
            const responseFunctionCall = completion.choices[0].message.function_call;
    
            // Parse the response to get the array of numbers
            const responseArray = JSON.parse(responseFunctionCall.arguments);
    
            const blocks = responseArray.blocks;

            console.log(blocks);
            let contextString = "";
            for (let i = 0; i < blocks.length; i++) {
                //console.log(info);
                //console.log(blocks[i]);
                //console.log(info.infoBlocks[blocks[i] - 1]);
                contextString += info.infoBlocks[blocks[i] - 1] + "\n\n";
            }

            //console.log(contextString);

            const completionTokens = completion.usage.completion_tokens;
            const promptTokens = completion.usage.prompt_tokens;

            let tokens = await dbm.loadFile("gptMessages", "tokens");
            if (!tokens.completions) {
                tokens.completions = 0;
            }
            if (!tokens.promptTokens) {
                tokens.promptTokens = 0;
            }
            if (!tokens.inputCost) {
                tokens.inputCost = 0;
            }
            if (!tokens.outputCost) {
                tokens.outputCost = 0;
            }
            if (!tokens.totalCost) {
                tokens.totalCost = 0;
            }
            tokens.completions += completionTokens;
            tokens.promptTokens += promptTokens;
            tokens.inputCost += modelInputCost * promptTokens / 1000;
            tokens.outputCost += modelOutputCost * completionTokens / 1000;
            //console.log(modelInputCost * promptTokens / 1000);
            //console.log(modelOutputCost * completionTokens / 1000);
            //console.log(tokens.totalCost);
            tokens.totalCost += (modelInputCost * promptTokens + modelOutputCost * completionTokens) / 1000;
            //console.log(tokens.totalCost);
            await dbm.saveFile("gptMessages", "tokens", tokens);

            return contextString;
    
        } catch (error) {
            console.error("Error getting context string:", error);
            throw error;
        }
    }
}

module.exports = chatGPT;