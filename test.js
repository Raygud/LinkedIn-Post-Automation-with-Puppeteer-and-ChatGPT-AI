const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // Set this to true if you want to run without a visible browser
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const profileUrl = 'https://www.linkedin.com/in/r%C3%BAni-gudmundarson-b33559176/recent-activity/all/';
    await page.goto(profileUrl);

    try {
        const postSelector = '.feed-shared-update-v2'; // Selector for the post element
        await page.waitForSelector(postSelector);

        // Extract the `data-urn` attribute from the first post element
        const dataUrn = await page.$eval(postSelector, (postElement) => {
            return postElement.getAttribute('data-urn');
        });

        // Construct the dynamic URL
        const dynamicURL = `https://www.linkedin.com/feed/update/${dataUrn}/`;

        console.log('Dynamic URL:', dynamicURL);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
})();
