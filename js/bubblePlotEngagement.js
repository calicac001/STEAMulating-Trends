/******** BUBBLE PLOT ENGAGEMENT VIZ ********/
// bubble-plot-engagement

// let parentDiv = d3.select("#bubble-plot-engagement");
// let parentCont = parentDiv.append("div")
// .attr("class", "container")
// ;

// // Placeholder
// parentCont.append("img")
//     .attr("src", "img/bubble-plot-engagement.jpg")
//     .attr("width", 500)
//     .attr("height", 500)
//     .attr("display", "block")
// ;



class BubblePlotChart {
    constructor(selector, popularity, genres, basicInfo, tags, width = 1250, height = 1000,
                margins = {top: 150, bottom: 150, left: 150, right: 150}) {
        // this.popularity = popularity;

        // console.log(tags);

        // this.popularity = popularity;
        // this.genre = genres;
        // this.basicInfo = basicInfo;
        this.parentDiv = d3.select(selector);
        this.parentCont = this.parentDiv.append("div").attr("class", "container");

        this.yap = this.parentDiv.append("div").append("p")
            .html("This graph plots videos games, based on their genre, to see whether or not the factor of\
                being a multiplayer game or not impacts player retention<br>\
                We identify player retention by looking at the Average Playtime for 2 weeks, as well as forever\
                Additionally, we might notice that larger games might correlate with higher player retention.")
            .style("text-align", "left")


        this.dropdown = this.parentCont.append("div").append("select")
            .attr("id", "genre-dropdown");
        this.svg = this.parentCont.append("svg")
            .attr("width", width)
            .attr("height", height)
        ;

        this.svgWidth = width;
        this.svgHeight = height;
        this.margins = margins;
        this.vizWidth = this.svgWidth - this.margins.left - this.margins.right;
        this.vizHeight = this.svgHeight - this.margins.top - this.margins.bottom;
        // console.log(popularity, genres, basicInfo);
        const graphingData = BubblePlotChart.getGraphingData(popularity, genres, basicInfo, tags);
        this.genreToAppIDs = graphingData.genreToAppIDs;
        this.appIDToInfo = graphingData.gameToInfo;
        this.graphData();
    }

    /////////////////////// making new shit, starting from scratch ////////////////////////
    static getGraphingData(popularity, genres, basicInfo, tags) {
        return BubblePlotChart.bob(popularity, genres, basicInfo, tags);
        // idk, i just liked to keep bob (i was scared of breaking things by renaming, but honestly i don't think anythoing would have happened :3)
    }

    static bob(popularity, genres, basicInfo, tags) {
        const cleanedPopularity = BubblePlotChart.popularityCleaner(popularity);
        const cleanedGenres = BubblePlotChart.genresCleaner(genres);
        const cleanedBasicInfo = BubblePlotChart.basicInfoCleaner(basicInfo);

        const appIDToName = BubblePlotChart.getAppIDToName(cleanedBasicInfo);
        const appIDToPopularity = BubblePlotChart.getAppIDToPopularity(cleanedPopularity);
        const appIDToIsMultiplayer = BubblePlotChart.getAppIDToIsMultiplayer(tags);

        const genreToAppIDs = BubblePlotChart.getGenresToAppIDs(cleanedGenres);
        const gameToInfo = BubblePlotChart.getGameToInfo(appIDToName, appIDToPopularity, appIDToIsMultiplayer);

        // console.log(Object.entries(gameToInfo));

        return {genreToAppIDs: genreToAppIDs, gameToInfo: gameToInfo};
    }

    static popularityCleaner(popularity) {
        /**
         * popularity is an array of objects like this:
         {
         "AppID": "10",
         "Recommendations": "122770",
         "Estimated owners": "10000000 - 20000000",
         "Average playtime forever": "10524",
         "Average playtime two weeks": "1733",
         "Median playtime forever": "228",
         "Median playtime two weeks": "733",
         "Peak CCU": "13230"
         }
         */
        return popularity.map(d => ({
            "appID": d["AppID"],
            "estimatedOwners": d["Estimated owners"],
            "avgPlaytimeForever": d["Average playtime forever"],
            "avgPlaytime2Weeks": d["Average playtime two weeks"],
            "medPlaytimeForever": d["Median playtime forever"],
            "medPlaytime2Weeks": d["Median playtime two weeks"]
        }));

    }

