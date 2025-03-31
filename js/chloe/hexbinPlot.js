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
        this.colorBy = "genre";

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 30, bottom: 50, left: 60};

        // Dimensions
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Account for legend when creating the scale for x-axis
        vis.legendWidth = 150;

        // Define scales
        vis.xScale = d3.scaleLog() // Genres mapped to evenly spaced positions
            .range([0, vis.width - vis.legendWidth - 50]);

        vis.yScale = d3.scaleLog() // Reviews mapped to log scale
            .range([vis.height, 0]);

        // Create axes groups
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis");

        // X-Axis Label
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("x", vis.width / 2 - 75)
            .attr("y", vis.height + vis.margin.bottom - 5) // Adjust based on margin
            .attr("text-anchor", "middle")
            .text("Number of Recommendations (Log Scale)");

        // Y-Axis Label
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("x", -vis.height / 2)
            .attr("y", -vis.margin.left + 20) // Adjust based on margin
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Number of Reviews (Log Scale)");

        // Create a group for the legend
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width - vis.legendWidth}, 0)`);

        vis.hexbinGroup = vis.svg.append("g")
            .attr("class", "hexbin-group");

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

        if (vis.colorBy === "genre") {
            vis.genreColorScale = vis.createGenreColorScale(vis.bins);
        } else if (vis.colorBy === "num-games") {
            vis.genreColorScale = d3.scaleLog()
                .domain([1, d3.max(vis.bins, d => d.length)])  // Set the domain (min and max values)
                .range(["white", "blue"]);
        }
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Append the hexagons with the most represented genre color
        let hexbins = vis.hexbinGroup.selectAll("path")
            .data(vis.bins);

        // Merge enter and update selections
        hexbins.enter().append("path")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("d", vis.hexbin.hexagon())
            .attr("stroke", "black")
            .attr("fill", d => {
                if (vis.colorBy === "genre") {
                    const dominantGenre = vis.findDominantGenre(d);
                    return vis.genreColorScale(dominantGenre);
                } else if (vis.colorBy === "num-games") {
                    return vis.genreColorScale(d.length);
                }
            })

            .merge(hexbins)
            .transition()
            .duration(150)
            .attr("fill", () => vis.genreColorScale(
                (vis.colorBy === "genre") ? Math.random() : Math.random()*100
            )) .attr("opacity", 0.5)

            .transition()
            .duration(150)
            .attr("fill", () => vis.genreColorScale(
                (vis.colorBy === "genre") ? Math.random() : Math.random()*100
            )) .attr("opacity", 0.5)

            .transition()
            .duration(150)
            .attr("fill", () => vis.genreColorScale(
                (vis.colorBy === "genre") ? Math.random() : Math.random()*100
            ))   // Temporary flicker color
            .attr("opacity", 0.5)

            .transition()
            .duration(500)
            .attr("opacity", 1)
            .attr("fill", d => {
                if (vis.colorBy === "genre") {
                    const dominantGenre = vis.findDominantGenre(d);
                    return vis.genreColorScale(dominantGenre);
                } else if (vis.colorBy === "num-games") {
                    return vis.genreColorScale(d.length);
                }
            });

        hexbins.exit().remove();

        if (vis.colorBy === "genre") {
            vis.updateGenreLegend();
        } else if (vis.colorBy === "num-games") {
            vis.updateNumGameLegend();
        }

        // Draw X-axis
        vis.xAxisGroup.call(d3.axisBottom(vis.xScale)
            .ticks(10, ".1s"));

        // Draw Y-axis
        vis.yAxisGroup.call(d3.axisLeft(vis.yScale)
            .ticks(5, ".1s")); // Log scale formatting
    }

    findDominantGenre(bin){
        if (!bin || bin.length === 0) return;

        // Count genres in this bin
        const genreCounts = {};
        bin.forEach(point => {
            if (!genreCounts[point.genre]) genreCounts[point.genre] = 0;
            genreCounts[point.genre]++;
        });

        // Find dominant genre
        let maxCount = 0;
        let dominantGenre = null;
        Object.entries(genreCounts).forEach(([genre, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantGenre = genre;
            }
        });

        return dominantGenre;
    }

    createGenreColorScale(bins){
        let vis = this;

        // First, extract all dominant genres from the bins
        vis.displayedGenres = new Set();

        // Analyze all bins to find dominant genres without coloring yet
        bins.forEach(bin => {
            const dominantGenre = vis.findDominantGenre(bin);
            if (dominantGenre) vis.displayedGenres.add(dominantGenre);
        })

        // Convert to sorted array
        const displayedGenreArray = Array.from(vis.displayedGenres).sort();

        // To avoid similar colors at the beginning and end of the range
        // Use a partial section of the rainbow instead of the full circle
        function customRainbow(t) {
            // Use a range from 0.1 to 0.9 instead of 0 to 1
            // This avoids the full circle and prevents the red overlap
            return d3.interpolateRainbow(0.1 + t * 0.8);
        }

        // NOW create your color scale using only the displayed genres
        const genreColorScale = d3.scaleOrdinal()
            .domain(displayedGenreArray)
            .range(d3.quantize(customRainbow, displayedGenreArray.length));

        return genreColorScale;
    }

    updateGenreLegend() {
        let vis = this;

        vis.legend.selectAll(".legend-item").remove();

        const legendItemHeight = 20;
        const legendSpacing = 5;

        // Create the legend using only the displayed genres
        const displayedGenreArray = Array.from(vis.displayedGenres).sort();

        // Create legend items
        const legendItems = vis.legend.selectAll(".legend-item")
            .data(displayedGenreArray)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * (legendItemHeight + legendSpacing)})`);

        // Add colored rectangles
        legendItems.append("rect")
            .attr("width", legendItemHeight)
            .attr("height", legendItemHeight)
            .attr("fill", d => vis.genreColorScale(d))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);

        // Add text labels
        legendItems.append("text")
            .attr("class", "legend-item")
            .attr("x", legendItemHeight + 5)
            .attr("y", legendItemHeight / 2)
            .attr("dy", "0.35em") // Vertical centering
            .attr("fill", "white")
            .text(d => d);

        // Add legend title
        if (vis.legendTitle){
            vis.legendTitle.text("Genres")
        } else {
            vis.legendTitle = vis.legend.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .attr("font-weight", "bold")
                .attr("fill", "white")
                .text("Genres");
        }
    }

    updateNumGameLegend() {
        let vis = this;

        vis.legend.selectAll(".legend-item").remove();

        // Dimensions for the legend
        const legendWidth = 20;
        const legendItemHeight = 10;

        // Create the vertical legend
        const legendRect = vis.legend.selectAll("rect")
            .data(vis.genreColorScale.ticks(5))  // Divide the domain into 10 intervals
            .enter().append("rect")
            .attr("class", "legend-item")
            .attr("x", 0)
            .attr("y", (d, i) => i * legendItemHeight + 5) // Position rectangles vertically
            .attr("width", legendWidth)
            .attr("height", legendItemHeight) // Equal height for each color band
            .attr("fill", d => vis.genreColorScale(d)); // Apply the color scale

        // Add labels to the legend
        vis.legend.selectAll("text")
            .data(vis.genreColorScale.ticks(5))
            .enter().append("text")
            .attr("x", legendWidth + 10)
            .attr("y", (d, i) => (i === 1) ? 10 : i * legendItemHeight + 10)
            .attr("dy", ".35em")  // Vertically align the labels
            .attr("class", "legend-item")
            .attr("fill", "white")
            .style("text-anchor", "start")
            .text((d, i) => (i % 4 === 0 | i === 1) ? d : ""); // Format the tick labels (you can adjust the formatting)

        vis.legendTitle.text("Number of Games")
    }
}