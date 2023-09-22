const puppeteer = require('puppeteer');
const axios = require('axios');
require('dotenv').config();

async function automateLinkedInPost() {
    const browser = await puppeteer.launch({ headless: false });
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    const username = process.env.LINKEDIN_USERNAME || 'YOUR_LINKEDIN_USERNAME';
    const password = process.env.LINKEDIN_PASSWORD || 'YOUR_LINKEDIN_PASSWORD';

    try {
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

            // Generate post content using OpenAI
            const generatedContent = await callOpenAI();

            // Generate an image using OpenAI
            const imageResult = await generateImage('a photo of a happy corgi puppy sitting and facing forward, studio light, longshot', 1, '1024x1024');
            const imageUrl = imageResult.data[0].url;

            // Construct the post content with the URL as the first part
            const contentWithImage = `${imageUrl}\n\n${generatedContent}`;

            // Type the generated content and image URL in the editor
            await page.type('.editor-content', contentWithImage);

            // Wait for the image preview to load
            await page.waitForSelector('.ivm-view-attr__img--centered', { visible: true });

            // Delete the URL text
            await page.keyboard.press('Backspace');

            // Wait for the "Post" button to become enabled
            await page.waitForFunction(() => {
                const postButton = document.querySelector('.share-actions__primary-action');
                return !postButton.disabled;
            });

            // Click the "Post" button to publish the post
            // await page.click('.share-actions__primary-action');

            console.log('Posted to LinkedIn');
        } else {
            console.log('Login failed. Check your credentials or the login process.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser after posting
        // await browser.close();
    }
}

async function callOpenAI() {
    try {
        const apiKey = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
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

async function generateImage(prompt, n, size) {
    const apiUrl = 'https://api.openai.com/v1/images/generations';
    const apiKey = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
    const data = {
        prompt,
        n,
        size,
    };

    try {
        const response = await axios.post(apiUrl, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        return response.data;
    } catch (error) {
        throw error;
    }
}

// Call the automateLinkedInPost function to initiate the LinkedIn post creation
automateLinkedInPost();
