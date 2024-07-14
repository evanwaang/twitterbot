import puppeteer from "puppeteer-extra";
import { readFile } from "fs/promises";
import { Protocol, ElementHandle } from "puppeteer";
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import config from "./config";
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
// async function main() {
//     const browser = await puppeteer.launch(options);
//     let cookies = await readFile("cookies2.json", {
//         encoding: "utf8",
//     });
//     let cookieJson: Protocol.Network.CookieParam[] = JSON.parse(cookies);
//     let page = await browser.newPage();
//     await page.setViewport({ width: 1200, height: 720 });
//     await page.setCookie(...cookieJson);

//     // await page.setExtraHTTPHeaders({
//     //     'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', 
//     //     'upgrade-insecure-requests': '1', 
//     //     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 
//     //     'accept-encoding': 'gzip, deflate, br', 
//     //     'accept-language': 'en-US,en;q=0.9,en;q=0.8' 
//     // });
//        await page.setRequestInterception(true);
//     page.on('request', async (request) => {
//         if (request.resourceType() === 'image') {
//             await request.abort();
//         } else {
//             await request.continue();
//         }
//     });

//     // open the search page
//     await page.goto(
//         `https://twitter.com/search?q=${config.searchQuery}&src=recent_search_click&f=live`
//     );
//     await page.waitForNetworkIdle();

//     //create an async iterator object to iterate over the page to find links
//     let asycPageIteratorObj = {
//         [Symbol.asyncIterator]: function () {
//             return {
//                 async next() {
//                     let profileLinkFinderScriptResult = await page.evaluate(
//                         () => {
//                             let lastLinkElemPos = Number(
//                                 localStorage.getItem("lastLinkElemPos")
//                             );
//                             console.log(lastLinkElemPos);
//                             let newProfileLinks: string[] = [];
//                             let profilePageLinkRegEx = /^\/[0-9A-Za-z]+$/;
//                             let allElementsWithLinks =
//                                 document.querySelectorAll("div[data-testid='primaryColumn'] a[role='link']");
//                             allElementsWithLinks.forEach((elem, index) => {
//                                 let profileLink = elem.getAttribute("href");
//                                 if (profileLink?.match(profilePageLinkRegEx)) {
//                                     if (
//                                         !(
//                                             profileLink == "/home" ||
//                                             profileLink == "/explore" ||
//                                             profileLink == "/notifications" ||
//                                             profileLink == "/messages"
//                                         )
//                                     ) {
//                                         newProfileLinks.push(
//                                             "https://twitter.com" + profileLink
//                                         );
//                                     }
//                                 }
//                             });
//                             allElementsWithLinks[
//                                 allElementsWithLinks.length - 1
//                             ].scrollIntoView();
//                             return newProfileLinks;
//                         }
//                     );
//                     return {
//                         done: false,
//                         value: profileLinkFinderScriptResult,
//                     };
//                 },
//             };
//         },
//     };
//     let visitedUrls: Set<string> = new Set();
//     for await (let profileLinks of asycPageIteratorObj) {
//         let profileLinksSet: Set<string> = new Set(profileLinks);
//         console.log(profileLinksSet)
//         innerloop: for (let link of profileLinksSet) {
//             // Continue the loop is the url is already visited in the current run
//             if(visitedUrls.has(link)){
//                 continue;
//             }

//             //Open the profile page in new tab
//             let profilePage = await browser.newPage();
//             await profilePage.goto(link);
            
//             // Add the link into the visited urls Set to prevent it from opening again and again


