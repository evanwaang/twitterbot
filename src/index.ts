import puppeteer from "puppeteer-extra";
import { readFile } from "fs/promises";
import { Protocol, ElementHandle } from "puppeteer";
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { randomPause } from "./utils/randompause";
import { humanLikeScroll } from "./utils/scroll";
import { nextPage } from "./utils/nextPage";
import config from "./config";

import { isLinkVisited, saveVisitedProfile, loadVisitedProfiles } from "./utils/checkProfiles";

puppeteer.use(StealthPlugin());
const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
];

const options = {
    ...args,
    headless: false,
};

async function main() {

    // launch browser and block all images 
    const browser = await puppeteer.launch(options);
    let cookies = await readFile("cookies.json", {
        encoding: "utf8",
    });
    let cookieJson: Protocol.Network.CookieParam[] = JSON.parse(cookies);
    let page = await browser.newPage();


    await page.setViewport({ width: 1200, height: 720 });
    await page.setCookie(...cookieJson);
    await page.setRequestInterception(true);


    page.on('request', async (request) => {
        if (request.resourceType() === 'image') {
            await request.abort();
        } else {
            await request.continue();
        }
    });


    let index = 0;
    nextPage(page, index);


    await page.waitForNetworkIdle();

    
    // Find all profile links on the search page
    let lastClickedIndex = -1;

    let UniqueProfiles = 0;

    while (true) {
        // Scroll the page

        // CHANGE THIS 
        if (UniqueProfiles >= 100) {
            console.log("Reached max profiles, stopping");
            UniqueProfiles = 0;
            nextPage(page, index + 1);
        }

        await humanLikeScroll(page);

        await page.waitForNetworkIdle({ timeout: 3000 }).catch(() => {});
        // Find all profile links on the current search page, contruct array of links
        const profileLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll("div[data-testid='primaryColumn'] a[role='link']"));
            return links
                .map(link => link.getAttribute("href"))
                .filter((href, index, self) => 
                    href && 
                    href.match(/^\/[0-9A-Za-z]+$/) && 
                    !["/home", "/explore", "/notifications", "/messages"].includes(href) &&
                    self.indexOf(href) === index
                )
                .map(href => "https://twitter.com" + href);
        });
    

        // Find the next unclicked link
        const nextLinkIndex = profileLinks.findIndex((_, index) => index > lastClickedIndex);
        
        if (nextLinkIndex === -1) {
            // If we've clicked all links on this page, scroll and continue
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await page.waitForNetworkIdle();
            lastClickedIndex = -1;
            continue;
        }

        const linkToClick = profileLinks[nextLinkIndex];
        lastClickedIndex = nextLinkIndex;

        if (await isLinkVisited(linkToClick)) {
            console.log("Profile already visited, skipping");
            continue;
        }
        // Open the profile in a new tab

        await saveVisitedProfile(linkToClick);

        const profilePage = await browser.newPage();
        await profilePage.goto(linkToClick);
        await randomPause(1000, 3000);

     

        try {
            let msgBtn = null
            try {
                 msgBtn = await profilePage.waitForSelector(
                "button[data-testid='sendDMFromProfile']",
                { timeout: 5000 }

            );
        } catch (error) {
            console.log("Message button not found");
            throw new Error("Message button not found");
        } finally {
            // Follow the user
            console.log("Following user");
            let followBtn = await profilePage.waitForSelector(
                "button[aria-label^='Follow']"
            );
            await followBtn?.click();
        }

            let randomBrowseTime = Math.floor(Math.random() * (5000 - 3000 + 1) + 2000); // Random time between 5-30 seconds
            console.log(`Browsing profile page for ${randomBrowseTime / 1000} seconds`);
            await new Promise(resolve => setTimeout(resolve, randomBrowseTime));


            if (!msgBtn) {
                console.log("Message button not found");
                throw new Error("Message button not found");
            }
            // You might want to do something with msgBtn here
    


                

            const box = await msgBtn.boundingBox();

            if (!box) {
                console.log("Bounding box not found");
                throw new Error("Bounding box not found");
            }

            await profilePage.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {steps: 10});
            await randomPause(200, 500);
            await profilePage.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

            let msgPage = await browser.newPage();
            await msgPage.goto(profilePage.url());
            console.log("Message button clicked");

            try {
                let elem = await msgPage.waitForSelector(
                    `div[data-testid='DmScrollerContainer'] >>> span ::-p-text(${config.message})`,
                    { timeout: 5000 }
                );
                let text = await msgPage.waitForSelector(`div[data-testid="tweetText"]`, { timeout: 5000 });

                if (text || elem) {
                    console.log("Message already sent, skipping");
                    await msgPage.close();
                    await profilePage.close();
                    continue;
                }
  
            } catch (err) {
                console.log("Message not found, sending new message");
                UniqueProfiles += 1;
            }

            let msgBox = await msgPage.waitForSelector(
                "div.public-DraftStyleDefault-block",
                { timeout: 5000 }
            );
            await msgBox?.click();

            for (let char of config.message) {
                if (Math.random() < 0.05) {  // 5% chance of typo
                    await msgBox?.type(String.fromCharCode(char.charCodeAt(0) + 1));
                    await randomPause(200, 500);
                    await msgBox?.press('Backspace');
                    await randomPause(200, 500);
                }
                await msgBox?.type(char);
                await randomPause(50, 200);  // Variable typing speed
            }

        
            let sendBtn = await msgPage.waitForSelector(
                "button[data-testid='dmComposerSendButton']"
            );
            await sendBtn?.click();
            console.log("Message sent");

            await msgPage.waitForNetworkIdle();

            try {
                let errMsgElem = await msgPage.waitForSelector(
                    `div[data-testid='DmScrollerContainer'] >>> span ::-p-text(Message failed to send)`,
                    { timeout: 2000 }
                );
                console.log("Rate limit reached. Pausing for 15 minutes.");
                await new Promise((resolve) => setTimeout(resolve, 100 * 15 * 60));
            } catch (err) {
                // No error message found, continue as normal
            } finally {
                await msgPage.close();
                await profilePage.close();
            }
        } catch (error) {
            await profilePage.close();
            console.log("Error processing profile:", error);
        }

        if (Math.random() < 0.1) {  // 10% chance
            const width = Math.floor(Math.random() * 400) + 1000;  // 1000-1400
            const height = Math.floor(Math.random() * 300) + 600;  // 600-900
            await page.setViewport({ width, height });
        }

        // Simulate random browsing time on the search page
        const randomBrowseTime = Math.floor(Math.random() * (10000 - 3000 + 1) + 2000); // Random time between 5-30 seconds
        console.log(`Browsing search page for ${randomBrowseTime / 1000} seconds`);
        await new Promise(resolve => setTimeout(resolve, randomBrowseTime));
    }
}

    main();