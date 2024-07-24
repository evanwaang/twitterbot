import puppeteer from "puppeteer-extra";
import { readFile } from "fs/promises";
import { Protocol, ElementHandle } from "puppeteer";
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import { randomPause } from "./utils/randompause";
import { humanLikeScroll } from "./utils/scroll";
import { profileFollowers } from "./utils/nextPage";
import config from "./config";
const fs = require('fs');

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

async function checkAndUnfollowUser(browser: any, username: any) {
    const page = await browser.newPage();
    await page.goto(`https://x.com/${username}`);
    await page.waitForNetworkIdle();
    let unfollowedCount = 0;
    try {
        // Check if "Follows you" indicator is present
        const followsYouIndicator = await page.$('div[data-testid="userFollowIndicator"]');
        
        if (!followsYouIndicator) {
            // If "Follows you" is not present, unfollow the user
            const followingButton = await page.waitForSelector('button[aria-label^="Following @"]', { timeout: 1000 });
            if (followingButton) {
                await followingButton.click();
                const unfollowButton = await page.waitForSelector('button[data-testid="confirmationSheetConfirm"]', { timeout: 1000 });
                if (unfollowButton) {
                    await unfollowButton.click();
                    await randomPause(1000, 4500);
                    unfollowedCount++;
                    console.log(`Unfollowed user. Total unfollowed: ${unfollowedCount}`);
                }
                
                console.log(`Unfollowed ${username}`);
            }
        } else {
            console.log(`${username} follows you. Not unfollowing.`);
        }
    } catch (error) {
        console.error(`Error processing ${username}: ${error.message}`);
    } finally {
        await page.close();
    }
}
async function main() {
    const browser = await puppeteer.launch(options);
    let cookies = await readFile("cookies.json", {
        encoding: "utf8",
    });
    let cookieJson: Protocol.Network.CookieParam[] = JSON.parse(cookies);
    let mainPage = await browser.newPage();

    await mainPage.setViewport({ width: 1200, height: 720 });
    await mainPage.setCookie(...cookieJson);
    await mainPage.setRequestInterception(true);

    mainPage.on('request', async (request) => {
        if (request.resourceType() === 'image') {
            await request.abort();
        } else {
            await request.continue();
        }
    });

    // Navigate to your profile
    await mainPage.goto(`https://x.com/Squidwardbee/following`);
    await mainPage.waitForNetworkIdle();

    let processedCount = 0;
    let lastProcessedUsername = '';

    while (true) {
        // Get all user cells
        const userCells = await mainPage.$$('button[data-testid="UserCell"]');

        let newProfilesProcessed = false;

        for (let i = 0; i < userCells.length; i++) {
            const userCell = userCells[i];
            
            // Extract username from the user cell
            const username = await userCell.$eval('div[dir="auto"][style="display: none;"]', (el) => {
                const text = el.textContent;
                if (text && text.startsWith("Click to Unfollow ")) {
                    return text.replace("Click to Unfollow ", "");
                }
                return null;
            });

            if (username && username !== lastProcessedUsername) {
                await checkAndUnfollowUser(browser, username);
                await randomPause(2000, 3);
                processedCount++;
                lastProcessedUsername = username;
                newProfilesProcessed = true;
            } else if (username === lastProcessedUsername) {
                // We've reached profiles we've already processed
                break;
            } else {
                console.log("Couldn't extract username, skipping...");
            }
        }

        if (!newProfilesProcessed) {
            // If we didn't process any new profiles in this iteration, we're probably at the end
            console.log("No new profiles found. Ending process.");
            break;
        }

        // Scroll down to load more
        await mainPage.evaluate(() => window.scrollBy(0, window.innerHeight));
        await randomPause(2000, 3000);

        // Optional: you can add a condition to stop after processing a certain number of profiles
        if (processedCount >= 1000) {  // Change this number as needed
            console.log(`Processed ${processedCount} profiles. Stopping.`);
            break;
        }
    }

    console.log(`Unfollowing process completed. Processed ${processedCount} profiles.`);

    await browser.close();
}

main();