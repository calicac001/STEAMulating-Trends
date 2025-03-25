/******** DISTRIBUTION VIZ ********/
// distribution-plot

// popularity.csv -> for metric of 2-week playtime / lifetime playtime
// genres.csv -> the buckets are the genres
// basic_info.csv -> i could add a tooltip so that when you scroll through, you can see which games are there...?

// i need to make buckets... and i need to choose those buckets based on the data... hmph...
// i have a lotta stuff to do today... gonna kms!!!

// TODO: somehow work in the total number of players into the metric that i'm using? somehow normalize the metric
//       need to play with the metric once i get the visualization working, so i can *see* which metric makes more sense

class NicheGenresDistribution {
    constructor(selector, popularity, genres, basicInfo) {
        // this.popularity = popularity;

        let parentDiv = d3.select("#distribution-plot");
        this.parentCont = parentDiv.append("div").attr("class", "container");
        this.svg = parentCont.append("svg")
            .attr("width", 500)
            .attr("length", 500)
        ;

        // console.log(popularity, genres, basicInfo);
        const freq = NicheGenresDistribution.getGraphingData(popularity, genres, basicInfo);
        NicheGenresDistribution.graphFrequencies(freq);
    }

    static tempViz() {
        console.log("AJWEFOIJAWEFJAOIWEFJOIAWJEFPOAWEJEOFJAPWOIEFJOIAWJEFOIAEWJF");

        let parentDiv = d3.select("#distribution-plot");
        let parentCont = parentDiv.append("div")
        .attr("class", "container")
        ;
        
        // Placeholder
        parentCont.append("img")
            .attr("src", "img/distribution-plot.jpg")
            .attr("width", 500)
            .attr("height", 500)
            .attr("display", "block")
        ;
    }

    static popularityCruncher(popularity) {
        /**
        Example popularity object:
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

        // crunch data, return just what is needed

        // return popularity.map(d => ({
        //     "AppID": d["AppID"],
        //     "AverageMetric": d["Average playtime forever"] / d["Average playtime two weeks"],
        //     "MedianMetric": d["Median playtime forever"] / d["Median playtime two weeks"]
        //     // TODO: see if i wanna use these as the metrics, or their inverses
        // }))

        let popularityMapping = {};
        popularity.forEach(d => {
            popularityMapping[d["AppID"]] = {
                "AverageMetric": (+d["Average playtime forever"]) / (+d["Average playtime two weeks"]),
                "MedianMetric": (+d["Median playtime forever"]) / (+d["Median playtime two weeks"])
            }
        })
        return popularityMapping;
    }

    static genresCruncher(genres) {
        /**
        Example genres object
            {
            "AppID": "10",
            "Genres": "Action"
            }
         */
        // there is no need to do any crunching

        // note: even though it says "Genres" (plural),
        // we just have 1 genre per object.
        // since a game can have multiple genres, "AppID" is not a unique key here,
        // so for ex {"AppID": 2525, "Genres": "Casual"} and {"AppID": 2525, "Genres": "Indie"}
        // both can be entries in the array genres
        
        let genresMapping = {}
        genres.forEach(d => {
            if (d["AppID"] in genresMapping) {
                genresMapping[d["AppID"]].push(d["Genre"]);
            } else {
                genresMapping[d["AppID"]] = [d["Genre"]];
            }
        });
        
        return genresMapping;
    }

