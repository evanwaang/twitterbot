export async function randomPause(min: number, max: number) {
    const pause = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, pause));
};