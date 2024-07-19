import { randomPause } from "./randompause";

export async function humanLikeScroll(page: any) {
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
