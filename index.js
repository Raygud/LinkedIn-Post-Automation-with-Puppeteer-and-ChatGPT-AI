const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

async function automateLinkedInPost() {
    try {
        // Generate post content using OpenAI
        const generatedContent = await callOpenAI();

        const browser = await puppeteer.launch({ headless: false });
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        const username = process.env.LINKEDIN_USERNAME;
        const password = process.env.LINKEDIN_PASSWORD;

        await page.goto('https://www.linkedin.com/login');

        await page.type('#username', username);
        await page.type('#password', password);

        await page.click('.login__form_action_container button[type="submit"]');
        await page.waitForNavigation();

        const loggedInElement = await page.waitForSelector('.feed-identity-module__actor-meta', { timeout: 60000 });

        if (loggedInElement) {
            console.log('Successfully logged in!');

            await page.goto('https://www.linkedin.com/feed/');

            // Click the "Start a post" button
            await page.click('.share-box-feed-entry__trigger');

            // Wait for the share box modal to appear
            await page.waitForSelector('.share-box', { visible: true });

            // Type the generated content in the editor
            await page.type('.editor-content', generatedContent);

            // Wait for the "Post" button to become enabled
            await page.waitForFunction(() => {
                const postButton = document.querySelector('.share-actions__primary-action');
                return !postButton.disabled;
            });

            // Click the "Post" button
            await page.click('.share-actions__primary-action');

            console.log('Posted to LinkedIn');
        } else {
            console.log('Login failed. Check your credentials or the login process.');
        }

        await browser.close();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

async function callOpenAI() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await axios.post(
            'https://api.openai.com/v1/engines/text-davinci-003/completions',
            {
                prompt: generatePrompt(),
                max_tokens: 400,
                temperature: 1,
                format: 'text', // Specify that you want text (Unicode) representation
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const parsedText = response.data.choices[0].text;
        return parsedText;
    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
        throw error;
    }
}

function generatePrompt() {
    return `Write a LinkedIn post as if you are a coding influencer. Share insights and tips on IT-related topics like coding, front-end development, AI, cybersecurity, cloud computing, data science, etc. Choose one or combine related topics to create a unique and informative post. Keep it engaging and avoid personal or team details. Use emojis and provide valuable tips and tricks for your network, showcasing your expertise in the ever-evolving world of IT!`;
}

// Call the automateLinkedInPost function to initiate the LinkedIn post creation
automateLinkedInPost();
