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
    
    //calendarPlot = new CalendarPlot("calendar-plot", releaseData);
})