/******** DISTRIBUTION VIZ ********/
// distribution-plot

// popularity.csv -> for metric of 2-week playtime / lifetime playtime
// genres.csv -> the buckets are the genres
// basic_info.csv -> i could add a tooltip so that when you scroll through, you can see which games are there...?

// i need to make buckets... and i need to choose those buckets based on the data... hmph...
// i have a lotta stuff to do today... gonna kms!!!



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
        NicheGenresDistribution.aggregatedData(popularity, genres, basicInfo);

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
            popularityMapping[+d["AppID"]] = {
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
            if (+d["AppID"] in genresMapping) {
                genresMapping[+d["AppID"]].push(d["Genre"]);
            } else {
                genresMapping[+d["AppID"]] = [d["Genre"]];
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
            basicInfoMapping[+d["AppID"]] = d["Name"]
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
            finalData[d] = []  // make a new empty arrayfor each genre
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

        while (false || !popDone || !genDone || !basDone) {
            // merging the 3 arrays into 1 -- issue: they may or may not be distinct!
            // but, when merging we can detect for duplicates and skip adding them

            let vals = [];
            if (!popDone) {
                vals.push([keysPopSorted, i]);
            } if (!genDone) {
                vals.push([keysGenSorted, j]);
            } if (!basDone) {
                vals.push([keysBasSorted, k]);
            } else {
                break;  // shouldn't need to get here since i moved the ___Done variables to update at the end
            }

            let currMin = vals.sort(
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

        console.log(keysPopSorted);
        console.log(keysGenSorted);
        console.log(keysBasSorted);
        console.log(appIDs);

        // console.log(crunchedGenres);

        appIDs.forEach(id => {
            console.log(id);
            let currGenre = crunchedGenres[id];
            finalData[currGenre].push(
                {
                    "AppID": id,
                    ...crunchedBasicInfo[id],  // we only have the Name rn, but that's good enough for now
                    ...crunchedPopularity[id]  // for averageMetric and medianMetric mappings            
                }
            )
        })

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
}

// let nicheGenresDistribution = NicheGenresDistribution(
//     "#distribution-plot", );
