const fs = require('fs').promises;
const path = require('path');

const VISITED_PROFILES_FILE = 'visited_profiles.json';

// Function to load visited profiles from JSON file
export async function loadVisitedProfiles() {
    try {
        const data = await fs.readFile(VISITED_PROFILES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, return an empty array
        return [];
    }
}

// Function to save visited profiles to JSON file
export async function saveVisitedProfile(profileLink: any) {
    const visitedProfiles = await loadVisitedProfiles();
    if (!visitedProfiles.includes(profileLink)) {
        visitedProfiles.push(profileLink);
        await fs.writeFile(VISITED_PROFILES_FILE, JSON.stringify(visitedProfiles, null, 2));
    }
}


export async function isLinkVisited(link: any) {
    try {
        // Read the contents of the JSON file
        const data = await fs.readFile(VISITED_PROFILES_FILE, 'utf8');
        
        // Parse the JSON data
        const visitedLinks = JSON.parse(data);
        
        // Check if the link is in the array
        return visitedLinks.includes(link);
    } catch (error) {
        // If the file doesn't exist or there's an error reading it,
        // assume the link hasn't been visited
        if (error.code === 'ENOENT') {
            return false;
        }
        // For other errors, log and re-throw
        console.error('Error checking visited links:', error);
        throw error;
    }
}