    static basicInfoCruncher(basicInfo) {
        /**
        Example basicInfo object
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

        // i think we just need the appID and the name

        // return basicInfo.map(
        //     d => ({
        //         "AppID": d["AppID"],
        //         "Name": d["Name"]
        //     })
        // );

        let basicInfoMapping = {};
        basicInfo.forEach(d => {
            basicInfoMapping[d["AppID"]] = d["Name"]
        });
    
        return basicInfoMapping;
    }

    static finalData(popularity, genres, basicInfo) {
        let genresList = [... new Set(
            genres.map(d => d["Genres"])
        )];

        let crunchedPopularity = NicheGenresDistribution.popularityCruncher(popularity);
        let crunchedGenres = NicheGenresDistribution.genresCruncher(genres);
        let crunchedBasicInfo = NicheGenresDistribution.basicInfoCruncher(basicInfo);

        let finalData = {};

        genresList.forEach(d => {
            finalData[d] = []  // make a new empty array for each genre
        });

        // does each game have both at least one genre and popularity data...? idk, ill just take the intersection of the AppIDs just to be safe... 
        // console.log("we here ");
        // console.log(Object.keys(crunchedPopularity), Object.keys(crunchedGenres), Object.keys(crunchedBasicInfo));  // 97400, 97400, 97401  :ROFL:  ... no wonder these keys thingies are giving an error... Maximum call stack size exceeded

        // TODO: find a better way of finding the intersection of these sets lol
        // let keysPop = new Set(...Object.keys(crunchedPopularity));
        // let keysGen = new Set(...Object.keys(crunchedGenres));
        // let keysBas = new Set(...Object.keys(crunchedBasicInfo));
        // let appIDs = keysPop.intersection(keysGen).intersection(keysBas);

        // sort the keys and then merge them together? this would "flatten" the work (rather than stacking more and more on the stack, i just iterate more)
        // can i just make a hashmap using the array indices to the values...? isn't it just the numbers going up...? probably not ngl...
        // ugh, the merging seems difficult... cuz you have to check and see if the number is in all 3 of the lists... 

        /*
        let appIDs = []; let n = -1;
        let keysPopSorted = Object.keys(crunchedPopularity).map(d => +d).sort((a, b) => a-b); let i = 0;
        let keysGenSorted = Object.keys(crunchedGenres).map(d => +d).sort((a, b) => a-b); let j = 0;
        let keysBasSorted = Object.keys(crunchedBasicInfo).map(d => +d).sort((a, b) => a-b); let k = 0;
        //  WHY DO THESE THINGS HAPPEN IN JS ??? WTF IS THIS STRING SORTING BULLSHIT
        //  AND THEN SINCE I CONVERTED IT TO INTS I NEED TO MAKE MY OWN CALLBACK COMPARATOAOWIEJFOIAWEFOIAEWOIFAWEOI
        // the mapping is there to force the keys to be ints
        let popDone = i >= keysPopSorted.length;
        let genDone = j >= keysGenSorted.length;
        let basDone = k >= keysBasSorted.length;

        while (!popDone || !genDone || !basDone) {
            // merging the 3 arrays into 1 -- issue: they may or may not be distinct!
            // but, when merging we can detect for duplicates and skip adding them

            let nextCandidates = [];
            if (!popDone) {
                nextCandidates.push([keysPopSorted, i]);
            } if (!genDone) {
                nextCandidates.push([keysGenSorted, j]);
            } if (!basDone) {
                nextCandidates.push([keysBasSorted, k]);
            } else {
                console.log("breaking... this probs shouldn't happen...");
                break;  // shouldn't need to get here since i moved the ___Done variables to update at the end
            }

            let currMin = nextCandidates.sort(
                (a, b) => (b[0][b[1]] - a[0][a[1]])  // checks the value of the array at the respective index i/j/k
            )[0];  // takes the minimum
            
            if (n == -1 || appIDs[n] != currMin[0][currMin[1]]) {  // if the original array is empty, or we don't have a duplicate value, we push
                appIDs.push(
                    currMin[0][currMin[1]]
                );
                n += 1;
            }  // no pushing values otherwise

            switch (currMin[0]) {
                case keysPopSorted: i += 1; break;
                case keysGenSorted: j += 1; break;
                case keysBasSorted: k += 1; break;
            };  // always going to get through one element of the to-be-merged arrays

            popDone = i >= keysPopSorted.length;
            genDone = j >= keysGenSorted.length;
            basDone = k >= keysBasSorted.length;

        }

        */
        // console.log(keysPopSorted);
        // console.log(keysGenSorted);
        // console.log(keysBasSorted);
        // console.log(appIDs);

        let appIDs = Object.keys(crunchedPopularity)/*.map(d => +d)*/;
        
        /*
        appIDs.forEach(id => {
            // console.log(crunchedBasicInfo[id]);
            // console.log(crunchedPopularity[id]);
            let currGenres = crunchedGenres[id];  // THIS IS AN ARRAY OF GENRESLIAMWEO;IFJAOWI;EFJO;IAWEJO;IFE  
            console.log(crunchedGenres, id);
            console.log(currGenres);
            console.log(Object.keys(crunchedGenres));
            // MAP VS OBJECT????!!? KMS!!!!!!!!!!!!!!!!!
            let v = {
                "AppID": id,
                "Name": crunchedBasicInfo[id],  // we only have the Name rn, but that's good enough for now
                ...(crunchedPopularity[id])  // for averageMetric and medianMetric mappings  
            };
            console.log(v);
            console.log(finalData, currGenres);
            
            currGenres.forEach(currGenre =>
                finalData[currGenre].push(
                    v
                )
            )
        })
        console.log(finalData);
        */

        for (const id of appIDs) {
            console.log(crunchedBasicInfo[id]);
            console.log(crunchedPopularity[id]);
            let currGenres = crunchedGenres[id]
            console.log(currGenres);
        }

        return finalData;
        // a mapping from genres, to an array of objects, that contain some info about a game.


    }

    static aggregatedData(popularity, genres, basicInfo) {
        // now we actually need to use the "final data" and then get our distribution bar graph data,
        // when THEN needs to be plot, but ig that'll be easier since I've plotted these kinda things before...
        // but it'll still be a bit time consumaxg, ugh...
        // data manipulation moment

        let fData = NicheGenresDistribution.finalData(popularity, genres, basicInfo);
        let metric = "AverageMetric";
        // let metric = "MedianMetric";

        let lowerBound = d3.min(
            Object.keys(fData).map(k => {
                let currArray = fData[k];
                return d3.min(currArray, elem => elem[metric]);
            })
        );  // so convoluted... not very demure... not very readable... :3
        let upperBound = d3.max(
            Object.keys(fData).map(k => {
                let currArray = fData[k];
                return d3.max(currArray, elem => elem[metric]);
            })
        );

        console.log(lowerBound, upperBound)
        // The endpoints of the data range are: [lowerBound, upperBound]
        // we might as well make a scale and an axis to help out with buckets and whatnot

        // i hate making design decisions... i need to practice getting over this blocker...

        // let 




    }

    /////////////////////// making new shit, starting from scratch ////////////////////////
    static getGraphingData(popularity, genres, basicInfo) {
        return NicheGenresDistribution.bob(popularity, genres, basicInfo);
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

        const dataRanges = NicheGenresDistribution.getDataEndpoints(genreToGameMetrics)
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

        const frequencies = NicheGenresDistribution.getFrequencies(genreToGameMetrics, dataRanges)
    
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

        return filteredFrequencies;
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

    static getFrequencies(genreToGameMetrics, dataRanges, numBuckets = 100) {
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

    static graphFrequencies(freq) {
        // freq is a dict of genre names to ordinal scales ()

        const numBuckets = Object.values(freq)[0].domain().length;  // all the domains should be the same
        console.log(numBuckets);
        const genres = Object.keys(freq);
        console.log(genres);

        


    }

}




// let nicheGenresDistribution = NicheGenresDistribution(
//     "#distribution-plot", );
