/*
 * CalendarPlot - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the calendar plot
 * @param _data			    -- the dataset holding Release dates and number of games
 */

class CalendarPlot {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 0, bottom: 30, left: 50};

        // Dimensions
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Code derived from https://observablehq.com/@d3/calendar/2

        // Define constants for cells
        vis.cellSize = 16; // Height of a day
        vis.cellHeight = vis.cellSize * 7; // Height of a week (5 days + padding)
        vis.cellWidth = (vis.cellSize + 1.5) * 53; // Width of the chart

        // Define formatting functions
        vis.formatDate = d3.utcFormat("%x");
        vis.formatValue = d3.format("+.2%");
        vis.formatClose = d3.format("$,.2f");
        vis.formatDay = i => "SMTWTFS"[i];
        vis.formatMonth = d3.utcFormat("%b");

        // Weekday & positioning helpers
        vis.timeWeek = d3.utcMonday;
        vis.countDay = i => (i + 6) % 7;

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Count game releases by (month, day) using d3.group() and d3.rollups()
        const counts = d3.rollups(
            vis.data,
            v => d3.sum(v, d => d.value),  // Count the number of releases for each (month, day) combination
            d => `${d.date.getMonth()}-${d.date.getDate()}`  // Group by (month, day) combination
        );

        // Transform data into the required format for the heatmap
        // TODO: needed to add year here but maybe omit year on the tooltip
        vis.displayData = counts.map(d => {
            const [month, day] = d[0].split('-').map(Number);
            return {
                date: new Date(2025, month, day),  // Use a fixed year to group the data
                value: d[1]
            };
        });
        
        // Sort chronologically
        vis.displayData = vis.displayData.sort((a, b) => a.date - b.date);

        // Color scale
        let max = d3.max(vis.displayData, d => d.value);
        vis.color = d3.scaleSequential(d3.interpolateBlues).domain([0, max]);


        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Create calendar heatmap cells
        vis.svg.selectAll("rect")
            .data(vis.displayData)
            .enter().append("rect")
            .attr("width", vis.cellSize - 1)
            .attr("height", vis.cellSize - 1)
            .attr("x", d => d3.timeWeek.count(d3.utcYear(d.date), d.date) * vis.cellSize)
            .attr("y", d => (d.date.getUTCDay()) * vis.cellSize)
            .attr("fill", d => vis.color(d.value))
            .append("title")
            .text(d => `${vis.formatDate(d.date)}: ${d.value} games`);

        // A function that draws a thin white line to the left of each month.
        function pathMonth(t) {
            const d = Math.max(0, Math.min(7, vis.countDay(t.getUTCDay())));
            const w = d3.timeWeek.count(d3.utcYear(t), t);
            return `${d === 0 ? `M${w * vis.cellSize},0`
                : d === 7 ? `M${(w + 1) * vis.cellSize},0`
                    : `M${(w + 1) * vis.cellSize},0V${d * vis.cellSize}H${w * vis.cellSize}`}V${7 * vis.cellSize}`;
        }

        // Add month labels
        const months = d3.utcMonths(
            d3.utcMonth(d3.min(vis.displayData, d => d.date)),
            d3.utcMonth(d3.max(vis.displayData, d => d.date))
        );
        
        // TODO: December is missing for some reason 
        let month = vis.svg.selectAll(".month-label")
            .data(months)
            .enter();

        month.filter((d, i) => i).append("path")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("d", pathMonth);

        month.append("text")
            .attr("class", "month-label")
            .attr("x", d => vis.timeWeek.count(d3.utcYear(d), d) * vis.cellSize + 2)
            .attr("y", -5)
            .text(vis.formatMonth);
    }
}