//             visitedUrls.add(link);
//             try {
//                 let msgBtn = await profilePage.waitForSelector(
//                     "button[data-testid='sendDMFromProfile']",
//                     {
//                         timeout: 5000,
//                     }
//                 );
//                 await msgBtn!.click();
//                 let msgPage = await browser.newPage();
//                 await msgPage.goto(profilePage.url());
//                 try {
//                     let elem = await msgPage.waitForSelector(
//                         `div[data-testid='DmScrollerContainer'] >>> span ::-p-text(${config.message})`,
//                         {
//                             timeout: 10000,
//                         }
//                     );
//                     msgPage.close().then(() => {
//                         profilePage.close()
//                     })
//                     continue innerloop;
//                 } catch (err) {
//                     console.log(err)
//                 }
//                 let msgBox = await msgPage.waitForSelector(
//                     "div.public-DraftStyleDefault-block",
//                     {
//                         timeout: 5000,
//                     }
//                 );
//                 await msgBox?.click();
//                 await msgBox?.type(config.message);
//                 let sendBtn = await msgPage.waitForSelector(
//                     "button[data-testid='dmComposerSendButton']"
//                 );
//                 await sendBtn?.click();
//                 console.log("Message sent");
//                 msgPage.waitForNetworkIdle().then(async () => {
//                     /* 
//                     Check for the rate limitation message, and only proceed further if the rate limitation
//                     is not reached otherwise pause the script for 15 minutes
//                     */
//                    try{
//                     let errMsgElem = await msgPage.waitForSelector(`div[data-testid='DmScrollerContainer'] >>> span ::-p-text(Message failed to send)`,{
//                         timeout: 2000
//                     });
//                     await new Promise((resolve) => {
//                         console.log("Script paused for 15 minutes")
//                         setTimeout(() => resolve(true), 1000 * 15 * 60);
//                     })
//                    }catch(err){

//                    }finally{
//                     await msgPage.close();
//                     await profilePage.close();
//                    }
//                 });
//             } catch (error) {
//                 await profilePage.close();
//                 console.log(error);
//             }
//         }

//         await page.waitForNetworkIdle();
//     }
// }

// main();


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


async function main() {

    const randomPause = async (min: number, max: number) => {
        const pause = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(resolve => setTimeout(resolve, pause));
    };

    const humanLikeScroll = async (page: any) => {
        await page.evaluate(() => {
            const distance = Math.floor(Math.random() * window.innerHeight * 0.7) + window.innerHeight * 0.3;
            const duration = Math.floor(Math.random() * 1000) + 500;
            let scrolled = 0;
            const timer = setInterval(() => {
                window.scrollBy(0, 10);
                scrolled += 10;
                if (scrolled >= distance) clearInterval(timer);
            }, duration / (distance / 10));
        });
        await randomPause(500, 1500);
    };

    // launch browser
    const browser = await puppeteer.launch(options);
    let cookies = await readFile("cookies.json", {
        encoding: "utf8",
    });
    let cookieJson: Protocol.Network.CookieParam[] = JSON.parse(cookies);
    let page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 720 });
    await page.setCookie(...cookieJson);


    // block images
    await page.setRequestInterception(true);
    page.on('request', async (request) => {
        if (request.resourceType() === 'image') {
            await request.abort();
        } else {
            await request.continue();
        }
    });

    // open the search page
    if (config.searchQuery.startsWith('#')) {
        await page.goto(
            `https://x.com/hashtag/${config.searchQuery.substring(1)}?src=hashtag_click&f=live`
        );
    } else {
        await page.goto(
            `https://twitter.com/search?q=${config.searchQuery}&src=recent_search_click&f=live`
        );
    }
    await page.waitForNetworkIdle();

    
    // Find all profile links on the search page
    let lastClickedIndex = -1;

    while (true) {
        await humanLikeScroll(page);
        await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
        // Find all profile links on the current search page
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

        // Open the profile in a new tab
        const profilePage = await browser.newPage();
        await profilePage.goto(linkToClick);
        await randomPause(1000, 3000);

        try {
            let msgBtn = await profilePage.waitForSelector(
                "button[data-testid='sendDMFromProfile']",
                { timeout: 5000 }
            );

                    
            if (!msgBtn) {
                console.log("Message button not found");
                throw new Error("Message button not found");
            }

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

            try {
                let elem = await msgPage.waitForSelector(
                    `div[data-testid='DmScrollerContainer'] >>> span ::-p-text(${config.message})`,
                    { timeout: 5000 }
                );
                await msgPage.close();
                await profilePage.close();
                continue;
            } catch (err) {
                console.log("Message not found, sending new message");
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
        const randomBrowseTime = Math.floor(Math.random() * (10000 - 3000 + 1) + 5000); // Random time between 5-30 seconds
        console.log(`Browsing search page for ${randomBrowseTime / 1000} seconds`);
        await new Promise(resolve => setTimeout(resolve, randomBrowseTime));
    }
}

    main();