    static genresCleaner(genres) {
        /**
         * genres is an array of objects like this:
         {
         "AppID": "10",
         "Genres": "Action"
         }

         Note: an AppID might have multiple genres, (so, there can be multiple objects with the same AppID but different Genres)
         Note: although Genres is a plural word, only 1 genre will appear in the string
         */

        return genres.map(d => ({
            "appID": d["AppID"],
            "genre": d["Genres"]  // note change from plural to singular "Genres" to "genre"
        }));
        // TODO: decide whether or not I wanna keep games with the genre ""
    }

    static basicInfoCleaner(basicInfo) {
        /**
         * basicInfo is an array of objects like this:
         {
         "AppID": "10",
         "Name": "Counter-Strike",
         "Release date": "01-Nov-00",
         "Required age": "0",
         "Price": "9.99",
         "DLC count": "0",
         "Developers": "Valve",
         "Publishers": "Valve"
         }
         */

        return basicInfo.map(d => ({
            "appID": d["AppID"],
            "name": d["Name"]
        }))
    }

    static getGenresList(cleanedGenres) {
        return [
            ... new Set(cleanedGenres.map(d => d["genre"]))
        ];
    }

    static getGenresToAppIDs(cleanedGenres) {
        const genresList = BubblePlotChart.getGenresList(cleanedGenres);
        // console.log(genresList);

        const genreToGamesMapping = {};
        for (const genre of genresList) {
            genreToGamesMapping[genre] = [];
        }
        // console.log(genreToGamesMapping);

        for (const game of cleanedGenres) {
            genreToGamesMapping[game["genre"]].push(game["appID"]);
        }

        // console.log(genreToGamesMapping);

        // TODO: remove the genre: ""  ?  (the no name genre, which is used for playtests)

        return genreToGamesMapping;
    }

    static #noGenreGames(cleanedGenres) {
        /** @private */
        /** I just wanted to use keep this function for documentation purposes, as it's intersting */
            // there are a bunch of games that don't have a genre -- their titles all (i haven't properly checked, but a quick skim suggests this)
            // have the keyword "playtest" in them, so I'm guessing they're beta games or something
            // i'll filter out these games that don't have a genre
            // this is a silly little finding

        const noGenres = [];
        for (const game of cleanedGenres) {
            if (game["genre"] === "") {
                console.log(game);
                noGenres.push(game["appID"]);
            }
            // if (game["appID"] == "3193740") {
            //     console.log(game);
            // }
        }
        // console.log(noGenres);

