/******** DISTRIBUTION VIZ ********/
// distribution-plot

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
        aggregatedData(popularity, genres, basicInfo);

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

        popularityMapping = {}
        popularity.forEach(d => {
            popularityMapping[d["AppID"]] = {
                "AverageMetric": d["Average playtime forever"] / d["Average playtime two weeks"],
                "MedianMetric": d["Median playtime forever"] / d["Median playtime two weeks"]
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
        
        genresMapping = {}
        genres.forEach(d => {
            if (d["AppID"] in genresMapping) {
                genresMapping[d["AppID"]].push(d["Genre"]);
            } else {
                genresMapping[d["AppID"]] = [d["Genre"]];
            }
        })
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

        basicInfoMapping = {};
        basicInfo.forEach(d => {
            basicInfoMapping["AppID"] = d["Name"]
        })
        return basicInfo;

    }

    static finalData(popularity, genres, basicInfo) {
        let genresList = [...Set(
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
        let keysPop = new Set(...Object.keys(crunchedPopularity));
        let keysGen = new Set(...Object.keys(crunchedGenres));
        let keysBas = new Set(...Object.keys(crunchedBasicInfo));
        let appIDs = keysPop.intersection(keysGen).intersection(keysBas);

        appIDs.forEach(d => {
            let currGenre = crunchedGenres[d];
            finalData[currGenre].push(
                {
                    "AppID": d,
                    ...crunchedBasicInfo[d],  // we only have the Name rn, but that's good enough for now
                    ...crunchedPopularity[d]  // for averageMetric and medianMetric mappings            
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

        let fData = finalData(popularity, genres, basicInfo);
        let metric = "AverageMetric";
        // let metric = "MedianMetric";
        let lowerBound = d3.min(
            fData.keys().map(k => {
                let currArray = fData[k];
                return d3.min(currArray, elem => elem[metric]);
            })
        );  // so convoluted... not very demure... not very readable... :3
        let upperBound = d3.max(
            fData.keys().map(k => {
                let currArray = fData[k];
                return d3.max(currArray, elem => elem[metric]);
            })
        );

        console.log(lowerBound, upperBound)
        // The endpoints of the data range are: [lowerBound, upperBound]
        // we might as well make a scale and an axis to help out with buckets and whatnot

        // i hate making design decisions... i need to practice getting over this blocker...

        let 




    }
}

// let nicheGenresDistribution = NicheGenresDistribution(
//     "#distribution-plot", );
