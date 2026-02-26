const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

        // Check if the body is completely empty (React didn't mount)
        const content = await page.content();
        if (!content.includes('id="root"')) {
            console.log("Root element not found!");
        }

        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch (err) {
        console.error(err);
    }
})();
