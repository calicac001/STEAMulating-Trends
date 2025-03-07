// Load csv data
Promise.all([
    d3.csv("data/basic_info.csv"),
    d3.csv("data/categories.csv"),
    d3.csv("data/genres.csv"),
    d3.csv("data/popularity.csv"),
    d3.csv("data/review_scores.csv"),
    d3.csv("data/tags.csv")
]).then(([games, categories, genres, popularity, reviews, tags]) => {
    // Data for calendar heatmap

    // Parse dates: e.g. "01-Nov-09" → Date object
    let parseDate = d3.timeParse("%d-%b-%y");

    // Convert and store as full YYYY-MM-DD
    let releasesByDay = d3.rollup(
        games,
        v => v.length, // Count games per date
        d => d3.timeFormat("%Y-%m-%d")(parseDate(d["Release date"]))
    );

    // Convert to array format
    let releaseData = Array.from(releasesByDay, ([date, count]) => ({
        date: new Date(date), // Convert back to Date object
        value: count
    }));
    
    console.log(releaseData);
    
    calendarPlot = new CalendarPlot("calendar-plot", releaseData);

    createDivergingBarChart(genres, reviews);
    const processedPopularity = processPopularity(games, popularity);

    const trendsChart = new PlaytimeTrendsChart("playtime-trends-chart", processedPopularity);

    // TODO: this isnt working, to be fixed
    setupGenreFilter(processedPopularity, trendsChart);

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

    console.log("helo")

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

    console.log(topGenres)

    // Create the diverging bar chart
    divergingBarChart = new DivergingBarChart("diverging-bar-plot", topGenres);

    console.log("Diverging bar chart created");
}

function processPopularity(basicInfo, popularity) {
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
            avgPlaytime: 0,
            recommendations: 0
        });
    });

    popularity.forEach(game => {
        const gameInfo = gameMap.get(game.AppID);
        if (!gameInfo) return;

        const avgPlaytime = parseFloat(game["Average playtime forever"]) / 60;

        gameInfo.avgPlaytime = avgPlaytime;
        gameInfo.recommendations = parseInt(game.Recommendations) || 0;
    });

    //TODO: change this after prototype v1 to use actual data
    const genres = ["Action", "Adventure", "RPG", "Strategy", "Simulation", "Sports", "Casual"];

    const processedData = Array.from(gameMap.values())
        .filter(game => game.avgPlaytime > 0)
        .map(game => {
            game.genre = genres[Math.floor(Math.random() * genres.length)];
            return game;
        });

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

    const genres = ["All", ...new Set(data.map(d => d.genre))];

    const dropdown = d3.select("#genre-filter")
        .append("select")
        .attr("class", "genre-select")
        .on("change", function () {
            const selectedGenre = d3.select(this).property("value");
            chart.filterData(selectedGenre);
        });

    dropdown.selectAll("option")
        .data(genres)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
}