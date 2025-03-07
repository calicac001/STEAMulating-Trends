/******** BUBBLE PLOT ENGAGEMENT VIZ ********/
// bubble-plot-engagement

let parentDiv = d3.select("#bubble-plot-engagement");
let parentCont = parentDiv.append("div")
.attr("class", "container")
;

parentCont.append("img")
    .attr("src", "img/bubble-plot-engagement.jpg")
    .attr("width", 500)
    .attr("height", 500)
    .attr("display", "block")
;

// console.log("hi");

/******** DISTRIBUTION VIZ ********/
// distribution-plot

let parentDiv2 = d3.select("#distribution-plot");
let parentCont2 = parentDiv2.append("div")
.attr("class", "container")
;

parentCont2.append("img")
    .attr("src", "img/distribution-plot.jpg")
    .attr("width", 500)
    .attr("height", 500)
    .attr("display", "block")
;