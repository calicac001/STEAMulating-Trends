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
            .text("Release Year");
            
        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text("Median Playtime (hours)");
            
        vis.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", vis.width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", 16)
            .attr("font-weight", "bold")
            .text("Median Playtime Trends Over Time");
        
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.9)")
            .style("border", "1px solid #ddd")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
            .style("opacity", 0);
        
        // Create multiple line groups to handle gaps in data
        vis.linesContainer = vis.svg.append("g")
            .attr("class", "lines-container");
            
        vis.dots = vis.svg.append("g")
            .attr("class", "dots");
        
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
        
        // Calculate data points per year
        const yearlyData = Array.from(d3.group(vis.filteredData, d => d.year), ([year, games]) => {
            return {
                year: new Date(year, 0), 
                medianPlaytime: d3.median(games, d => d.medianPlaytime),
                count: games.length
            };
        });

        yearlyData.sort((a, b) => a.year - b.year);
        
        // Handle case with no data
        if (yearlyData.length === 0) {
            vis.svg.select(".no-data-message").remove();
            vis.svg.append("text")
                .attr("class", "no-data-message")
                .attr("x", vis.width / 2)
                .attr("y", vis.height / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 14)
                .text(`No data available for ${vis.selectedGenre} genre`);
                
            // Clear existing visualization
            vis.linesContainer.selectAll("*").remove();
            vis.dots.selectAll("*").remove();
            return;
        } else {
            vis.svg.select(".no-data-message").remove();
        }
        
        vis.x.domain(d3.extent(yearlyData, d => d.year));
        vis.y.domain([0, d3.max(yearlyData, d => d.medianPlaytime) * 1.1]);
        
        vis.xAxis.call(d3.axisBottom(vis.x)
            .tickFormat(d3.timeFormat("%Y")));
            
        vis.yAxis.call(d3.axisLeft(vis.y)
            .ticks(5)
            .tickFormat(d => `${d}h`));
        
        vis.linesContainer.selectAll("*").remove();
        
        const segments = [];
        let currentSegment = [];
        // TODO: sometimes the segments are still disconnected
        for (let i = 0; i < yearlyData.length; i++) {
            const current = yearlyData[i];
            
            if (currentSegment.length === 0) {
                currentSegment.push(current);
                continue;
            }
            
            const lastPoint = currentSegment[currentSegment.length - 1];
            const yearDiff = current.year.getFullYear() - lastPoint.year.getFullYear();
            
            // If gap is 1 year or less, continue segment
            if (yearDiff <= 1) {
                currentSegment.push(current);
            } else {
                // Gap is too large, end segment and start new one
                segments.push([...currentSegment]);
                currentSegment = [current];
            }
        }
        
        // Add the last segment if it has points
        if (currentSegment.length > 0) {
            segments.push(currentSegment);
        }

        const line = d3.line()
            .x(d => vis.x(d.year))
            .y(d => vis.y(d.medianPlaytime))
            .curve(d3.curveMonotoneX);
            
        segments.forEach((segment, i) => {
            vis.linesContainer.append("path")
                .datum(segment)
                .attr("class", "trend-line")
                .attr("fill", "none")
                .attr("stroke", "#4682b4")
                .attr("stroke-width", 2)
                .attr("d", line);
        });
            
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
            .attr("fill", "#4682b4")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("r", 7)
                    .attr("fill", "#ff7f0e");
                    
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
                    .attr("fill", "#4682b4");
                    
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }
}