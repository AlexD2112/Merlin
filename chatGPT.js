const OpenAI = require ('openai');
const dbm = require('./database-manager');

//Api key is in config.json, fourth element named gpt token. Grab it as constant
const apiKey = require('./config.json').gptToken;
//Format to work as gpt key
//const apiToken = "Bearer " + apiKey;


const openai = new OpenAI({apiKey: apiKey});
const Model3_5Turbo = "gpt-3.5-turbo";
const Model4Turbo = "gpt-4-1106-preview";
const Model4 = "gpt-4";

const modelChoice = 4.01; //Options are 3.51, 4, or 4.01

class chatGPT {
    static async pope(message, playerID) {
        //Get prevMessages from database
        let prevMessagesExist = true;
        let popeInfo = await dbm.loadFile("gptMessages", "pope");
        if (popeInfo[playerID] == undefined || popeInfo[playerID] == null) {
            popeInfo[playerID] = {};
            prevMessagesExist = false;
        }
        let prevMessages = popeInfo[playerID].prevMessages;
        if (prevMessages == undefined || prevMessages == null) {
            prevMessages = [];
            prevMessagesExist = false;
        }
        console.log(prevMessagesExist);

        let modelInputCost;
        let modelOutputCost;
        let model;

        switch (modelChoice) {
            case 3.51:
                model = Model3_5Turbo;
                modelInputCost = 0.001;
                modelOutputCost = 0.002;
                break;
            case 4:
                model = Model4;
                modelInputCost = 0.03;
                modelOutputCost = 0.06;
                break;
            case 4.01:
                model = Model4Turbo;
                modelInputCost = 0.01;
                modelOutputCost = 0.03;
                break;
            default:
                model = Model3_5Turbo;
                modelInputCost = 0.001;
                modelOutputCost = 0.002;
                break;
        }
        
        //Set passed messages to pass to gpt
        //First message is a system message to "Players are speaking to you in a discord game. Respond as if you are the pope. Remember to moderate and avoid getting too deeply involved in the politics.
        //If prevMessages exist, also add on the previous messages in order
        let messages = [{ role: "system", content: "Players are speaking to you in a discord game. Respond as if you are the pope. Remember to moderate and avoid getting too deeply involved in the politics." }];
        messages.push()
        if (prevMessagesExist) {
            //Add previous messages to messages
            for (let i = 0; i < prevMessages.length; i++) {
                //Each message should be structured properly with role and everything
                messages.push(prevMessages[i]);
            }
        }
        messages.push({ role: "user", content: message });

        console.log(messages);

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: model,
            max_tokens: 350,});
        
        console.log(completion);
        //Save message, prevMessages, and completion to database under player id

        //Initialize example completion
        // const completion = { 
        //         "choices": [
        //           {
        //             "finish_reason": "stop",
        //             "index": 0,
        //             "message": {
        //               "content": "The 2020 World Series was played in Texas at Globe Life Field in Arlington.",
        //               "role": "assistant"
        //             },
        //             "logprobs": null
        //           }
        //         ],
        //         "created": 1677664795,
        //         "id": "chatcmpl-7QyqpwdfhqwajicIEznoc6Q47XAyW",
        //         "model": "gpt-3.5-turbo-0613",
        //         "object": "chat.completion",
        //         "usage": {
        //           "completion_tokens": 17,
        //           "prompt_tokens": 57,
        //           "total_tokens": 74
        //         }
        //       }
        const dataText = completion.choices[0].message;
        const completionTokens = completion.usage.completion_tokens;
        const promptTokens = completion.usage.prompt_tokens;
        //Add message and datatext to prevMessages
        prevMessages.push({ role: "user", content: message });
        prevMessages.push({ role: "assistant", content: dataText.content });
        popeInfo[playerID].prevMessages = prevMessages;
        //Avoid no such document error with save file- TO DO
        await dbm.saveFile("gptMessages", "pope", popeInfo);
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
        tokens.totalCost += (modelInputCost * promptTokens + modelOutputCost * completionTokens) / 1000;
        await dbm.saveFile("gptMessages", "tokens", tokens);
        
        const returnString = dataText.content + "\n\n" + "`Prompt tokens: " + promptTokens + "`\n" + "`Completion Tokens: " + completionTokens + "`" +
            "\n" + "`Input Cost: " + (modelInputCost * promptTokens) + "`\n" + "`Output Cost: " + (modelOutputCost * completionTokens) + "`" + 
            "\n" + "`Total Cost so far: " + tokens.totalCost + "`";

        return returnString;
    }

    static async luis(message, playerID) {
        //Get prevMessages from database
        let prevMessagesExist = true;
        let luisInfo = await dbm.loadFile("gptMessages", "luis");
        if (luisInfo[playerID] == undefined || luisInfo[playerID] == null) {
            luisInfo[playerID] = {};
            prevMessagesExist = false;
        }
        let prevMessages = luisInfo[playerID].prevMessages;
        if (prevMessages == undefined || prevMessages == null) {
            prevMessages = [];
            prevMessagesExist = false;
        }
        console.log(prevMessagesExist);

        let modelInputCost;
        let modelOutputCost;
        let model;

        switch (modelChoice) {
            case 3.51:
                model = Model3_5Turbo;
                modelInputCost = 0.001;
                modelOutputCost = 0.002;
                break;
            case 4:
                model = Model4;
                modelInputCost = 0.03;
                modelOutputCost = 0.06;
                break;
            case 4.01:
                model = Model4Turbo;
                modelInputCost = 0.01;
                modelOutputCost = 0.03;
                break;
            default:
                model = Model3_5Turbo;
                modelInputCost = 0.001;
                modelOutputCost = 0.002;
                break;
        }
        
        //Set passed messages to pass to gpt
        //First message is a system message to "Players are speaking to you in a discord game. Respond as if you are the pope. Remember to moderate and avoid getting too deeply involved in the politics.
        //If prevMessages exist, also add on the previous messages in order
        let messages = [{ role: "system", content: `Players are speaking to you in a discord game. Your info is as follows: Louis the Pious: King of Aquitaine
        Louis, having been crowned King of Aquitaine amidst the chaotic civil war that fragmented his father's empire, was a man who stood in stark contrast to Charlemagne. Where his father was a titan of warfare, Louis was a monarch of piety and peace. His rule in Aquitaine, though marked by initial instability, soon began to reflect his virtues.    
        He was a ruler who sought to mend the fissures of his domain not through the sword, but through faith and diplomacy. Louis invested in the ecclesiastical infrastructure of Aquitaine, building monasteries and churches, hoping that spiritual guidance would unite his people where politics had failed.
        Despite his critics, Louis's approach began to yield fruit. His rule in Aquitaine saw the integration of the local nobility into his governance, using marriages, alliances, and the distribution of lands to placate potential rebels. His court became a center of learning and ecclesiastical debate, a reflection of his personal devotion to the church.
        Luis Traits
        Diplomatic: Louis excels in negotiations and forging alliances, often avoiding conflict through peaceful means. Will not engage in talks with someone with less than 100 prestige.
        Pious: His deep religious faith influences his decisions and policies, and he is highly regarded by the church.
        Strategic Marriage Planner: Louis uses marriages between his court and local nobility to secure loyalty and peace.
        Patron of Learning: He encourages scholarly pursuits and ecclesiastical learning, attracting intellectuals to his court.
        Conservative Ruler: Preferring traditional governance methods, Louis is resistant to rapid change and innovation in governance.` }];
        messages.push()
        if (prevMessagesExist) {
            //Add previous messages to messages
            for (let i = 0; i < prevMessages.length; i++) {
                //Each message should be structured properly with role and everything
                messages.push(prevMessages[i]);
            }
        }
        messages.push({ role: "user", content: message });

        console.log(messages);

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: model,
            max_tokens: 350,});
        
        console.log(completion);
        //Save message, prevMessages, and completion to database under player id

        //Initialize example completion
        // const completion = { 
        //         "choices": [
        //           {
        //             "finish_reason": "stop",
        //             "index": 0,
        //             "message": {
        //               "content": "The 2020 World Series was played in Texas at Globe Life Field in Arlington.",
        //               "role": "assistant"
        //             },
        //             "logprobs": null
        //           }
        //         ],
        //         "created": 1677664795,
        //         "id": "chatcmpl-7QyqpwdfhqwajicIEznoc6Q47XAyW",
        //         "model": "gpt-3.5-turbo-0613",
        //         "object": "chat.completion",
        //         "usage": {
        //           "completion_tokens": 17,
        //           "prompt_tokens": 57,
        //           "total_tokens": 74
        //         }
        //       }
        const dataText = completion.choices[0].message;
        const completionTokens = completion.usage.completion_tokens;
        const promptTokens = completion.usage.prompt_tokens;
        //Add message and datatext to prevMessages
        prevMessages.push({ role: "user", content: message });
        prevMessages.push({ role: "assistant", content: dataText.content });
        luisInfo[playerID].prevMessages = prevMessages;
        //Avoid no such document error with save file- TO DO
        await dbm.saveFile("gptMessages", "luis", luisInfo);
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
        tokens.totalCost += (modelInputCost * promptTokens + modelOutputCost * completionTokens) / 1000;
        await dbm.saveFile("gptMessages", "tokens", tokens);
        
        const returnString = dataText.content + "\n\n" + "`Prompt tokens: " + promptTokens + "`\n" + "`Completion Tokens: " + completionTokens + "`" +
            "\n" + "`Input Cost: " + (modelInputCost * promptTokens) + "`\n" + "`Output Cost: " + (modelOutputCost * completionTokens) + "`" + 
            "\n" + "`Total Cost so far: " + tokens.totalCost + "`";

        return returnString;
    }
}

module.exports = chatGPT;