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
    
    //console.log(releaseData);
    console.log("what")
    
    //calendarPlot = new CalendarPlot("calendar-plot", releaseData);

    createDivergingBarChart(genres, reviews);
});

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
    const topGenres = genreStats.slice(0, 15);

    console.log(topGenres)
    
    // Create the diverging bar chart
    divergingBarChart = new DivergingBarChart("diverging-bar-plot", topGenres);
    
    console.log("Diverging bar chart created");
}