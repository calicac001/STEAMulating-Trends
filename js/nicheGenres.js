/******** DISTRIBUTION VIZ ********/
// distribution-plot

// popularity.csv -> for metric of 2-week playtime / lifetime playtime
// genres.csv -> the buckets are the genres
// basic_info.csv -> i could add a tooltip so that when you scroll through, you can see which games are there...?

// i need to make buckets... and i need to choose those buckets based on the data... hmph...
// i have a lotta stuff to do today... gonna kms!!!

// nvm: somehow work in the total number of players into the metric that i'm using? somehow normalize the metric
//       need to play with the metric once i get the visualization working, so i can *see* which metric makes more sense

    class NicheGenresDistribution {
    constructor(selector, popularity, genres, basicInfo, width = 750, height = 500,
        margins = {top: 75, bottom: 75, left: 75, right: 75}) {
        // this.popularity = popularity;
    
        // this.popularity = popularity;
        // this.genre = genres;
        // this.basicInfo = basicInfo;
        this.parentDiv = d3.select("#distribution-plot");
        this.parentCont = this.parentDiv.append("div").attr("class", "container");
        this.yap = this.parentDiv.append("p")
            .html("This graph uses a metric for each game:<br>\
                    &nbsp;&nbsp;&nbsp;&nbsp; (Metric = 2 Week Average Playtime / Forever Average Playtime).<br><br>\
                For each genre, the frequency of the metric is plotted, giving us some idea as to how long people stick to playing games in a certain genre.<br>\
                From the metric, one can conclude that: <br>\
                &nbsp;&nbsp;&nbsp;&nbsp; as the Forever Average Playtime (denominator) increases, the metric will decrease and<br>\
                &nbsp;&nbsp;&nbsp;&nbsp; as the 2 Week Average Playtime (numerator) increases, the metric will increase<br>\
                &nbsp;&nbsp;&nbsp;&nbsp; (and vice-versa).<br>\
                Here, we try to look for games with a smaller metric, as that would imply the game is being played for a long duration of time, implying a more loyal fan-base.<br>\
                This graph helps us see if there are any trends with player-base loyalty, and the game's genre.")
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
        const graphingData = NicheGenresDistribution.getGraphingData(popularity, genres, basicInfo);
        this.dataRange = graphingData.dataRange;
        this.freqRange = graphingData.freqRange;
        this.freq = graphingData.frequencies;
        this.graphFrequencies();
    }

    /////////////////////// making new shit, starting from scratch ////////////////////////
    static getGraphingData(popularity, genres, basicInfo) {
        return NicheGenresDistribution.bob(popularity, genres, basicInfo);
        // idk, i just liked to keep bob (i was scared of breaking things by renaming, but honestly i don't think anythoing would have happened :3)
    }

    static bob(popularity, genres, basicInfo) {
        const cleanedPopularity = NicheGenresDistribution.popularityCleaner(popularity);
        const cleanedGenres = NicheGenresDistribution.genresCleaner(genres);
        const cleanedBasicInfo = NicheGenresDistribution.basicInfoCleaner(basicInfo);
        // console.log(cleanedPopularity);
        // console.log(cleanedGenres);
        // console.log(cleanedBasicInfo);

        // const genreToGame = NicheGenresDistribution.getGenresToGames(cleanedGenres);
        // const gameToMetric = NicheGenresDistribution.getGameToMetric(cleanedPopularity);

        const genreToGameMetrics = NicheGenresDistribution.getGenreToGameMetrics(cleanedGenres, cleanedPopularity, cleanedBasicInfo);
        
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

        const dataRange = NicheGenresDistribution.getDataEndpoints(genreToGameMetrics);
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

        const frequencies = NicheGenresDistribution.getFrequencies(genreToGameMetrics, dataRange);
        const freqRange = NicheGenresDistribution.getFreqEndpoints(frequencies);
        // console.log(freqRanges);
        // console.log(bucketer(2));

        // the median data is kinda lame, it doesn't seem to give much insights, so ill just stick with the average
        // const medMetricData = {
        //     xScale: d3.scaleQuantile(dataRanges["medMetric"]),
            
        // };

        const filteredFrequencies = NicheGenresDistribution.filterFrequencies(frequencies);
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
        const genresList = NicheGenresDistribution.getGenresList(cleanedGenres);
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

    static getGameToMetrics(cleanedPopularity) {
        const gameToPopularity = NicheGenresDistribution.getGameToPopularity(cleanedPopularity);
        
        const gameToMetrics = {};
        for (const game of cleanedPopularity) {
            gameToMetrics[game["appID"]] = {
                "estimatedOwners": game["estimatedOwners"],
                "avgMetric": (+game["avgPlaytime2Weeks"]) / (+game["avgPlaytimeForever"]),
                "medMetric": (+game["medPlaytime2Weeks"]) / (+game["medPlaytimeForever"]),
                // TODO: this is where to change the metric calculation if i wanna finnik with the formula - involving estimatedOwners is something i might wanna do
                // 2week / forever -> gives a bunch of 0s
                // forever / 2week -> gives a bunch of inftys

                // i'm just gonna call them avgMetric and medMetric instead of avgPlaytimeMetric and medPlaytimeMetric
            };
            // console.log(game);
        }

        /*
        const k = "20";
        console.log(gameToPopularity[k]); 
        // gametoPopularity["20"]  // bruh. we have shit data. I'm guessing all the infinity metrics are coming from the denominator being 0 :\
        // {
        //     "estimatedOwners": "5000000 - 10000000",
        //     "avgPlaytimeForever": "143",
        //     "avgPlaytime2Weeks": "0",  // bruh
        //     "medPlaytimeForever": "23",
        //     "medPlaytime2Weeks": "0"  // bruh
        // }
        console.log(gameToMetric);  // takes a long time to show in the console when u click to expand, since, unlike for big arrays that allow u to see small ranges of the array, objects will expand and show *every* key-value pair (or, property value i think it's called in js)
        // return gameToMetric;

        let zero = 0;
        let nonzero = 0
        for (const game of Object.keys(gameToMetric)) {
            if (gameToMetric[game]["avgPlaytimeMetric"] === 0) {
                zero++;
            } else {
                nonzero++;
            }
        }
        // zero: 12862
        // nonzero: 84538
        // that's... a lot of zeros. bruh. over 10% of the data. a lotta the games have high ownership as well too which is odd!!
        console.log("zero:", zero);
        console.log("nonzero:", nonzero);
        */

        return gameToMetrics;

    }

    static getGameToName(cleanedBasicInfo) {
        const gameToName = {};
        for (const game of cleanedBasicInfo) {
            gameToName[game["appID"]] = game["name"];
        }
        return gameToName;
    }

    static getGenreToGameMetrics(cleanedGenres, cleanedPopularity, cleanedBasicInfo) {
        const genreToGame = NicheGenresDistribution.getGenresToGames(cleanedGenres);
        const gameToMetrics = NicheGenresDistribution.getGameToMetrics(cleanedPopularity);
        const gameToName = NicheGenresDistribution.getGameToName(cleanedBasicInfo);
        
        const genreToGameMetrics = {};
        for (const genre of Object.keys(genreToGame)) {
            // console.log(genre);
            // console.log(genreToGame[genre]);  // some genres only have like <5 games lmao -- i should filter those out...

            genreToGameMetrics[genre] = [];

            for (const appID of genreToGame[genre]) {
                genreToGameMetrics[genre].push({
                    "appID": appID,
                    "name": gameToName[appID],
                    "avgMetric": gameToMetrics[appID]["avgMetric"], 
                    "medMetric": gameToMetrics[appID]["medMetric"],
                    "genre": genre  // cuz why not, i guess we add another layer :shrug:
                })
            }

            // TODO: filter out genres that are too small or weird (i should do the filtering here as opposed to another spot so that it's at the very end all of the filtering)
            // FILTER OUT LIST:
            // - games that have a NaN metric
            // - both games have a 0 metric implies that both numerators are 0 (based on how it's currently implemented)
            // - also filter out for both being infty (if we take the reciprocal)
            // - genres that have a size of <10 (i think 10 is a good benchmark, could do a bigger number tho honestly) (26 with accounting is the next "small" one, followed by the rest of the genres which are of size 100+)
            // - (i should honestly have made it easier to finik with the metric tho... it is what it is!!! i'm too lazy to fix that rn, + not enough time)

        }

        return genreToGameMetrics;
    }

    static getDataEndpoints(genreToGameMetrics) {
        const endpointGetter = (metric, extrema) => extrema(Object.keys(genreToGameMetrics), d => extrema(genreToGameMetrics[d], e => e[metric]));
        return {
            "avgMetric": [
                endpointGetter("avgMetric", d3.min), endpointGetter("avgMetric", d3.max)
            ],
            "medMetric": [
                endpointGetter("medMetric", d3.min), endpointGetter("medMetric", d3.max)
            ]
        };
    }

    static getBucketFrequencies(bucketer, gameMetrics, metric) {
        // metricData.frequency is the ordinal scale, going from range(n) to the frequencies
        // (we don't modify frequency here, we return what we want the range to be)
        // return an array of the same size as metricData.frequency.domain()
        
        const numBuckets = bucketer.range().length;
        const bucketFrequency = Array(numBuckets).fill(0);
        // console.log(numBuckets, bucketFrequency);
        for (const datum of Object.values(gameMetrics)){
            // console.log(datum);
            const i = datum[metric];  // AHHH, putting gameMetrics here was causing the freezing...
            bucketFrequency[bucketer(i)]++;
            // console.log(i); 
            // ohhhh, metrics that are NaN are outputting undefined for the bucketer
        }

        // console.log(bucketFrequency);

        return bucketFrequency;
        // the distribution sucks...
    }

    static filterFrequencies(frequencies, threshold = 5) {
        // return the object of frequencies, but don't include the objects who's frequency array is just all 0s
        const newFrequencies = {};
        
        for (const key of Object.keys(frequencies)) {
            // console.log(frequencies);
            // console.log(key);
            // console.log(frequencies[key]);
            // prompt("ur mom");
            let numNon0s = 0;
            for (const elem of frequencies[key].range()) {
                if (elem != 0) {
                    numNon0s++;
                }
            }
            if (numNon0s >= threshold) {  // without this threshold we have a lotta genres that just don't have enough data 
                // ok, so i'm filtering out all the data here, which is basically the end
                newFrequencies[key] = frequencies[key];
                // console.log(frequencies[key].range())
            }
        }
        // console.log(Object.keys(newFrequencies));
        return newFrequencies;
    }

    static getFrequencies(genreToGameMetrics, dataRanges, numBuckets = 25) {
        // const avgMetricData = {}
        const bucketer = d3.scaleQuantile()
                .domain(dataRanges["avgMetric"])
                .range(d3.range(numBuckets));
        const frequencies = {};

        // console.log(Object.keys(genreToGameMetrics));
        for (const genre of Object.keys(genreToGameMetrics)) {
            frequencies[genre] = d3.scaleOrdinal()
                .domain(bucketer.range())
                .range(
                    NicheGenresDistribution.getBucketFrequencies(bucketer, genreToGameMetrics[genre], "avgMetric")
            );
            // console.log(genreToGameMetrics[genre]);
        }
        return frequencies;
    }

    static getFreqEndpoints(frequencies) {
        // Object.values(frequencies)  // an array of Ordinal Scales
        const endpointGetter = (extrema) => extrema(
            Object.values(frequencies), d => extrema(d.range())
        )
        
        return [
            endpointGetter(d3.min), endpointGetter(d3.max)
        ];
    }

    graphFrequencies() {
        // freq is a dict of genre names to ordinal scales ()

        this.numBuckets = Object.values(this.freq)[0].domain().length;  // all the domains should be the same
        // console.log(this.numBuckets);
        this.genres = Object.keys(this.freq);
        // console.log(this.genres);

        this.dropdown.selectAll("option")
            .data(this.genres)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        // console.log("kys");

        this.svg.style("background-color", "#5e6a75");
        this.g = this.svg.append("g")
            .attr("transform", `translate(${(this.svgWidth - this.vizWidth) / 2}, ${(this.svgHeight - this.vizHeight) / 2})`)
        ;



        // tq sam altman <3
        this.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0, " + this.vizHeight + ")"); // Translate to bottom of chart

        this.g.append("g")
            .attr("class", "y-axis");

        this.g.append("text")
            .attr("class", "x-axis-label")
            .style("font-size", "14px")
            .style("fill", "black");

        this.g.append("text")
            .attr("class", "y-axis-label")
            .style("font-size", "14px")
            .style("fill", "black");




        // make visualization within the group g
        this.updateVisualization(this.dropdown.property("value"));

        // listener
        this.dropdown.on("change", (event) => {
            const selectedGenre = event.target.value;  // Get selected genre
            console.log("Selected Genre:", selectedGenre);
        
            // Call a function to update the visualization based on selection
            this.updateVisualization(selectedGenre);
        });
    }

    updateVisualization(genre) {
        // Modify the existing D3 visualization based on the selected genre
        console.log("Updating visualization for:", genre);

        // THE DATA WE NEED TO GRAPH: cf, this.dataRanges, and this.freqRanges
        this.cf = this.freq[genre];  // *c*urrent *f*requency
        // console.log(cf);
        // console.log(this.dataRange);
        // this.freqRange

        // TODO:
            // make x, y axes, 
            // draw bars
            // (draw line chart as well?)
            // label axes (need to figure out label for x-axis...)
        // console.log(cf.domain());  it's \mathbb{Z}[0, 100)

        this.xScaleBars = d3.scaleLinear()
            .domain(d3.extent(this.cf.domain()))  // [0, 99]
            .range([0, this.vizWidth])
        ;
        this.xScaleData = d3.scaleLinear()
            .domain(this.dataRange.avgMetric)
            .range([0, this.vizWidth])
        ;
        this.yScale = d3.scalePow().exponent(0.4)  // I SEEEEE, POWER SCALE SEEMS TO BE THE WAY TO GO? WITH A <1 BASE   // good enough for now
            .domain(this.freqRange)
            .range([this.vizHeight, 0])
        ;

        this.bars = this.g.selectAll("rect")
            .data(this.cf.domain())
        ;        
        // this the data
        // console.log(this.cf.domain().map(
        //     (d) => this.cf(d)
        // ))
        
        this.bars.enter()
            .append("rect")
            .attr("class", "bar").attr("class", "sridhar-viz")
            .attr("x", (d) => this.xScaleBars(d))
            .attr("y", (d) => this.yScale(this.cf(d)))
            .attr("height", (d) => this.vizHeight - this.yScale(this.cf(d)))
            .attr("width", this.vizWidth / this.numBuckets)
            .attr("fill", "steelblue")
        ;

        this.bars.merge(this.bars)                     // **MERGE Update + Enter selections**
            .transition()                     // Smooth transition for updates
            .duration(500)
            .attr("x", (d) => this.xScaleBars(d))
            .attr("y", (d) => this.yScale(this.cf(d)))
            .attr("height", (d) => this.vizHeight - this.yScale(this.cf(d)))
        ;
        
        this.bars.exit()
            .transition()
            .duration(500)
            .attr("y", 0)   // Animate falling effect before removal
            .attr("height", 0)
            .remove()
        ;

        // tq sam altman <3
        // Add the vertical axis for frequency (y-axis)
        this.g.select(".y-axis")
            .transition()
            .duration(500)
            .call(d3.axisLeft(this.yScale));

        // Add the horizontal axis for avgmetric (x-axis)
        this.g.select(".x-axis")
            .transition()
            .duration(500)
            .call(d3.axisBottom(this.xScaleData));

        // Add the label for the vertical axis (frequency)
        this.g.select(".y-axis-label")
            .text("Frequency")
            .attr("x", -this.vizHeight / 2)  // Rotate label vertically
            .attr("y", -40)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle");

        // Add the label for the horizontal axis (avgmetric)
        this.g.select(".x-axis-label")
            .text("Metric (Lower ==> More Loyal Players)")
            .attr("x", this.vizWidth / 2)  // Center horizontally
            .attr("y", this.vizHeight + 40)
            .style("text-anchor", "middle");

            this.g.append("text")
            .attr("x", this.vizWidth / 2)  // Center the text horizontally
            .attr("y", 0)  // Position the title at the top
            .attr("text-anchor", "middle")  // Center the text
            .attr("font-size", "30px")
            .attr("font-weight", "bold")
            .text("Does Genre Imply Player-Base Loyalty?");


        // TODO: (next steps)
        // maybe add a line viz rather than a bar viz? (i just did bar cuz it was something i already knew how to do)
        // make the metric changeable? maybe even use changeable...? (kinda overkill, but maybe alternating beteween med and avg is a start)
        // be able to change the y-axis scale?
        // i should also see if i can change the x-axis scale... that might make the insights more useful...
            // the linear scale is kinda whack... i should see if that can be changed ngl
        // add tooltips

    }

}




// let nicheGenresDistribution = NicheGenresDistribution(
//     "#distribution-plot", );
