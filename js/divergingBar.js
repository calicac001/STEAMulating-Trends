class DivergingBarChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.margin = {top: 50, right: 150, bottom: 40, left: 200};
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Calculate inner dimensions
        const container = d3.select(`#${vis.parentElement}`);
        const containerWidth = container.node().getBoundingClientRect().width;
        
        vis.width = containerWidth - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;
        
        // Create SVG element
        vis.svg = container.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);
        
        // Add scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);
            
        vis.y = d3.scaleBand()
            .range([0, vis.height])
            .padding(0.2);
            
        // Add axes groups
        vis.xAxis = vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);
            
        vis.yAxis = vis.svg.append("g")
            .attr("class", "axis y-axis");
            
        // Add title
        vis.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", vis.width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", 18)
            .attr("font-weight", "bold")
            .text("Review Sentiment by Game Genre");
            
        // Add legend
        const legendData = [
            { label: "Positive", color: "#2ca02c" },
            { label: "Negative", color: "#d62728" }
        ];
        
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width + 20}, 0)`);
            
        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`);
            
        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => d.color);
            
        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .text(d => d.label);
            
        // Add 50% threshold line
        vis.thresholdLine = vis.svg.append("line")
            .attr("class", "threshold-line")
            .attr("y1", 0)
            .attr("y2", vis.height)
            .attr("stroke", "#000")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");
            
        // Add tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("opacity", 0);
            
        // Update the visualization
        this.updateVis();
    }

    updateVis() {
        const vis = this;
        
        // Sort data by positive percentage
        vis.data.sort((a, b) => a.positivePercentage - b.positivePercentage);
        
        // Update scales
        vis.x.domain([0, 100]);
        vis.y.domain(vis.data.map(d => d.genre));
        
        // Update axes
        vis.xAxis.call(d3.axisBottom(vis.x)
            .tickFormat(d => `${d}%`)
            .ticks(10));
            
        vis.yAxis.call(d3.axisLeft(vis.y));
        
        // Update threshold line
        vis.thresholdLine.attr("x1", vis.x(50))
            .attr("x2", vis.x(50));
            
        // Add label for threshold
        vis.svg.selectAll(".threshold-label").remove();
        vis.svg.append("text")
            .attr("class", "threshold-label")
            .attr("x", vis.x(50))
            .attr("y", vis.height + 30)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .text("50% Threshold");
            
        // Draw negative bars (to the left of threshold)
        const negativeBars = vis.svg.selectAll(".negative-bar")
            .data(vis.data)
            .join("rect")
            .attr("class", "negative-bar")
            .attr("x", d => vis.x(Math.min(50, d.positivePercentage)))
            .attr("y", d => vis.y(d.genre))
            .attr("width", d => vis.x(50) - vis.x(Math.min(50, d.positivePercentage)))
            .attr("height", vis.y.bandwidth())
            .attr("fill", "#d62728")
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
            
        // Draw positive bars (to the right of threshold)
        const positiveBars = vis.svg.selectAll(".positive-bar")
            .data(vis.data)
            .join("rect")
            .attr("class", "positive-bar")
            .attr("x", vis.x(50))
            .attr("y", d => vis.y(d.genre))
            .attr("width", d => vis.x(Math.max(50, d.positivePercentage)) - vis.x(50))
            .attr("height", vis.y.bandwidth())
            .attr("fill", "#2ca02c")
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
            
        // Add percentage labels
        vis.svg.selectAll(".percentage-label")
            .data(vis.data)
            .join("text")
            .attr("class", "percentage-label")
            .attr("x", d => d.positivePercentage < 30 ? vis.x(Math.min(50, d.positivePercentage)) - 5 :
                            d.positivePercentage > 70 ? vis.x(Math.max(50, d.positivePercentage)) + 5 :
                            vis.x(50))
            .attr("y", d => vis.y(d.genre) + vis.y.bandwidth() / 2 + 5)
            .attr("text-anchor", d => d.positivePercentage < 30 ? "end" :
                                    d.positivePercentage > 70 ? "start" :
                                    "middle")
            .attr("fill", d => d.positivePercentage < 30 || d.positivePercentage > 70 ? "white" : "black")
            .text(d => `${d.positivePercentage.toFixed(1)}%`);
            
        // Add game count labels
        vis.svg.selectAll(".game-count-label")
            .data(vis.data)
            .join("text")
            .attr("class", "game-count-label")
            .attr("x", vis.width + 5)
            .attr("y", d => vis.y(d.genre) + vis.y.bandwidth() / 2 + 5)
            .attr("text-anchor", "start")
            .text(d => `(${d.gameCount.toLocaleString()} games)`);
    }
}