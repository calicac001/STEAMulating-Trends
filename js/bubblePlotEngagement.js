/******** BUBBLE PLOT ENGAGEMENT VIZ ********/
// bubble-plot-engagement

let parentDiv = d3.select("#bubble-plot-engagement");
let parentCont = parentDiv.append("div")
.attr("class", "container")
;

// Placeholder
parentCont.append("img")
    .attr("src", "img/bubble-plot-engagement.jpg")
    .attr("width", 500)
    .attr("height", 500)
    .attr("display", "block")
;



class BubblePlotChart {
    constructor(selector, popularity, genres, basicInfo, width = 750, height = 500,
        margins = {top: 75, bottom: 75, left: 75, right: 75}) {
        // this.popularity = popularity;
    
        // this.popularity = popularity;
        // this.genre = genres;
        // this.basicInfo = basicInfo;
        this.parentDiv = d3.select("#distribution-plot");
        this.parentCont = this.parentDiv.append("div").attr("class", "container");
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
        const graphingData = BubblePlotChart.getGraphingData(popularity, genres, basicInfo);
        this.dataRange = graphingData.dataRange;
        this.freqRange = graphingData.freqRange;
        this.freq = graphingData.frequencies;
        this.graphFrequencies();
    }

    /////////////////////// making new shit, starting from scratch ////////////////////////
    static getGraphingData(popularity, genres, basicInfo) {
        return BubblePlotChart.bob(popularity, genres, basicInfo);
        // idk, i just liked to keep bob (i was scared of breaking things by renaming, but honestly i don't think anythoing would have happened :3)
    }

    static bob(popularity, genres, basicInfo) {
        const cleanedPopularity = BubblePlotChart.popularityCleaner(popularity);
        const cleanedGenres = BubblePlotChart.genresCleaner(genres);
        const cleanedBasicInfo = BubblePlotChart.basicInfoCleaner(basicInfo);
        // console.log(cleanedPopularity);
        // console.log(cleanedGenres);
        // console.log(cleanedBasicInfo);

        // const genreToGame = BubblePlotChart.getGenresToGames(cleanedGenres);
        // const gameToMetric = BubblePlotChart.getGameToMetric(cleanedPopularity);

        const genreToGameMetrics = BubblePlotChart.getGenreToGameMetrics(cleanedGenres, cleanedPopularity, cleanedBasicInfo);
        
        // DESIGN DECISION TO SCRAP THIS AND JUST DO A GLOBAL MIN/MAX
        // const genreToMinMetric = {};
        // const genreToMaxMetric = {};
        // const metric = "avgMetric";  // or "medMetric"  -- idk if i'll keep both, but for now i'll switch manually and see from there
        // // i'll find the max manually cuz doing the data manipulation *just* do use d3.max/d3.min seems annoying
        // for (const genre of Object.keys(genreToGameMetrics)) {
        //     genreToMinMetric[genre] = Number.POSITIVE_INFINITY;
        //     genreToMaxMetric[genre] = Number.NEGATIVE_INFINITY;
        //     for (const game of genreToGameMetrics[genre]) {
        //         if (genreToMaxMetric[genre] < game[metric]) {
        //             genreToMaxMetric[genre] = game[metric];
        //         }
        //         if (genreToMinMetric[genre] > game[metric]) {
        //             genreToMinMetric[genre] = game[metric];
        //         } 
        //     }
        // }
        // console.log(genreToGameMetrics);
        // console.log(genreToMinMetric);
        // console.log(genreToMaxMetric);

        const dataRange = BubblePlotChart.getDataEndpoints(genreToGameMetrics);
        // console.log(dataRanges);
        // {"avgMetric": [0, 17.8855421686747],
        //  "medMetric": [0, 618.0322580645161]}
        // i wonder how much the further data filtering will impact this...

        // there might be different benefits to showing the data 

        // there's some naming clarifications i could make with "game" vs "appID"

        // DONE: take cleaned data, and make frequency distribution chart with buckets
        // first gotta process the data into buckets
        // then i have to graph this distribution (with some sort of bar chart or something)
        // then play with the axes to see what kinda scale shows the data in an intersting way

        // MAIN DATA PIECES:
        // genreToGameMetrics, dataRanges

        // DONE:
        // make scales according to the mins and maxes for each genre (x-axis)   (atp it might be worth making a class for each genre to organize the data... but that's just a js object, like a dataclass... idk if there's really that much of a difference, idk!!)
        // do we wanna make all the x-axis the same...? DESIGN DECISION: YES, THAT'S THE WHOLE POINT (compare genres to other genres: if we have different scales then there's no reference point...) (might want log scale if using median metric...)
        // make buckets for the scales
        // make make frequency distribution based on the buckets and the scales
        // make scale for the frequency (y-axis)

        const frequencies = BubblePlotChart.getFrequencies(genreToGameMetrics, dataRange);
        const freqRange = BubblePlotChart.getFreqEndpoints(frequencies);
        // console.log(freqRanges);
        // console.log(bucketer(2));

        // the median data is kinda lame, it doesn't seem to give much insights, so ill just stick with the average
        // const medMetricData = {
        //     xScale: d3.scaleQuantile(dataRanges["medMetric"]),
            
        // };

        const filteredFrequencies = BubblePlotChart.filterFrequencies(frequencies);
        // some of the genres straight up suck. no real data. do i manually filter them or should i automatically filter them?
        // maybe automatically...

        // ok perf..
        // now, we gotta:
            // - pull out the code into another method (i forget the term)
            // - make the damn visualization with all this data!!!
            // and then do the bubble chart, ugh
        
        // filteredFrequencies is all we need to graph shit
        // now i need to go back into prior labs and whatnot to figure out how tf i do that LMFAO

        return {frequencies: filteredFrequencies, dataRange: dataRange, freqRange: freqRange};
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

    static getGenresToGames(cleanedGenres) {
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

    static getGameToPopularity(cleanedPopularity) {
        const gameToPopularity = {};
        for (const game of cleanedPopularity) {
            gameToPopularity[game["appID"]] = {
                "estimatedOwners": game["estimatedOwners"],
                "avgPlaytimeForever": game["avgPlaytimeForever"],
                "avgPlaytime2Weeks": game["avgPlaytime2Weeks"],
                "medPlaytimeForever": game["medPlaytimeForever"],
                "medPlaytime2Weeks": game["medPlaytime2Weeks"]
            };
            // console.log(game);
        }
        // console.log(gameToPopularity);  // takes a long time to show in the console when u click to expand, since, unlike for big arrays that allow u to see small ranges of the array, objects will expand and show *every* key-value pair (or, property value i think it's called in js)
        return gameToPopularity;
    }

    static getGameToName(cleanedBasicInfo) {
        const gameToName = {};
        for (const game of cleanedBasicInfo) {
            gameToName[game["appID"]] = game["name"];
        }
        return gameToName;
    }


}





// console.log("hi");


