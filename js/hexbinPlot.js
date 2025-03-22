/*
 * HexbinPlot - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the hexbin plot
 * @param _data			    -- the dataset holding genres and number of reviews
 *
 * Code Derived from https://observablehq.com/@d3/hexbin
 */

class HexbinPlot {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.displayData = [];

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 30, bottom: 50, left: 50};

        // Dimensions
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Define scales
        vis.xScale = d3.scaleLog() // Genres mapped to evenly spaced positions
            .range([0, vis.width-200]);

        vis.yScale = d3.scaleLog() // Reviews mapped to log scale
            .range([vis.height, 0]);

        // Get unique genres from your data (adjust this if you already have a list of genres)
        const genres = Array.from(new Set(vis.data.map(d => d.genre)));

        // Generate as many colors as needed using interpolation
        // const genreCount = genres.length;
        // const colorRange = d3.quantize(d3.interpolateRainbow, genreCount);

        // Create a color scale for genres
        vis.genreColor = d3.scaleOrdinal(d3.schemeCategory10);

        //vis.genreColor = d3.scaleOrdinal(d3.schemePaired);

        // Create axes groups
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis");

        // Create color legend for the genre
        vis.legendWidth = 200;
        vis.legendHeight = 20;
        vis.legendSpacing = 25;

        // Create a group for the legend
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width-100}, 0)`);

        // Load & process data
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        vis.displayData = vis.data; //.filter(d => d.genre === "Casual");

        // Convert data for hexbin
        vis.displayData = vis.displayData.map(d => ({
            x: Math.max(1, d.numRecommendations), // Genre mapped to numeric x position
            y: Math.max(1, d.numReviews) // Ensure no log(0) issues
        }));

        // Update y domain based on processed review counts
        vis.xScale.domain([70, d3.max(vis.displayData, d => d.x)]);
        vis.yScale.domain([1, d3.max(vis.displayData, d => d.y)]);

        // Create hexbin function
        vis.hexbin = d3.hexbin()
            .x(d => vis.xScale(d.numRecommendations))
            .y(d => vis.yScale(d.numReviews))
            .radius(10);  // You can adjust the radius as needed

        // Bin the data
        vis.bins = vis.hexbin(vis.data); //.filter(d => d.genre === "Casual")

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Draw X-axis
        vis.xAxisGroup.call(d3.axisBottom(vis.xScale)
            .ticks(5, ".1s"));

        // Draw Y-axis
        vis.yAxisGroup.call(d3.axisLeft(vis.yScale)
            .ticks(5, ".1s")); // Log scale formatting

        const displayedGenres = new Set();

        // Append the hexagons with the most represented genre color
        vis.svg.selectAll("path")
            .data(vis.bins)
            .enter().append("path")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("d", vis.hexbin.hexagon())
            .attr("fill", d => {
                // Handle empty bins
                if (!d || d.length === 0) return "#eee"; // Default color for empty bins

                // Count genre occurrences in this bin
                const genreCounts = {};
                d.forEach(point => {
                    if (!genreCounts[point.genre]) genreCounts[point.genre] = 0;
                    genreCounts[point.genre]++;
                });

                // Find the most common genre
                let maxCount = 0;
                let dominantGenre = null;
                Object.entries(genreCounts).forEach(([genre, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        dominantGenre = genre;
                    }
                });

                if (!displayedGenres.has(dominantGenre)) {
                    displayedGenres.add(dominantGenre);
                }

                // Return color for the dominant genre
                return vis.genreColor(dominantGenre);
            })
            .attr("stroke", "black");

        vis.updateLegend(displayedGenres);
    }

    updateLegend(displayedGenres) {
        let vis = this;

        const legendItemHeight = 20;
        const legendSpacing = 5;

        // Create the legend using only the displayed genres
        const displayedGenreArray = Array.from(displayedGenres).sort();

        // Create legend items
        const legendItems = vis.legend.selectAll(".legend-item")
            .data(displayedGenreArray)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * (legendItemHeight + legendSpacing)})`);

        // Add colored rectangles
        legendItems.append("rect")
            .attr("width", vis.legendHeight)
            .attr("height", vis.legendHeight)
            .attr("fill", d => vis.genreColor(d))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);

        // Add text labels
        legendItems.append("text")
            .attr("x", vis.legendHeight + 5)
            .attr("y", vis.legendHeight / 2)
            .attr("dy", "0.35em") // Vertical centering
            .attr("fill", "white")
            .text(d => d);

        // Add legend title
        vis.legend.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text("Genres");
    }

}