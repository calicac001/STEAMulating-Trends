class DivergingBarChart {
    constructor(parentElement, data, threshold = 80, minRange = 60, maxRange = 100) {
        this.parentElement = parentElement;
        this.data = data;
        this.threshold = threshold; 
        this.minRange = minRange; 
        this.maxRange = maxRange; 
        this.margin = {top: 50, right: 150, bottom: 40, left: 200};
        this.initVis();
    }

    initVis() {
        const vis = this;

        const container = d3.select(`#${vis.parentElement}`);
        const containerWidth = container.node().getBoundingClientRect().width;
        
        vis.width = containerWidth - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;
        
        vis.svg = container.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);
      
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);
            
        vis.y = d3.scaleBand()
            .range([0, vis.height])
            .padding(0.2);
            
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);
            
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis y-axis");
            
        vis.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", vis.width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", 18)
            .attr("font-weight", "bold")
            .attr("fill", "#ffffff")  // White text for dark background
            .text("Positive Review Ratio by Game Genre");
            
        
        const legendData = [
            { label: "Above Threshold", color: "#4dabff" }, // Brighter blue for dark background
            { label: "Below Threshold", color: "#ffb366" }  // Brighter orange for dark background
        ];
        
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width + 40}, -40)`);
            
        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`); 
            
        legendItems.append("rect")
            .attr("width", 12) 
            .attr("height", 12)
            .attr("fill", d => d.color);
            
        legendItems.append("text")
            .attr("x", 18)
            .attr("y", 9)
            .attr("font-size", "11px")
            .attr("fill", "#ffffff")  // White text for dark background
            .text(d => d.label);
            
        vis.thresholdLine = vis.svg.append("line")
            .attr("class", "threshold-line")
            .attr("y1", 0)
            .attr("y2", vis.height)
            .attr("stroke", "#999999")  // Lighter gray for visibility
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "5,5");
            
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(40, 40, 40, 0.95)")  // Dark background
            .style("color", "#ffffff")  // White text
            .style("border", "1px solid #555")  // Darker border
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.5)")  // Darker shadow
            .style("opacity", 0);
            
        this.updateVis();
    }

    updateVis() {
        const vis = this;
        
        vis.data.sort((a, b) => a.positivePercentage - b.positivePercentage);
        
        vis.x.domain([vis.minRange, vis.maxRange]);
        vis.y.domain(vis.data.map(d => d.genre));
        
        // Update axes with appropriate styling for dark theme
        vis.xAxis.call(d3.axisBottom(vis.x)
            .tickFormat(d => `${d}%`)
            .ticks(5))
            .selectAll("text")
            .attr("fill", "#ffffff");  // White text
            
        vis.yAxis.call(d3.axisLeft(vis.y))
            .selectAll("text")
            .attr("fill", "#ffffff");  // White text
            
        vis.svg.selectAll(".axis line, .axis path")
            .attr("stroke", "#555555");
        
        const thresholdX = vis.x(vis.threshold);
        
        vis.thresholdLine.attr("x1", thresholdX)
            .attr("x2", thresholdX);
            
        vis.svg.selectAll(".threshold-label").remove();
        vis.svg.append("text")
            .attr("class", "threshold-label")
            .attr("x", thresholdX)
            .attr("y", vis.height + 30)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .attr("fill", "#ffffff")
            .text(`${vis.threshold}% Threshold`);
            
        const belowThresholdBars = vis.svg.selectAll(".below-threshold-bar")
            .data(vis.data)
            .join("rect")
            .attr("class", "below-threshold-bar")
            .attr("x", d => vis.x(Math.max(vis.minRange, Math.min(vis.threshold, d.positivePercentage))))
            .attr("y", d => vis.y(d.genre))
            .attr("width", d => {
                const start = Math.max(vis.minRange, Math.min(vis.threshold, d.positivePercentage));
                return vis.x(vis.threshold) - vis.x(start);
            })
            .attr("height", vis.y.bandwidth())
            .attr("fill", "#ffb366")
            .on("mouseover", function(event, d) {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                vis.tooltip.html(`
                    <strong>Genre:</strong> ${d.genre}<br>
                    <strong>Positive Reviews:</strong> ${d.positive.toLocaleString()} (${d.positivePercentage.toFixed(1)}%)<br>
                    <strong>Negative Reviews:</strong> ${d.negative.toLocaleString()} (${(100 - d.positivePercentage).toFixed(1)}%)<br>
                    <strong>Total Reviews:</strong> ${(d.positive + d.negative).toLocaleString()}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
            
        const aboveThresholdBars = vis.svg.selectAll(".above-threshold-bar")
            .data(vis.data)
            .join("rect")
            .attr("class", "above-threshold-bar")
            .attr("x", vis.x(vis.threshold))
            .attr("y", d => vis.y(d.genre))
            .attr("width", d => {
                const end = Math.min(vis.maxRange, Math.max(vis.threshold, d.positivePercentage));
                return vis.x(end) - vis.x(vis.threshold);
            })
            .attr("height", vis.y.bandwidth())
            .attr("fill", "#4dabff")
            .on("mouseover", function(event, d) {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                vis.tooltip.html(`
                    <strong>Genre:</strong> ${d.genre}<br>
                    <strong>Positive Reviews:</strong> ${d.positive.toLocaleString()} (${d.positivePercentage.toFixed(1)}%)<br>
                    <strong>Negative Reviews:</strong> ${d.negative.toLocaleString()} (${(100 - d.positivePercentage).toFixed(1)}%)<br>
                    <strong>Total Reviews:</strong> ${(d.positive + d.negative).toLocaleString()}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
            
        // Consistent percentage label positioning - always at the end of bars
        vis.svg.selectAll(".percentage-label")
            .data(vis.data)
            .join("text")
            .attr("class", "percentage-label")
            .attr("x", d => {
                // Always position at the end of the bar
                if (d.positivePercentage < vis.threshold) {
                    return vis.x(Math.min(vis.threshold, d.positivePercentage)) - 5;
                } else {
                    return vis.x(d.positivePercentage) + 5;
                }
            })
            .attr("y", d => vis.y(d.genre) + vis.y.bandwidth() / 2 + 5)
            .attr("text-anchor", d => {
                if (d.positivePercentage < vis.threshold) {
                    return "end";
                } else {
                    return "start";
                }
            })
            .attr("fill", "#ffffff")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .text(d => `${d.positivePercentage.toFixed(1)}%`);
            
        vis.svg.selectAll(".game-count-label")
            .data(vis.data)
            .join("text")
            .attr("class", "game-count-label")
            .attr("x", vis.width + 5)
            .attr("y", d => vis.y(d.genre) + vis.y.bandwidth() / 2 + 5)
            .attr("text-anchor", "start")
            .attr("font-size", "11px")
            .attr("fill", "#bbbbbb")  
            .text(d => `(${d.gameCount.toLocaleString()} games)`);
    }
}