// Load csv data
Promise.all([
    d3.csv("data/basic_info.csv"),
    d3.csv("data/categories.csv"),
    d3.csv("data/genres.csv"),
    d3.csv("data/popularity.csv"),
    d3.csv("data/review_scores.csv"),
    d3.csv("data/tags.csv")
]).then(([games, categories, genres, popularity, reviews, tags]) => {
    // Add tooltips for carousel game images
    addTooltipForCarousel(games);

    // Data for calendar heatmap
    const releaseData = processCalendarData(games);

    // Create Calendar Plot
    calendarPlot = new CalendarPlot("calendar-plot", releaseData);

    // Diverging bar Chart
    createDivergingBarChart(genres, reviews);

    // Playtime Trends Chart
    const processedPopularity = processPopularity(games, popularity, genres);
    const trendsChart = new PlaytimeTrendsChart("playtime-trends-chart", processedPopularity);

    // Create the genre filter dropdown
    setupGenreFilter(processedPopularity, trendsChart);
    const sv = new sridharViz(popularity, genres, games, tags);

    // Data for Hexbin Plot
    const hexbinData = processHexbinData(genres, reviews, popularity);

    // Create hexbin plot
    hexbinPlot = new HexbinPlot("hexbin-plot", hexbinData);

    // Attach event listener to radio buttons after creating hexbinPlot
    document.querySelectorAll('input[name="hexbin-radio"]').forEach(radio => {
        radio.addEventListener("change", () => {
            console.log("Selected:", radio.value);
            hexbinPlot.colorBy = radio.value;
            hexbinPlot.wrangleData();
        });
    });
})

// process data for review sentiment
function createDivergingBarChart(genresData, reviewsData) {
    // AppID -> reviews
    const reviewsMap = new Map();
    reviewsData.forEach(review => {

        const positive = +review.Positive || 0;
        const negative = +review.Negative || 0;

        if (positive > 0 || negative > 0) {
            reviewsMap.set(review.AppID, {
                positive: positive,
                negative: negative,
                total: positive + negative,
                positivePercentage: positive / (positive + negative) * 100
            });
        }
    });

    // genre -> games
    const genreGamesMap = new Map();
    genresData.forEach(genreEntry => {
        const genre = genreEntry.Genres;
        if (!genre) return;

        if (!genreGamesMap.has(genre)) {
            genreGamesMap.set(genre, []);
        }
        genreGamesMap.get(genre).push(genreEntry.AppID);
    });

    // calculate review statistics
    const genreStats = [];

    genreGamesMap.forEach((gameIds, genre) => {
        let totalPositive = 0;
        let totalNegative = 0;
        let gamesWithReviews = 0;

        gameIds.forEach(gameId => {
            const review = reviewsMap.get(gameId);
            if (review) {
                totalPositive += review.positive;
                totalNegative += review.negative;
                gamesWithReviews++;
            }
        });

        // Only include genres with sufficient data
        if (gamesWithReviews > 0 && (totalPositive + totalNegative) >= 100) {
            genreStats.push({
                genre: genre,
                positive: totalPositive,
                negative: totalNegative,
                gameCount: gameIds.length,
                gamesWithReviews: gamesWithReviews,
                positivePercentage: (totalPositive / (totalPositive + totalNegative)) * 100
            });
        }
    });

    genreStats.sort((a, b) => (b.positive + b.negative) - (a.positive + a.negative));
    const topGenres = genreStats.slice(0, 10);

    // Create the diverging bar chart
    divergingBarChart = new DivergingBarChart("diverging-bar-plot", topGenres);

    console.log("Diverging bar chart created");
}

function processPopularity(basicInfo, popularity, genresData) {
    // Create AppID to genres mapping
    const genresByAppId = new Map();
    genresData.forEach(entry => {
        if (entry.AppID && entry.Genres) {
            genresByAppId.set(entry.AppID, entry.Genres);
        }
    });
    
    // combine datasets
    const gameMap = new Map();

    basicInfo.forEach(game => {
        const releaseDate = parseDate(game["Release date"]);
        if (!releaseDate) return;

        const year = releaseDate.getFullYear();

        gameMap.set(game.AppID, {
            id: game.AppID,
            name: game.Name,
            releaseDate: releaseDate,
            year: year,
            developers: game.Developers,
            publishers: game.Publishers,
            medianPlaytime: 0,
            recommendations: 0,
            genre: genresByAppId.get(game.AppID) || "Unknown"
        });
    });

    popularity.forEach(game => {
        const gameInfo = gameMap.get(game.AppID);
        if (!gameInfo) return;

        // Use Median playtime forever instead of Average playtime forever
        // Convert to hours by dividing by 60
        const medianPlaytime = parseFloat(game["Median playtime forever"]) / 60;

        gameInfo.medianPlaytime = medianPlaytime;
        gameInfo.recommendations = parseInt(game.Recommendations) || 0;
    });

    const processedData = Array.from(gameMap.values())
        .filter(game => game.medianPlaytime > 0);
        
    return processedData;
}

function parseDate(dateStr) {
    try {
        const parts = dateStr.split("-");
        const day = parseInt(parts[0]);

        const months = {
            "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
            "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
        };
        const month = months[parts[1]];

        let year = parseInt(parts[2]);
        if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
        }

        return new Date(year, month, day);
    } catch (error) {
        console.error("Error parsing date:", dateStr);
        return null;
    }
}

function setupGenreFilter(data, chart) {
    // Get unique genres from data
    const allGenres = data.map(d => d.genre);
    const uniqueGenres = ["All", ...new Set(allGenres)].filter(g => g); // Remove empty genres
    
    console.log("Available genres for filter:", uniqueGenres);

    const filterContainer = document.getElementById("genre-filter");
    if (!filterContainer) {
        console.error("Genre filter container not found! Creating one...");
        
        const chartContainer = document.getElementById("playtime-trends-chart");
        if (chartContainer) {
            const filterDiv = document.createElement("div");
            filterDiv.id = "genre-filter";
            filterDiv.className = "genre-filter";
            
            const label = document.createElement("label");
            label.textContent = "Filter by Genre: ";
            
            const filterContainer = document.createElement("div");
            filterContainer.className = "filter-container";
            
            filterContainer.appendChild(label);
            filterContainer.appendChild(filterDiv);
            
            // Insert before the chart
            chartContainer.parentNode.insertBefore(filterContainer, chartContainer);
            
            console.log("Created filter container programmatically");
        } else {
            console.error("Could not find chart container either. Cannot create filter.");
            return;
        }
    }

    d3.select("#genre-filter").html("");
    
    const dropdown = d3.select("#genre-filter")
        .append("select")
        .attr("class", "genre-select")
        .attr("id", "genre-dropdown")
        .attr("aria-label", "Select genre")
        .on("change", function() {
            const selectedGenre = d3.select(this).property("value");
            console.log("Genre selected:", selectedGenre);
            chart.filterData(selectedGenre);
        });

    dropdown.selectAll("option")
        .data(uniqueGenres)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
        
    console.log("Genre filter dropdown created with", uniqueGenres.length, "options");
}

function sridharViz(popularity, genres, games, tags) {
    console.log("Sridhar's Vizs");
    let ngd = new NicheGenresDistribution(
        "#distribution-plot",
        popularity, genres, games
    );
    let bpc = new BubblePlotChart(
        "#bubble-plot-engagement",
        popularity, genres, games, tags
    );
}