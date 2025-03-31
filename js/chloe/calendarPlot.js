/*
 * CalendarPlot - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the calendar plot
 * @param _data			    -- the dataset holding Release dates and number of games
 */

class CalendarPlot {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.displayData = [];

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 100, right: 10, bottom: 10, left: 50};

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
        vis.cellSize = vis.width / 57; // width/height of a day

        // Define formatting functions
        vis.formatDate = d3.timeFormat("%b %d");
        vis.formatValue = d3.format("+.2%");
        vis.formatClose = d3.format("$,.2f");
        vis.formatDay = i => "SMTWTFS"[i];
        vis.formatMonth = d3.utcFormat("%b");

        // Extract unique years that are actually in the dataset
        vis.uniqueYears = Array.from(new Set(vis.data.map(d => d.date.getFullYear())))
            .sort((a, b) => a - b);

        // For year filtering
        vis.allData = vis.preprocessData(vis.data); // Store the complete dataset

        // Initialize year range
        vis.yearRange = [
            d3.min(vis.allData, d => d.date.getFullYear()),
            d3.max(vis.allData, d => d.date.getFullYear())
        ];

        vis.startYear = vis.yearRange[0];
        vis.endYear = vis.yearRange[1];

        vis.tooltip = d3.select("body").append("div")
            .attr("id", "calendar-tooltip");

        // Create a group for the legend
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width / 2 - 75}, ${vis.height + 40})`);

        // Create year filter controls
        vis.addHtmlElements();
    }

    addHtmlElements() {
        let vis = this;

        const filterContainer = d3.select('#calendar-filter-title')
            .append('div')
            .attr('class', 'year-filter-container');

        // Add a heading
        filterContainer.append('span')
            .style('font-weight', 'bold') // Make it look like a heading
            .style('font-size', '20px')
            .style('color', '#00ffd2')
            .style('margin-right', '20px')
            .text('FILTER BY YEAR');

        // Create range filter
        filterContainer.append('span')
            .text('From: ');

        const fromYearSelect = filterContainer.append('select')
            .attr('id', 'from-year-select')
            .on('change', function() {
                const fromYear = +this.value;
                const toYear = +d3.select('#to-year-select').property('value');

                // Ensure "to" year is not less than "from" year
                if (toYear < fromYear) {
                    vis.startYear = fromYear;
                    vis.endYear = fromYear;
                    d3.select('#to-year-select').property('value', fromYear);
                    vis.filterByYearRange(fromYear, fromYear);
                } else {
                    vis.startYear = fromYear;
                    vis.endYear = toYear;
                    vis.filterByYearRange(fromYear, toYear);
                }
            });

        // Add "To" year selector
        filterContainer.append('span')
            .text(' To: ');

        const toYearSelect = filterContainer.append('select')
            .attr('id', 'to-year-select')
            .on('change', function() {
                const toYear = +this.value;
                const fromYear = +d3.select('#from-year-select').property('value');

                // Ensure "from" year is not greater than "to" year
                if (fromYear > toYear) {
                    vis.startYear = toYear;
                    vis.endYear = toYear;
                    d3.select('#from-year-select').property('value', toYear);
                    vis.filterByYearRange(toYear, toYear);
                } else {
                    vis.startYear = fromYear;
                    vis.endYear = toYear;
                    vis.filterByYearRange(fromYear, toYear);
                }
            });

        // Populate year options - only using years that exist in the dataset
        vis.uniqueYears.forEach(year => {
            fromYearSelect.append('option')
                .attr('value', year)
                .text(year);

            toYearSelect.append('option')
                .attr('value', year)
                .text(year);
        });

        // Set default values
        fromYearSelect.property('value', vis.yearRange[0]);
        toYearSelect.property('value', vis.yearRange[1]);


        const buttonContainer = d3.select('#calendar-button')
            .append('div')
            .attr('class', 'animation-container');

        // Add a heading
        buttonContainer.append('span')
            .style('font-weight', 'bold') // Make it look like a heading
            .style('font-size', '20px')
            .style('color', '#00ffd2')
            .style('margin-right', '20px')
            .text('ANIMATION');

        // Create a container for radio buttons
        let radioContainer = buttonContainer.append('span')
            .style('margin-right', '20px'); // Add spacing before the button

        // Add first radio button
        radioContainer.append('input')
            .attr('type', 'radio')
            .attr('name', 'animationMode')
            .attr('value', 'cumulative')
            .attr('id', 'cumulative-radio')
            .attr('class', 'cyber-radio bg-white ac-blue')
            .property('checked', true); // Default selection

        radioContainer.append('label')
            .attr('for', 'cumulative-radio')
            .text('Cumulative')
            .style('margin-right', '10px'); // Add spacing between options

        // Add second radio button
        radioContainer.append('input')
            .attr('type', 'radio')
            .attr('name', 'animationMode')
            .attr('value', 'year-by-year')
            .attr('id', 'year-by-year-radio')
            .attr('class', 'cyber-radio bg-white ac-blue');

        radioContainer.append('label')
            .attr('for', 'year-by-year-radio')
            .text('Year by Year')
            .style('margin-right', '20px'); // Add spacing before the button

        buttonContainer.append('button')
            .attr('class', 'start-button cyber-button-small bg-yellow fg-white')
            .text('START')
            .on('click', function() {
                vis.startAnimation();
            });

        vis.wrangleData()
    }

    filterByYearRange(fromYear, toYear) {
        let vis = this;

        // Make a copy for filtering
        vis.data = vis.allData.slice();

        // Filter the data based on the selected year range
        vis.data = vis.allData.filter(d => {
            vis.startYear = fromYear;
            vis.endYear = toYear;

            const year = d.date.getFullYear();

            return year >= fromYear && year <= toYear;
        });


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
        vis.displayData = counts.map(d => {
            const [month, day] = d[0].split('-').map(Number);
            return {
                date: new Date(vis.endYear, month, day),  // Use a fixed year to group the data
                value: d[1],
                yearData: d3.groups(
                    vis.data.filter(item =>
                        item.date.getMonth() === month &&
                        item.date.getDate() === day
                    ),
                    item => item.date.getFullYear()
                ).map(yearGroup => ({
                    year: yearGroup[0],
                    count: d3.sum(yearGroup[1], item => item.value)
                }))
            };
        });
        
        // Sort chronologically
        vis.displayData = vis.displayData.sort((a, b) => a.date - b.date);


        // Color scale
        // let max = d3.max(vis.displayData, d => d.value);
        // vis.color = d3.scaleSequential(d3.interpolateYlGnBu)
        //     .domain([0, max]);
        let max = d3.max(vis.displayData, d => d.value);
        vis.color = d3.scaleLinear()
            .domain([0, 1, max * 0.2, max * 0.4, max * 0.6, max * 0.8, max])
            .range(["#F0F0F0", "#FFFFD9", "#EDF8B1", "#C7E9B4", "#7FCDBB", "#41B6C4", "#081D58"]);


        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Remove existing elements
        vis.svg.selectAll("rect").remove();
        vis.svg.selectAll(".month-label-cal").remove();
        vis.svg.selectAll("path").remove();

        // Create calendar heatmap cells
        let cells = vis.svg.selectAll("rect")
            .data(vis.displayData)
            .enter().append("rect")
            .attr("width", vis.cellSize - 1)
            .attr("height", vis.cellSize - 1)
            .attr("x", d => {
                let startOfYear = d3.utcYear(d.date); // Get Jan 1st of the year
                let offset = startOfYear.getUTCDay(); // Get the weekday of Jan 1st
                return (d3.timeWeek.count(startOfYear, d.date) + (offset ? 1 : 0)) * vis.cellSize;
            })
            .attr("y", d => (d.date.getUTCDay()) * vis.cellSize)
            .attr("fill", d => vis.color(d.value))
            .attr("stroke", "#e9ecef")  // Add a subtle border
            .attr("stroke-width", 0.5);  // Thin border

        vis.updateTooltip(cells);
        vis.updateColorLegend();
        vis.updateYearDisplay();

        // A function that draws a thin white line to the left of each month.
        function pathMonth(t) {
            const d = Math.max(0, Math.min(7, t.getUTCDay()));
            const w = d3.timeWeek.count(d3.utcYear(t), t);

            let pathData;
            if (d === 0 | d === 7) {
                pathData = `M${(w + 1) * vis.cellSize},0`;
            } else {
                pathData = `M${(w + 1) * vis.cellSize},0V${d * vis.cellSize}H${w * vis.cellSize}`;
            }

            return `${pathData}V${7 * vis.cellSize}`;
        }

        // Add month labels
        const months = d3.utcMonths(
            d3.utcMonth(d3.min(vis.displayData, d => d.date)),
            d3.utcMonth(d3.max(vis.displayData, d => d.date)).setUTCMonth(d3.utcMonth(d3.max(vis.displayData, d => d.date)).getUTCMonth() + 1)
        );

        let month = vis.svg.selectAll(".month-label-cal")
            .data(months)
            .enter();

        month.filter((d, i) => i).append("path")
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 5)
            .attr("d", pathMonth);

        month.append("text")
            .attr("class", "month-label-cal")
            .attr("x", d => d3.timeWeek.count(d3.utcYear(d), d) * vis.cellSize + 2)
            .attr("y", -5)
            .text(vis.formatMonth);

        // Add day labels to calendar plot
        const dayLabels = ["S", "M", "T", "W", "Th", "F", "S"];

        vis.svg.selectAll('.day-label-left')
            .data(dayLabels)
            .enter().append('text')
            .attr('class', 'day-label-left')
            .attr('x', -10) // Position slightly left of the calendar
            .attr('y', (d, i) => i * vis.cellSize + vis.cellSize / 2) // Align with each row
            .attr('text-anchor', 'end') // Right-align text
            .attr('dy', '0.35em') // Adjust vertical alignment
            .text(d => d);

        // Add day labels on the right side
        vis.svg.selectAll('.day-label-right')
            .data(dayLabels)
            .enter().append('text')
            .attr('class', 'day-label-right')
            .attr('x', 54 * vis.cellSize + 5) // Position slightly right of the calendar
            .attr('y', (d, i) => i * vis.cellSize + vis.cellSize / 2)
            .attr('text-anchor', 'start') // Left-align text
            .attr('dy', '0.35em')
            .text(d => d);
    }

    // Function to ensure all days are represented in the dataset using only existing years
    preprocessData(inputData) {
        let vis = this;
        // Convert existing data to a Map for quick lookup
        const dataMap = new Map();

        // Process existing data
        inputData.forEach(d => {
            // Create a key in format "YYYY-MM-DD" for easy lookup
            const dateKey = `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}`;
            dataMap.set(dateKey, d);
        });

        // Create a complete dataset with all days for only the years that exist
        const completeData = [];

        // Loop through each unique year that appears in the original data
        for (let i = 0; i < vis.uniqueYears.length; i++) {
            const year = vis.uniqueYears[i];

            // Loop through each month (0-11)
            for (let month = 0; month < 12; month++) {
                // Get the last day of the month
                const lastDay = new Date(year, month + 1, 0).getDate();

                // Loop through each day of the month
                for (let day = 1; day <= lastDay; day++) {
                    const date = new Date(year, month, day);
                    const dateKey = `${year}-${month}-${day}`;

                    // Check if this date exists in the original data
                    if (dataMap.has(dateKey)) {
                        // Use existing data
                        completeData.push(dataMap.get(dateKey));
                    } else {
                        // Create a new data point with value 0
                        completeData.push({
                            date: date,
                            value: 0

                        });
                    }
                }
            }
        }

        return completeData;
    }

    updateTooltip(cells){
        let vis = this;

        cells.on("mouseover", function(event, d) {
            let tooltipText = `${vis.formatDate(d.date)}: ${d.value} games`;

            if (d.value === 0) {
                tooltipText = `${vis.formatDate(d.date)}: No games`;
            } else if (d.yearData && d.yearData.length > 0) {
                tooltipText += '<br><br><strong>Breakdown by year:</strong>';

                // Sort by year in descending order (most recent first)
                d.yearData.sort((a, b) => b.year - a.year);

                // Limit to the first 6 entries
                for (let i = 0; i < Math.min(6, d.yearData.length); i++) {
                    let y = d.yearData[i];
                    if (y.count > 0) {
                        tooltipText += `<br>${y.year}: ${y.count} games`;
                    }
                }

                if (d.yearData.length > 5) {
                    tooltipText += `<br><br><em>Click for full list...</em>`;
                }
            }

            vis.tooltip.html(tooltipText)
                .style("visibility", "visible")
                .style("display", "block")
                .style("left", `${event.pageX + 20}px`)
                .style("top", `${event.pageY + 20}px`);
        })

            .on("click", function(event, d) {
                const activeSection = document.querySelector(".fp-section.active"); // Get the current Fullpage.js section
                const modalContainer = d3.select(activeSection).append("div") // Append modal to the section
                    .attr("id", "calendar-modal")

                modalContainer.html(`
                    <div id="modal-content">
                        <span id="close-modal" class="close">&#x2716;</span>
                        <div id="modal-title"> <br> <strong> ${vis.formatDate(d.date)} Full Breakdown </strong> </div>
                        <div id="modal-body">
                            ${d.yearData
                    .filter(y => y.count > 0) // Only include years where count > 0
                    .map(y => `${y.year}: ${y.count}`)
                    .join("<br>")
                }
                        </div>
                    </div>
                `);

                // Close modal when clicking the "X"
                modalContainer.select("#close-modal").on("click", () => modalContainer.remove());
            })

            .       on("mousemove", function(event) {
                vis.tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", function() {
                vis.tooltip.style("visibility", "hidden");
            });
    }

    updateColorLegend() {
        let vis = this;

        // Clear existing legend items and title
        vis.legend.selectAll(".legend-item").remove();
        if (vis.legendTitle) {
            vis.legendTitle.remove();
            vis.legendTitle = null;
        }

        // Dimensions for the legend
        const legendWidth = 250;  // Total width of the legend
        const legendItemWidth = legendWidth / 8;  // Each color block size
        const legendHeight = 10; // Height of color rectangles
        const titleOffset = -20; // How far to the left of the legend the title should be

        // Reposition the legend group to the top of the visualization
        // Center the whole legend (title + color scale) horizontally
        vis.legend.attr("transform", `translate(${vis.width - 200 - legendWidth - Math.abs(titleOffset)}, ${-70})`);

        // Legend scale values
        const legendScale = vis.color.ticks(8);

        // Append color scale rectangles in a group that's offset to allow space for the title
        const colorGroup = vis.legend.append("g")
            .attr("transform", `translate(${Math.abs(titleOffset)}, 0)`)
            .attr("class", "legend-item");

        colorGroup.selectAll("rect")
            .data(legendScale)
            .enter().append("rect")
            .attr("x", (d, i) => i * legendItemWidth)  // Horizontally spaced
            .attr("y", 0) // Align to the top
            .attr("width", legendItemWidth)
            .attr("height", legendHeight)
            .attr("fill", d => vis.color(d));

        // Add labels below the legend
        colorGroup.selectAll("text")
            .data(legendScale)
            .enter().append("text")
            .attr("x", (d, i) => i * legendItemWidth + legendItemWidth / 2) // Center text
            .attr("y", legendHeight + 15) // Below rectangles
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d => Math.round(d));

        // Add legend title to the left of the legend
        vis.legendTitle = vis.legend.append("text")
            .attr("x", 0)  // Left-aligned in the legend group
            .attr("y", legendHeight / 2)  // Vertically center with the color blocks
            .attr("dy", ".35em")  // Fine-tune vertical alignment
            .attr("font-weight", "bold")
            .style("text-anchor", "end")  // Right-align the text
            .text("Number of Games");
    }

    // function to display the year range
    updateYearDisplay() {
        let vis = this;

        // Remove existing year display elements individually
        vis.svg.selectAll(".year-label").remove();
        vis.svg.selectAll(".year-value").remove();

        // Determine if single year or range
        let isSingleYear = vis.startYear === vis.endYear;

        // Add the bold label part with debugging border
        vis.svg.append("text")
            .attr("class", "year-label")
            .attr("x", 0)
            .attr("y", -60)
            .attr("font-weight", "bold")
            .style("text-anchor", "start")
            .style("fill", "black")
            .text(isSingleYear ? "Year:" : "Years:");

        // Add the normal font value part
        vis.svg.append("text")
            .attr("class", "year-value")
            .attr("x", isSingleYear ? 55 : 60)
            .attr("y", -60)
            .attr("font-weight", "normal")
            .style("text-anchor", "start")
            .text(isSingleYear ? `${vis.startYear}` : `${vis.startYear} - ${vis.endYear}`);

        console.log("Year label created:", vis.svg.select(".year-label").node());
        console.log("Year value created:", vis.svg.select(".year-value").node());
    }

    startAnimation(){
        let vis = this;
        const button = d3.select("#start-button");

        // Disable the button to prevent multiple clicks
        button.attr("disabled", true);

        let currentIndex = 0;

        const toYear = +d3.select('#to-year-select').property('value');
        const fromYear = +d3.select('#from-year-select').property('value');

        const filterUnique = vis.uniqueYears.filter(d => {
            return d >= fromYear && d <= toYear;
        })

        // Check which mode is selected
        const animationMode = d3.select('input[name="animationMode"]:checked').property('value');

        // Function to update the graph
        const interval = setInterval(() => {
            if (currentIndex >= filterUnique.length) {
                clearInterval(interval);
                button.attr("disabled", false);  // Enable the button again
                return;
            } else {
                const currentYear = filterUnique[currentIndex];

                if (animationMode === 'cumulative') {
                    vis.endYear = currentYear;
                    vis.filterByYearRange(vis.startYear, currentYear);
                } else if (animationMode === 'year-by-year') {
                    vis.endYear = currentYear;
                    vis.filterByYearRange(currentYear, currentYear);
                }
                currentIndex++;  // Move to the next year
            }
        }, 1000);  //Speed of animation
    }
}
