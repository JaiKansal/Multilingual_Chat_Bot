import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TranslationServiceClient } from '@google-cloud/translate';
import { SessionsClient } from '@google-cloud/dialogflow';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors()); // Allow requests from our React app
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    supportProject: supportProjectId,
    salesProject: salesProjectId
  });
});

// --- Setup Google Cloud Clients ---

// 1. Translation Clients (separate for each project)
const supportTranslationClient = new TranslationServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_SUPPORT,
});
const salesTranslationClient = new TranslationServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_SALES,
});
const location = 'global'; // Use 'global' for Cloud Translation API

// 2. Dialogflow Clients (separate for each project)
const supportDialogflowClient = new SessionsClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_SUPPORT,
});
const salesDialogflowClient = new SessionsClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_SALES,
});

// --- Load BOTH Project IDs ---
const supportProjectId = process.env.DIALOGFLOW_PROJECT_ID_SUPPORT;
const salesProjectId = process.env.DIALOGFLOW_PROJECT_ID_SALES;

// --- API Endpoint ---

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    // --- GET THE NEW BOT ID ---
    const { message, sessionId, botId } = req.body;

    if (!message || !sessionId || !botId) {
      return res
        .status(400)
        .send({ error: 'Message, sessionId, and botId are required.' });
    }

    // --- CHOOSE THE BOT BRAIN ---
    // Select the correct Dialogflow Project ID based on the botId
    const targetProjectId = (botId === 'sales') ? salesProjectId : supportProjectId;
    
    if (!targetProjectId) {
      return res.status(500).send({ error: 'Bot configuration error.' });
    }

    console.log(`Processing message for botId: ${botId}, targetProjectId: ${targetProjectId}`);
    
    // Select the appropriate clients based on botId
    const translationClient = (botId === 'sales') ? salesTranslationClient : supportTranslationClient;
    const dialogflowClient = (botId === 'sales') ? salesDialogflowClient : supportDialogflowClient;
    
    // --- Step 1: Detect Language ---
    const detectRequest = {
      parent: `projects/${targetProjectId}/locations/${location}`,
      content: message,
      mimeType: 'text/plain',
    };
    
    let sourceLanguage = 'en'; // Default to English
    try {
      const [detectResponse] = await translationClient.detectLanguage(detectRequest);
      sourceLanguage = detectResponse.languages?.[0]?.languageCode || 'en';
    } catch (detectError) {
      console.error('Error detecting language with primary client:', detectError);
      // Fallback to support translation client if sales client fails
      try {
        const fallbackDetectRequest = {
          parent: `projects/${supportProjectId}/locations/${location}`,
          content: message,
          mimeType: 'text/plain',
        };
        const [detectResponse] = await supportTranslationClient.detectLanguage(fallbackDetectRequest);
        sourceLanguage = detectResponse.languages?.[0]?.languageCode || 'en';
        console.log('Language detection successful with fallback client');
      } catch (fallbackError) {
        console.error('Error with fallback language detection:', fallbackError);
        // We can still proceed, assuming English
      }
    }

    // --- Step 2: Translate to English (if necessary) ---
    let messageForDialogflow = message;
    if (sourceLanguage !== 'en') {
      const translateToEnRequest = {
        parent: `projects/${targetProjectId}/locations/${location}`,
        contents: [message],
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: 'en',
      };
      try {
        const [translateResponse] = await translationClient.translateText(translateToEnRequest);
        messageForDialogflow = translateResponse.translations?.[0]?.translatedText || message;
      } catch (translateError) {
        console.error('Translation error with primary client, using fallback:', translateError);
        // Fallback to support translation client
        const fallbackTranslateRequest = {
          parent: `projects/${supportProjectId}/locations/${location}`,
          contents: [message],
          mimeType: 'text/plain',
          sourceLanguageCode: sourceLanguage,
          targetLanguageCode: 'en',
        };
        const [translateResponse] = await supportTranslationClient.translateText(fallbackTranslateRequest);
        messageForDialogflow = translateResponse.translations?.[0]?.translatedText || message;
      }
    }

    // --- Step 3: Send to Dialogflow (NOW DYNAMIC) ---
    // This is the key change: we use targetProjectId
    const sessionPath = dialogflowClient.projectAgentSessionPath(
      targetProjectId!, // <-- Uses the correct ID
      sessionId
    );

    const dialogflowRequest = {
      session: sessionPath,
      queryInput: {
        text: {
          text: messageForDialogflow,
          languageCode: 'en', // We always send English to our agent
        },
      },
    };

    const [dialogflowResponse] =
      await dialogflowClient.detectIntent(dialogflowRequest);
    
    console.log('Dialogflow Response:', JSON.stringify(dialogflowResponse.queryResult, null, 2));
    
    // --- CHECK FOR FULFILLMENT ---
    // If Dialogflow is handling this via a webhook (Step 2),
    // the fulfillmentText might be empty. We check for that.
    let botReplyEn = dialogflowResponse.queryResult?.fulfillmentText;
    
    // Enhanced fallback logic for better user experience
    if (!botReplyEn || 
        botReplyEn.includes("I missed") || 
        botReplyEn.includes("didn't understand") ||
        botReplyEn.includes("say that again") ||
        botReplyEn.includes("Sorry, could you") ||
        dialogflowResponse.queryResult?.intent?.displayName === "Default Welcome Intent") {
      const userMessage = messageForDialogflow.toLowerCase();
      
      if (botId === 'sales') {
        if (userMessage.includes('demo') || userMessage.includes('demonstration')) {
          botReplyEn = "Excellent! I'd love to show you our platform. Our AI-powered chatbot supports 100+ languages with real-time translation. When would be a good time for a 15-minute demo?";
        } else if (userMessage.includes('price') || userMessage.includes('cost') || userMessage.includes('pricing')) {
          botReplyEn = "Great question! Our pricing starts at $29/month for small teams. We also offer enterprise solutions. What size is your team?";
        } else if (userMessage.includes('feature') || userMessage.includes('capability')) {
          botReplyEn = "Our platform offers multilingual AI, real-time translation, smart routing, and analytics. Which feature interests you most?";
        } else {
          botReplyEn = "I'm here to help you learn about our cross-lingual AI platform! I can tell you about demos, pricing, or features. What would you like to know?";
        }
      } else {
        // Support bot fallbacks
        if (userMessage.includes('order') || userMessage.includes('tracking')) {
          botReplyEn = "I can help you check your order status. Could you please provide your order number?";
        } else if (userMessage.includes('problem') || userMessage.includes('issue') || userMessage.includes('help')) {
          botReplyEn = "I'm here to help! Could you describe the issue you're experiencing? I'll do my best to assist you.";
        } else {
          botReplyEn = "I'm your support assistant. I can help with order tracking, technical issues, or general questions. How can I assist you today?";
        }
      }
    }

    // --- Step 4: Translate back to User's Language (if necessary) ---
    let finalBotReply = botReplyEn;
    if (sourceLanguage !== 'en') {
      const translateBackRequest = {
        parent: `projects/${targetProjectId}/locations/${location}`,
        contents: [botReplyEn],
        mimeType: 'text/plain',
        sourceLanguageCode: 'en',
        targetLanguageCode: sourceLanguage,
      };
      try {
        const [translateBackResponse] = await translationClient.translateText(translateBackRequest);
        finalBotReply = translateBackResponse.translations?.[0]?.translatedText || botReplyEn;
      } catch (translateBackError) {
        console.error('Translation back error with primary client, using fallback:', translateBackError);
        // Fallback to support translation client
        const fallbackTranslateBackRequest = {
          parent: `projects/${supportProjectId}/locations/${location}`,
          contents: [botReplyEn],
          mimeType: 'text/plain',
          sourceLanguageCode: 'en',
          targetLanguageCode: sourceLanguage,
        };
        const [translateBackResponse] = await supportTranslationClient.translateText(fallbackTranslateBackRequest);
        finalBotReply = translateBackResponse.translations?.[0]?.translatedText || botReplyEn;
      }
    }

    // If the fulfillment *did* run, Dialogflow might send a rich response.
    // For now, we just check if the text is empty.
    if (botReplyEn) {
      // --- Step 5: Send response to React ---
      res.send({ reply: finalBotReply });
    }
    // If fulfillmentText was empty, it means our (future) webhook 
    // will handle the response. But for now, this is a safety net.
    else {
      res.send({ reply: "I'm processing that request..." });
    }

  } catch (error) {
    console.error('ERROR in /api/chat:', error);
    res.status(500).send({ error: 'Failed to process chat message.' });
  }
});