        for (const game of cleanedBasicInfo) {
            for (const appID of noGenres) {
                if (game.appID === appID) {
                    console.log(game);
                }
            }
        }
    }

    static getAppIDToName(cleanedBasicInfo) {
        const gameToName = {};
        for (const game of cleanedBasicInfo) {
            gameToName[game["appID"]] = game["name"];
        }
        return gameToName;
    }

    static getAppIDToPopularity(cleanedPopularity) {
        // cleaned popularity is an array of objects like:
        /**
         *         return popularity.map(d => ({
         "appID": d["AppID"],
         "estimatedOwners": d["Estimated owners"],
         "avgPlaytimeForever": d["Average playtime forever"],
         "avgPlaytime2Weeks": d["Average playtime two weeks"],
         "medPlaytimeForever": d["Median playtime forever"],
         "medPlaytime2Weeks": d["Median playtime two weeks"]
         }));
         */
        const appIDToPopularity = {};

        for (const game of cleanedPopularity) {
            appIDToPopularity[game["appID"]] = {
                "estimatedOwners": game["estimatedOwners"],
                "avgPlaytimeForever": game["avgPlaytimeForever"],
                "avgPlaytime2Weeks": game["avgPlaytime2Weeks"],
                "medPlaytimeForever": game["medPlaytimeForever"],
                "medPlaytime2Weeks": game["medPlaytime2Weeks"]
            }
        }
        // console.log(Object.entries(appIDToPopularity));
        return appIDToPopularity;
    }

    static getAppIDToIsMultiplayer(tags) {
        // tags is a list of objects like this:
        /**
         {
         "AppID": "60",
         "Tags": "First-Person"
         }
         */
            // console.log(tags);
            // compile the tags, and then reduce to isMultiplayer

        const appIDToTags = {};
        for (const game of tags) {
            if (game["AppID"] in appIDToTags) {
                appIDToTags[game["AppID"]].push(game["Tags"]);
            } else {
                appIDToTags[game["AppID"]] = [game["Tags"]];
            }
        }

        // console.log(Object.entries(appIDToTags));

        const appIDToIsMultiplayer = {};
        for (const appID of Object.keys(appIDToTags)) {
            appIDToIsMultiplayer[appID] = appIDToTags[appID].includes("Multiplayer");  // in doesn't work lmfao, it only works for checking if a key is in an obj it seems
            // "Singleplayer" and "Multiplayer"
            // some don't have either :skull:
        }

        // console.log(Object.entries(appIDToIsMultiplayer)/*.map(d => d[1])*/);
        return appIDToIsMultiplayer
    }

    static getGameToInfo(appIDToName, appIDToPopularity, appIDToIsMultiplayer) {
        const gameToInfo = {};
        for (const appID of Object.keys(appIDToName)) {
            gameToInfo[appID] = {
                "estimatedOwners": appIDToPopularity[appID]["estimatedOwners"].split(" - ").map(d => +d),
                "avgPlaytimeForever": + appIDToPopularity[appID]["avgPlaytimeForever"],
                "avgPlaytime2Weeks": + appIDToPopularity[appID]["avgPlaytime2Weeks"],
                "medPlaytimeForever": + appIDToPopularity[appID]["medPlaytimeForever"],
                "medPlaytime2Weeks": + appIDToPopularity[appID]["medPlaytime2Weeks"],
                "isMultiplayer": appIDToIsMultiplayer[appID],
                "name": appIDToName[appID],
                "appID": appID
            };
        }

        // returns a mapping from appIDs (strings) to the following:
        /**
         {
         "estimatedOwners": [
         10000000,
         20000000
         ],
         "avgPlaytimeForever": 10524,
         "avgPlaytime2Weeks": 1733,
         "medPlaytimeForever": 228,
         "medPlaytime2Weeks": 733,
         "isMultiplayer": true,
         "name": "Counter-Strike"
         }
         */

        // console.log(Object.entries(gameToInfo));

        return gameToInfo;
    }

    graphData() {
        this.dropdown.selectAll("option")
            .data(Object.keys(this.genreToAppIDs))
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        this.svg.style("background-color", "#5e6a75");
        this.g = this.svg.append("g")
            .attr("transform", `translate(${(this.svgWidth - this.vizWidth) / 2}, ${(this.svgHeight - this.vizHeight) / 2})`)
        ;

        this.updateBubbleChart(this.dropdown.property("value"));

        // listener
        this.dropdown.on("change", (event) => {
            const selectedGenre = event.target.value;  // Get selected genre
            console.log("Selected Genre:", selectedGenre);

            // Call a function to update the visualization based on selection
            this.updateBubbleChart(selectedGenre);
        });
    }

    updateBubbleChart(genre) {
        console.log("Updating bubble chart for:", genre);

        let gameIDs = this.genreToAppIDs[genre];

        // Define scales
        let xScale = d3.scalePow().exponent(0.4)
            .domain([0, d3.max(Object.values(this.appIDToInfo), d => d.avgPlaytime2Weeks)])
            .range([0, this.vizWidth]);

        let yScale = d3.scalePow().exponent(0.4)
            .domain([0, d3.max(Object.values(this.appIDToInfo), d => d.avgPlaytimeForever)])
            .range([this.vizHeight, 0]);

        let radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(Object.values(this.appIDToInfo), d => d3.mean(d.estimatedOwners))])
            .range([5, 50]); // Adjust min/max bubble sizes

        let colorScale = d3.scaleOrdinal()
            .domain([true, false])
            .range(["blue", "orange"]);



        // Create axes
        let xAxis = d3.axisBottom(xScale);
        let yAxis = d3.axisLeft(yScale);

        // Append axes (once)
        if (!this.g.select(".x-axis").node()) {
            this.g.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${this.vizHeight})`)
                .call(xAxis);

            this.g.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            // X-axis label
            this.g.append("text")
                .attr("class", "x-label")
                .attr("x", this.vizWidth / 2)
                .attr("y", this.vizHeight + 60)
                .style("text-anchor", "middle")
                .style("fill", "white")
                .text("Average Playtime (2 Weeks)");

            // Y-axis label
            this.g.append("text")
                .attr("class", "y-label")
                .attr("x", -this.vizHeight / 2)
                .attr("y", -60)
                .attr("transform", "rotate(-90)")
                .style("text-anchor", "middle")
                .style("fill", "white")
                .text("Average Playtime (Forever)");

            // Title
            this.g.append("text")
                .attr("class", "chart-title")
                .attr("x", this.vizWidth / 2)
                .attr("y", -20)
                .style("text-anchor", "middle")
                .style("font-size", "35px")
                .style("fill", "white")
                .text("Do Multiplayer Games Have Higher Player Retention?");
        } else {
            this.g.select(".x-axis").transition().duration(500).call(xAxis);
            this.g.select(".y-axis").transition().duration(500).call(yAxis);
        }

        // Bind data
        let bubbles = this.g.selectAll("circle")
            .data(Object.values(this.genreToAppIDs[genre]).sort(
                (a, b) => d3.mean(this.appIDToInfo[b].estimatedOwners) - d3.mean(this.appIDToInfo[a].estimatedOwners)
            ));

        // ENTER phase
        bubbles.enter()
            .append("circle")
            .attr("cx", d => xScale(this.appIDToInfo[d].avgPlaytime2Weeks))
            .attr("cy", d => yScale(this.appIDToInfo[d].avgPlaytimeForever))
            .attr("r", d => radiusScale(d3.mean(this.appIDToInfo[d].estimatedOwners)))
            .attr("fill", d => colorScale(this.appIDToInfo[d].isMultiplayer))
            .attr("opacity", 0.7)
            .merge(bubbles)
            .transition().duration(500)
            .attr("cx", d => xScale(this.appIDToInfo[d].avgPlaytime2Weeks))
            .attr("cy", d => yScale(this.appIDToInfo[d].avgPlaytimeForever))
            .attr("r", d => radiusScale(d3.mean(this.appIDToInfo[d].estimatedOwners)))
        ;
        // EXIT phase
        bubbles.exit()
            .transition().duration(500)
            .attr("r", 0)
            .remove();

        // ====== LEGEND ======
        let legend = this.g.select(".legend");
        if (!legend.node()) {
            legend = this.g.append("g").attr("class", "legend")
                .attr("transform", `translate(${this.vizWidth - 150}, 10)`);

            // Multiplayer legend
            legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", "blue");
            legend.append("text").attr("x", 10).attr("y", 5).style("fill", "white").text("Multiplayer");

            legend.append("circle").attr("cx", 0).attr("cy", 20).attr("r", 5).attr("fill", "orange");
            legend.append("text").attr("x", 10).attr("y", 25).style("fill", "white").text("Singleplayer");

            // Bubble size legend
            legend.append("circle").attr("cx", 0).attr("cy", 50).attr("r", 10).attr("fill", "gray").attr("opacity", 0.5);
            legend.append("text").attr("x", 15).attr("y", 55).style("fill", "white").text("Bigger = More Owners");
        }




    }


}





// console.log("hi");

