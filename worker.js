const puppeteer = require('puppeteer');
const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

async function automateLinkedInPost() {
    const browser = await puppeteer.launch({
        headless: false, // Set this to true if you want to run without a visible browser
    });

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    const username = process.env.LINKEDIN_USERNAME;
    const password = process.env.LINKEDIN_PASSWORD;

    try {
        console.log("Going to https://www.linkedin.com/login")
        await page.goto('https://www.linkedin.com/login');
        console.log("https://www.linkedin.com/login accessed")

        await page.type('#username', username);
        console.log("Username added")

        await page.type('#password', password);
        console.log("Password added")

        await page.click('.login__form_action_container button[type="submit"]');
        console.log("Pressing login button")

        await page.waitForNavigation();

        const loggedInElement = await page.waitForSelector('.feed-identity-module__actor-meta', { timeout: 120000 });

        if (loggedInElement) {
            console.log('Successfully logged in!');

            await page.goto('https://www.linkedin.com/feed/');

            // Click the "Start a post" button
            await page.click('.share-box-feed-entry__trigger');
            await new Promise(resolve => setTimeout(resolve, 5000));
            await page.click('.share-box-feed-entry__trigger');

            // Wait for the share box modal to appear
            await page.waitForSelector('.share-box', { visible: true });

            // Generate post content using OpenAI
            const generatedContent = await callOpenAI();

            // Type the generated content in the editor
            await page.type('.editor-content', generatedContent);

            // Wait for the "Post" button to become enabled
            await page.waitForFunction(() => {
                const postButton = document.querySelector('.share-actions__primary-action');
                return !postButton.disabled;
            });

            // Click the "Post" button
            await page.click('.share-actions__primary-action');


            // Wait for the post to be successfully created
            await page.waitForSelector('.feed-shared-update-v2', { timeout: 60000 }); // Adjust the timeout as needed
            await page.goto("https://www.linkedin.com/in/r%C3%BAni-gudmundarson-b33559176/recent-activity/all/")

            // Find and extract the `data-urn` attribute of the first post
            const dataUrn = await page.$eval('.feed-shared-update-v2', (postElement) => {
                return postElement.getAttribute('data-urn');
            });

            // Construct the dynamic post URL
            const postURL = `https://www.linkedin.com/feed/update/${dataUrn}/`;

            console.log('Posted to LinkedIn');
            await sendEmail(postURL); // Pass the postURL to the sendEmail function

        } else {
            console.log('Login failed. Check your credentials or the login process.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

// Function to call OpenAI and generate post content
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
                format: 'text',
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

// Function to generate the prompt for OpenAI
function generatePrompt() {
    return `Write a LinkedIn post as if you are a coding influencer(do not mention that you are a coding influencer). Share insights and tips on IT-related topics like coding, front-end development, AI, cybersecurity, cloud computing, data science, etc. Choose one or combine related topics to create a unique and informative post. Keep it engaging and avoid personal or team details. Use emojis and provide valuable tips and tricks for your network, showcasing your expertise in the ever-evolving world of IT!`;
}

// Function to run `automateLinkedInPost()` once and then set a daily interval
function startAutomatedPosting() {
    // Calculate the time until 08:00 AM
    const now = new Date();
    let millisUntil8AM = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        8, // Hour
        0, // Minute
        0, // Second
        0  // Millisecond
    ) - now;

    if (millisUntil8AM < 0) {
        // It's already past 08:00 AM today, so schedule for 08:00 AM tomorrow
        millisUntil8AM += 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    // Run `automateLinkedInPost()` at 08:00 AM
    setTimeout(() => {
        automateLinkedInPost();

        // Then schedule `automateLinkedInPost()` to run every day at a random time between 08:00 AM and 10:00 AM
        const randomMinutes = Math.floor(Math.random() * 120); // Random number between 0 and 119
        const randomMilliseconds = randomMinutes * 60 * 1000; // Convert minutes to milliseconds
        setInterval(() => {
            automateLinkedInPost();
        }, 24 * 60 * 60 * 1000 + randomMilliseconds); // Repeat every 24 hours with a random delay
    }, millisUntil8AM);
}

async function sendEmail(postURL) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
                user: process.env.EMAIL_USER, // Use the EMAIL_USER environment variable as sender and recipient
                pass: process.env.EMAIL_PASS, // Use the EMAIL_PASS environment variable
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send the email to yourself
            subject: 'LinkedIn Post Successfully Created',
            text: `Your LinkedIn post was successfully created. You can view it here: ${postURL}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email notification sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Start the automated posting process
startAutomatedPosting();
