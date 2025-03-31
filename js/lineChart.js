class PlaytimeTrendsChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.filteredData = data;
        this.selectedGenre = "All";
        this.margin = {top: 40, right: 50, bottom: 60, left: 60};
        this.initVis();
    }

    initVis() {
        const vis = this;

        const container = d3.select(`#${vis.parentElement}`);
        const containerWidth = container.node().getBoundingClientRect().width;
        
        vis.width = containerWidth - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;
        
        vis.svg = container.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);
      
        vis.x = d3.scaleTime()
            .range([0, vis.width]);
            
        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);
            
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);
            
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis y-axis");
        
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .text("Release Year");
            
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .text("Median Playtime (hours)");
            
        vis.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", vis.width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .attr("font-weight", "bold")
            .attr("fill", "#ffffff")
            .text("Median Playtime Trends Over Time");
        
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(40, 40, 40, 0.95)")
            .style("color", "#ffffff")
            .style("border", "1px solid #555")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.5)")
            .style("opacity", 0);
        
        // Create line and area paths
        vis.linePath = vis.svg.append("path")
            .attr("class", "trend-line")
            .attr("fill", "none")
            .attr("stroke", "#4dabff")  // Brighter blue for dark background
            .attr("stroke-width", 2.5);
            
        vis.dots = vis.svg.append("g")
            .attr("class", "dots");
        
        // Add a gradient for the area below the line
        const gradient = vis.svg.append("defs")
            .append("linearGradient")
            .attr("id", "area-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "0%").attr("y2", "100%");
            
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#4dabff")
            .attr("stop-opacity", 0.3);
            
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#4dabff")
            .attr("stop-opacity", 0.05);
            
        vis.areaPath = vis.svg.append("path")
            .attr("class", "trend-area")
            .attr("fill", "url(#area-gradient)")
            .attr("opacity", 0.7);
        
        // Create a clip path to ensure area doesn't exceed chart bounds
        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);
            
        this.updateVis();
    }

    filterData(genre) {
        const vis = this;
        vis.selectedGenre = genre;
        
        if (genre === "All") {
            vis.filteredData = vis.data;
        } else {
            vis.filteredData = vis.data.filter(d => d.genre === genre);
        }
        
        vis.updateVis();
    }

    updateVis() {
        const vis = this;
        
        // Filter out entries with NaN years
        const validData = vis.filteredData.filter(d => !isNaN(d.year) && d.year !== null);
        
        // Calculate data points per year and ensure they have valid values
        const yearlyData = Array.from(d3.group(validData, d => d.year), ([year, games]) => {
            return {
                year: new Date(parseInt(year), 0), // Use parseInt to ensure year is a number
                medianPlaytime: d3.median(games, d => d.medianPlaytime),
                count: games.length
            };
        })
        .filter(d => !isNaN(d.year.getTime()) && d.medianPlaytime !== null && d.medianPlaytime !== undefined)
        .sort((a, b) => a.year - b.year);
        
        // Handle case with no data
        if (yearlyData.length === 0) {
            vis.svg.select(".no-data-message").remove();
            vis.svg.append("text")
                .attr("class", "no-data-message")
                .attr("x", vis.width / 2)
                .attr("y", vis.height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 14)
                .attr("fill", "#ffffff")
                .text(`No data available for ${vis.selectedGenre} genre`);
                
            // Clear existing visualization
            vis.linePath.attr("d", "");
            vis.areaPath.attr("d", "");
            vis.dots.selectAll("*").remove();
            return;
        } else {
            vis.svg.select(".no-data-message").remove();
        }
        
        // Set x and y domains based on data
        vis.x.domain(d3.extent(yearlyData, d => d.year));
        vis.y.domain([0, d3.max(yearlyData, d => d.medianPlaytime) * 1.1]);
        
        // Update axes with appropriate styling for dark theme
        vis.xAxis.call(d3.axisBottom(vis.x)
            .tickFormat(d3.timeFormat("%Y")))
            .selectAll("text")
            .attr("fill", "#ffffff");
            
        vis.yAxis.call(d3.axisLeft(vis.y)
            .ticks(5)
            .tickFormat(d => `${d}h`))
            .selectAll("text")
            .attr("fill", "#ffffff");
            
        // Style all axis lines
        vis.svg.selectAll(".axis line, .axis path")
            .attr("stroke", "#555555");
            
        // The key to smooth connections - ensure we have points for EVERY displayed tick year
        const xTicks = vis.x.ticks(d3.timeYear);
        const interpolatedData = [];
        
        xTicks.forEach(tickYear => {
            // Find existing data point for this year
            const existing = yearlyData.find(d => d.year.getFullYear() === tickYear.getFullYear());
            
            if (existing) {
                // Use the actual data point if it exists
                interpolatedData.push(existing);
            } else {
                // Check if this tick year is within the range of years we have data for
                const minYear = d3.min(yearlyData, d => d.year.getFullYear());
                const maxYear = d3.max(yearlyData, d => d.year.getFullYear());
                
                if (tickYear.getFullYear() >= minYear && tickYear.getFullYear() <= maxYear) {
                    // Find the closest points before and after
                    const before = yearlyData.filter(d => d.year.getFullYear() < tickYear.getFullYear())
                        .sort((a, b) => b.year - a.year)[0];
                    const after = yearlyData.filter(d => d.year.getFullYear() > tickYear.getFullYear())
                        .sort((a, b) => a.year - b.year)[0];
                    
                    if (before && after) {
                        // Calculate weighted average based on distance
                        const beforeYear = before.year.getFullYear();
                        const afterYear = after.year.getFullYear();
                        const totalDist = afterYear - beforeYear;
                        const weightAfter = (tickYear.getFullYear() - beforeYear) / totalDist;
                        const weightBefore = 1 - weightAfter;
                        
                        const interpolatedValue = 
                            (before.medianPlaytime * weightBefore) + 
                            (after.medianPlaytime * weightAfter);
                            
                        // Add interpolated point
                        interpolatedData.push({
                            year: tickYear,
                            medianPlaytime: interpolatedValue,
                            count: 0, // Mark as interpolated with zero count
                            interpolated: true
                        });
                    }
                }
            }
        });
        
        // If we have any interpolated data and at least 2 original data points, use it
        const dataToUse = (interpolatedData.length > 0 && yearlyData.length >= 2) 
            ? interpolatedData.sort((a, b) => a.year - b.year) 
            : yearlyData;
            
        // Line and area generators
        const line = d3.line()
            .x(d => vis.x(d.year))
            .y(d => vis.y(d.medianPlaytime))
            .curve(d3.curveMonotoneX); // Smoother curve
            
        const area = d3.area()
            .x(d => vis.x(d.year))
            .y0(vis.height)
            .y1(d => vis.y(d.medianPlaytime))
            .curve(d3.curveMonotoneX);
            
        // Update paths with interpolated data for smooth connections
        vis.linePath.datum(dataToUse)
            .attr("d", line);
            
        vis.areaPath.datum(dataToUse)
            .attr("d", area);
            
        // Only show dots for actual data points (not interpolated ones)
        const dots = vis.dots.selectAll(".data-point")
            .data(yearlyData);
            
        dots.exit().remove();
        
        dots.enter()
            .append("circle")
            .attr("class", "data-point")
            .merge(dots)
            .attr("cx", d => vis.x(d.year))
            .attr("cy", d => vis.y(d.medianPlaytime))
            .attr("r", 5)
            .attr("fill", "#4dabff")  // Brighter blue for dark background
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("r", 7)
                    .attr("fill", "#ffb366");  // Brighter orange for dark background
                    
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                    
                vis.tooltip.html(`
                    <strong>Year:</strong> ${d.year.getFullYear()}<br>
                    <strong>Median Playtime:</strong> ${d.medianPlaytime.toFixed(1)} hours<br>
                    <strong>Games:</strong> ${d.count}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("r", 5)
                    .attr("fill", "#4dabff");  // Brighter blue for dark background
                    
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }
}