import config from "../config";


export async function nextPage(page: any, termIndex: number) {

    let searchQuery = config.searchQuery[termIndex];

    if (searchQuery.startsWith('#')) {
        await page.goto(
            `https://x.com/hashtag/${searchQuery.substring(1)}?src=hashtag_click&f=live`
        );
    } else {
        await page.goto(
            `https://twitter.com/${searchQuery}`
        );
    }

}

export async function profileFollowers(page: any, profile: string) {
    await page.goto(
        `https://twitter.com/${profile}`
    );
}
