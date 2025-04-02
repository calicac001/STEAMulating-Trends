/* * * * * * * * * * * * * *
*      class BarVis        *
*      From Lab 08         *
* * * * * * * * * * * * * */


class BarVis {

    constructor(_parentElement, _data, _category) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.category = _category;

        this.initVis()
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 35, right: 20, bottom: 80, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'bar-title')
            .append('text')
            .attr('transform', `translate(0, -10)`)
            .text(function(){
                if (vis.category === "reviews"){
                    return "Highest Reviews (Overall)"
                } else if (vis.category === "recommendations"){
                    return "Highest Recommendations (Overall)"
                }
            })
            .attr("fill", "white")
            .style("font-size", "15px");

        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('id', "barchart-tooltip")

        // Scales and axes
        vis.x = d3.scaleBand(d3.schemeCategory10)
            .rangeRound([0, vis.width])
            .paddingInner(0.2)
            .padding(0.1);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        vis.wrangleData();
    }

    wrangleData(){
        let vis = this

        vis.displayData = isHexbinSelected ? selectedHexbinData : vis.data;

        const uniqueGamesMap = new Map();


        vis.displayData.forEach(item => {
            uniqueGamesMap.set(item.AppID, item);
        });

        vis.displayData = Array.from(uniqueGamesMap.values());

        if (vis.category === "reviews"){
            vis.top5games = vis.displayData.sort((a, b) => b.numReviews - a.numReviews)
                .slice(0, 10);
        } else if (vis.category === "recommendations"){
            vis.top5games = vis.displayData.sort((a, b) => b.numRecommendations- a.numRecommendations)
                .slice(0, 10);
        }

        vis.updateVis()
    }

    updateVis(){
        let vis = this;

        //Update domains
        vis.x.domain(vis.top5games.map(d => d.name))

        if (vis.category === "reviews"){
            vis.y.domain([0, d3.max(vis.top5games, d => d.numReviews)]);
        } else if (vis.category === "recommendations"){
            vis.y.domain([0, d3.max(vis.top5games, d => d.numRecommendations)]);
        }


        let bars = vis.svg.selectAll(".bar")
            .data(vis.top5games)

        bars.enter().append("rect")
            .attr("class", "bar")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', "yellow");

                // Format with commas since a bit hard to see
                const numberFormatter = new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: 0 // No decimal places
                });

                vis.tooltip.html(`<strong><u>${d.name}</u><br></strong><br>
                    <strong>No. of Positive Reviews:</strong> ${numberFormatter.format(d.numReviews)} <br>
                    <strong>No. of Recommendations:</strong> ${numberFormatter.format(d.numRecommendations)} <br>
                `)
                    .style("visibility", "visible")
                    .style("display", "block")
                    .style("left", `${event.pageX + 20}px`)
                    .style("top", `${event.pageY + 20}px`);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr('stroke-width', 0.5)
                    .attr("fill", "#00ffd2");

                vis.tooltip.style("visibility", "hidden");
            })

            .merge(bars)
            .transition()
            .duration(500)
            .attr("width", vis.x.bandwidth())
            .attr("height", function (d) {
                if (vis.category === "reviews"){
                    return vis.height - vis.y(d.numReviews);
                } else if (vis.category === "recommendations"){
                    return vis.height - vis.y(d.numRecommendations);
                }
            })
            .attr("x", function (d) {
                return vis.x(d.name);
            })
            .attr("y", function (d) {
                if (vis.category === "reviews"){
                    return vis.y(d.numReviews);
                } else if (vis.category === "recommendations"){
                    return vis.y(d.numRecommendations);
                }

            })
            .attr("fill", "#00ffd2");

        bars.exit().remove();

        // Call axis function with the new domain
        vis.svg.select(".x-axis")
            .transition()
            .duration(500)
            .call(vis.xAxis);

        setTimeout(() => {
            vis.svg.selectAll(".x-axis text")
                .each(function() {
                    let textElement = d3.select(this);
                    let fullText = textElement.text();
                    let bbox = this.getBBox();

                    // Function to truncate text and add "..." if it's too long
                    function truncateText(text, maxWidth) {
                        let truncated = text;
                        textElement.text(truncated); // Set text initially

                        while (this.getBBox().width > maxWidth && truncated.length > 1) {
                            truncated = truncated.slice(0, -1); // Remove last character
                            textElement.text(truncated + "... ");
                        }
                    }

                    truncateText.call(this, fullText, 70); // Limit width to 50 pixels

                    // Apply rotation to all labels
                    textElement
                        .attr("transform", `rotate(-45)`)
                        .style("text-anchor", "end")
                        .attr("dx", "0.5em")
                        .attr("dy", "0.5em");
                });

        }, 0);

        //format y-axis to shortened form
        const format = d3.format("~s");

        vis.svg.select(".y-axis")
            .call(vis.yAxis.tickFormat(format))
            .selectAll("line")
            .style("fill", "blue");

        // Update title
        if (isHexbinSelected){
            vis.svg.select(".bar-title text")
                .text(function(){
                    if (vis.category === "reviews"){
                        return "Highest Reviews (Selected Hexbin)"
                    } else if (vis.category === "recommendations"){
                        return "Highest Recommendations (Selected Hexbin)"
                    }
                })
        } else {
            vis.svg.select(".bar-title text")
                .text(function(){
                    if (vis.category === "reviews"){
                        return "Highest Reviews (Overall)"
                    } else if (vis.category === "recommendations"){
                        return "Highest Recommendations (Overall)"
                    }
                })
        }
    }

}