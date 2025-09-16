let configuration;



window.gameData = {}



async function loadConfiguration() {
    const result = await fetch("configuration.json");
    configuration = await result.json();
}



async function fetchURL(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}



async function fetchGameData(placeID) {
    const data = await fetchURL(configuration.Backend + "/game/" + placeID);
    return data;
}



async function fetchGameThumbnail(universeID) {
    const data = await fetchURL(configuration.Backend + "/thumbnail/" + universeID);
    return data;
}



async function fetchGameLikes(universeID) {
    const data = await fetchURL(configuration.Backend + "/likes/" + universeID);
    return data;
}



async function fetchGameDataWithRetry(placeID, retries = 3, delayMs = 500) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const data = await fetchGameData(placeID);

            if (!data?.data?.[0]) throw new Error("Invalid game data");

            const gameLikesData = await fetchGameLikes(data.data[0].id);

            if (!gameLikesData?.data?.[0]) throw new Error("Invalid likes data");

            return {
                 ...data.data[0],
                upVotes: gameLikesData.data[0].upVotes || 0,
                downVotes: gameLikesData.data[0].downVotes || 0
            };
        } catch (error) {
            console.warn(`Attempt ${attempt} failed for place ${placeID}: ${error.message}`);
            if (attempt < retries) await new Promise(r => setTimeout(r, delayMs));
        }
    }

    console.error(`All attempts failed for place ${placeID}`);
    return null;
 }



async function main() {
    await loadConfiguration();

    window.username = configuration.Username;
    window.icon = configuration.Icon;
    window.contactLink = configuration.Contact;

    for (const placeID of configuration.Games) {
        const gameData = await fetchGameDataWithRetry(placeID);
        if (gameData) {
            window.gameData[placeID] = gameData;
        }
    }

    const elements = document.querySelectorAll('[game-id]');
    elements.forEach(element => {
        const placeID = element.getAttribute('game-id');
        const field = element.getAttribute('game-display');

        if (window.gameData[placeID] && field in window.gameData[placeID]) {
            element.textContent = window.gameData[placeID][field];
        }
    });
}