// --- DIALOGFLOW FULFILLMENT WEBHOOK ---
// This endpoint is CALLED BY DIALOGFLOW, not by our React app.
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Log the request to see what Dialogflow sends
    console.log('--- Dialogflow Webhook Request ---');
    console.log(JSON.stringify(req.body, null, 2));

    // 1. Get the intent and parameters
    const intentName = req.body.queryResult.intent.displayName;
    const params = req.body.queryResult.parameters;
    let fulfillmentText = "Sorry, I can't fulfill that request right now.";

    // 2. Run "real" logic based on the intent
    if (intentName === 'CheckOrderStatus') {
      const orderNumber = params.orderNumber;
      if (orderNumber) {
        // --- THIS IS THE "REAL" SUPPORT ---
        // We're faking the database lookup for speed,
        // but here you would: await db.orders.find(orderNumber)
        console.log(`Fulfilling request for order: ${orderNumber}`);
        let status = 'Processing';
        if (orderNumber === 12345) {
          status = 'Shipped';
        } else if (orderNumber === 67890) {
          status = 'Delivered';
        }
        fulfillmentText = `I've checked order ${orderNumber}. Its status is: ${status}.`;
      } else {
        // This happens if the user just said "Where is my order?"
        // Dialogflow is smart enough to ask the follow-up question for us.
        // We just send back the text from the "Responses" section in the UI.
        fulfillmentText = req.body.queryResult.fulfillmentText;
      }
    } else if (intentName === 'RequestDemo' || intentName === 'Demo.Request') {
      // Handle demo requests
      const companyName = params.companyName || params['company-name'] || 'your company';
      fulfillmentText = `Great! I'd love to show you a demo of our platform. Let me connect you with our sales team to schedule a personalized demo for ${companyName}. What's the best email to reach you at?`;
    } else if (intentName === 'GetPricing' || intentName === 'Pricing.Info') {
      // Handle pricing inquiries
      fulfillmentText = `Our pricing is flexible and depends on your team size and needs. We offer:\n\n• Starter Plan: $29/month for up to 5 users\n• Professional Plan: $99/month for up to 25 users\n• Enterprise Plan: Custom pricing for larger teams\n\nWould you like to schedule a call to discuss which plan works best for you?`;
    } else if (intentName === 'Default Fallback Intent') {
      // Enhanced fallback for unrecognized intents
      const queryText = req.body.queryResult.queryText.toLowerCase();
      if (queryText.includes('demo') || queryText.includes('demonstration')) {
        fulfillmentText = `I'd be happy to help you with a demo! Our platform offers powerful cross-lingual AI capabilities. Would you like me to schedule a personalized demonstration for you?`;
      } else if (queryText.includes('price') || queryText.includes('cost') || queryText.includes('pricing')) {
        fulfillmentText = `Let me help you with pricing information. Our plans start at $29/month. Would you like to see a detailed breakdown of our pricing tiers?`;
      } else if (queryText.includes('feature') || queryText.includes('capability')) {
        fulfillmentText = `Our platform offers multilingual AI chatbots, real-time translation, and intelligent routing. What specific features are you most interested in learning about?`;
      } else {
        fulfillmentText = req.body.queryResult.fulfillmentText || "I'd be happy to help! Could you tell me more about what you're looking for? I can assist with demos, pricing, or answer questions about our platform.";
      }
    }

    // 3. Send the response back to Dialogflow
    // This is a specific format Dialogflow requires
    res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [fulfillmentText],
          },
        },
      ],
    });
  } catch (error) {
    console.error('ERROR in /webhook:', error);
    res.status(500).send({ error: 'Webhook failed.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🛠️ Support Bot Project: ${supportProjectId}`);
  console.log(`💼 Sales Bot Project: ${salesProjectId}`);
});