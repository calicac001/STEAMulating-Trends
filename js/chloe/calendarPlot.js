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

        vis.margin = {top: 30, right: 10, bottom: 10, left: 50};

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

        // Make a copy for filtering
        vis.data = vis.allData.slice();

        // Initialize year range
        vis.yearRange = [
            d3.min(vis.allData, d => d.date.getFullYear()),
            d3.max(vis.allData, d => d.date.getFullYear())
        ];

        vis.endYear = vis.yearRange[1];

        vis.tooltip = d3.select("body").append("div")
            .attr("id", "calendar-tooltip");

        // Create year filter controls
        vis.addHtmlElements();
    }

    addHtmlElements() {
        let vis = this;

        const filterContainer = d3.select('#calendar-controls')
            .append('div')
            .attr('class', 'year-filter-container');

        // Add a heading
        filterContainer.append('h4')
            .text('Filter by Year');

        // Create range filter
        const rangeContainer = filterContainer.append('div')
            .attr('class', 'range-container');

        // Add "From" year selector
        rangeContainer.append('span')
            .text('From: ');

        const fromYearSelect = rangeContainer.append('select')
            .attr('id', 'from-year-select')
            .on('change', function() {
                const fromYear = +this.value;
                const toYear = +d3.select('#to-year-select').property('value');

                // Ensure "to" year is not less than "from" year
                if (toYear < fromYear) {
                    d3.select('#to-year-select').property('value', fromYear);
                    vis.filterByYearRange(fromYear, fromYear);
                    vis.endYear = fromYear;
                } else {
                    vis.filterByYearRange(fromYear, toYear);
                    vis.endYear = toYear;
                }
            });

        // Add "To" year selector
        rangeContainer.append('span')
            .text(' To: ');

        const toYearSelect = rangeContainer.append('select')
            .attr('id', 'to-year-select')
            .on('change', function() {
                const toYear = +this.value;
                const fromYear = +d3.select('#from-year-select').property('value');

                // Ensure "from" year is not greater than "to" year
                if (fromYear > toYear) {
                    d3.select('#from-year-select').property('value', toYear);
                    vis.filterByYearRange(toYear, toYear);
                    vis.endYear = toYear;
                } else {
                    vis.filterByYearRange(fromYear, toYear);
                    vis.endYear = toYear;
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

        const buttonContainer = d3.select('#calendar-controls')
            .append('div')
            .attr('class', 'button-container');

        buttonContainer.append('button')
            .attr('class', 'start-button cyber-button bg-yellow fg-white')
            .text('Start Animation')
            .on('click', function() {
                vis.startAnimation();
            });

        vis.wrangleData()
    }

    filterByYearRange(fromYear, toYear) {
        let vis = this;

        // Filter the data based on the selected year range
        vis.data = vis.allData.filter(d => {
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
        let max = d3.max(vis.displayData, d => d.value);
        vis.color = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, max]);


        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Remove existing elements
        vis.svg.selectAll("rect").remove();
        vis.svg.selectAll(".month-label").remove();
        vis.svg.selectAll("path").remove();

        // Create calendar heatmap cells
        let cells = vis.svg.selectAll("rect")
            .data(vis.displayData)
            .enter().append("rect")
            .attr("width", vis.cellSize - 1)
            .attr("height", vis.cellSize - 1)
            .attr("x", d => d3.timeWeek.count(d3.utcYear(d.date), d.date) * vis.cellSize)
            .attr("y", d => (d.date.getUTCDay()) * vis.cellSize)
            .attr("fill", d => vis.color(d.value))
            .attr("stroke", "#e9ecef")  // Add a subtle border
            .attr("stroke-width", 0.5);  // Thin border

        vis.updateTooltip(cells);


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

        let month = vis.svg.selectAll(".month-label")
            .data(months)
            .enter();

        month.filter((d, i) => i).append("path")
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 5)
            .attr("d", pathMonth);

        month.append("text")
            .attr("class", "month-label")
            .attr("x", d => d3.timeWeek.count(d3.utcYear(d), d) * vis.cellSize + 2)
            .attr("y", -5)
            .text(vis.formatMonth);
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

        // Function to update the graph year by year
        const interval = setInterval(() => {
            if (currentIndex >= filterUnique.length) {
                clearInterval(interval);
                button.attr("disabled", false);  // Enable the button again
                return;
            } else {
                const currentYear = filterUnique[currentIndex];
                vis.endYear = currentYear;
                // Filter the data for the current year and update the visualization
                vis.filterByYearRange(currentYear, currentYear);
                currentIndex++;  // Move to the next year
            }
        }, 1000);  // Adjust the interval for the speed of the animation (1000ms = 1 second per year)
    }
}
