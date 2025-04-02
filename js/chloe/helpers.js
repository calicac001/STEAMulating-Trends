function processCalendarData(gamesData){
    // Parse dates: e.g. "01-Nov-09" → Date object
    const parseDate = d3.timeParse("%d-%b-%y");

    // Convert and store as full YYYY-MM-DD
    let releasesByDay = d3.rollup(
        gamesData,
        v => v.length, // Count games per date
        d => d3.timeFormat("%Y-%m-%d")(parseDate(d["Release date"]))
    );

    // Convert to array format
    let releaseData = Array.from(releasesByDay, ([date, count]) => ({
        date: new Date(date), // Convert back to Date object
        value: count
    }));

    return releaseData;
}

// Hexbin Processing
function processHexbinData(gamesData, genresData, reviewsData, popularityData) {
    //Convert to Numbers
    reviewsData.forEach(d => d.Positive = +d.Positive);
    popularityData.forEach(d => d.Recommendations = +d.Recommendations);

    // Create a lookup map for data
    let gamesMap = new Map(gamesData.map(d => [d.AppID, d.Name]));
    let reviewMap = new Map(reviewsData.map(r => [r.AppID, r.Positive]));
    let popularityMap = new Map(popularityData.map(p => [p.AppID, p.Recommendations]));

    // Merge dataset using the lookup map and exclude games with zero reviews
    let mergedData = genresData.map(g => {
        let name = gamesMap.get(g.AppID);
        let numReviews = reviewMap.get(g.AppID) || 0; // Get number of reviews or default to 0
        let numRecommendations = popularityMap.get(g.AppID)

        if (numReviews > 0 & numRecommendations > 0) {
            return {
                AppID: g.AppID,
                name: name,
                genre: g.Genres,
                numReviews: numReviews,
                numRecommendations: numRecommendations
            };
        }
        return null; // Exclude games with zero reviews
    }).filter(d => d !== null); // Remove null values (games with zero reviews)

    return mergedData;
}

// Carousel Image Code
let activeCardElement = null;
let isTooltipActive = false;
let rafId = null;

function updateTooltipPosition(event) {
    const tooltip = document.getElementById("carousel-tooltip");

    if (!isTooltipActive || !activeCardElement) return;

    // Get the latest position of the active card
    const cardRect = activeCardElement.getBoundingClientRect();

    // Position tooltip relative to the card's current position
    // You can adjust these offsets as needed
    tooltip.style.left = cardRect.x  + "px";
    tooltip.style.top = cardRect.bottom + "px";

    // Continue the animation loop
    rafId = requestAnimationFrame(updateTooltipPosition);
}

function addTooltipForCarousel(gamesData) {
    // Parse dates: e.g. "01-Nov-09" → Date object
    const parseDate = d3.timeParse("%d-%b-%y");

    // App IDs for (in order) BM: Wukong, DragonsDogma, Hellverse, Manor, Palworld
    const appIdList = ['2358720', '2054970', '553850', '1363080', '1623730'];

    const tooltip = document.getElementById("carousel-tooltip");
    const gameContainers = document.querySelectorAll(".card img");

    gameContainers.forEach((container, index) => {
        container.addEventListener("mouseenter", function (event) {
            const appID = appIdList[index];
            const gameInfo = gamesData.find(game => game.AppID === appID);

            activeCardElement = container;
            isTooltipActive = true;

            if (gameInfo) {
                const released = d3.timeFormat("%b %d, %Y")(parseDate(gameInfo['Release date']));
                tooltip.style.visibility = "visible";
                tooltip.style.display = "block";
                tooltip.innerHTML = `<strong>${gameInfo.Name}</strong><br>
                                     Price: \$ ${gameInfo.Price} <br>
                                     Released: ${released} <br>
                                     Developer: ${gameInfo.Developers} <br>
                                     Publisher: ${gameInfo.Publishers} <br>`;


                // Start the animation frame loop
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(updateTooltipPosition);

            }
        });

        container.addEventListener("mouseleave", function () {
            tooltip.style.visibility = "hidden";
            isTooltipActive = false;
            activeCardElement = null;

            // Stop the animation frame loop
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        });
    });
}

