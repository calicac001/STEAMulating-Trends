# STEAMulating Trends: What Data Reveals About Game Success
CSC316 Final Project

**Group:** datav2_clean_FINAL3.csv.xlsx 
* Runce Zhang
* Chloe Nichole Calica
* Sridhar Sairam

## Project Abstract
Steam is the largest digital distribution platform for PC gaming, with millions of active users and a vast library of games spanning every genre. As the go-to marketplace for both indie developers and major studios, Steam serves as a crucial indicator of gaming trends and player preferences. Understanding what makes a game successful on Steam can provide valuable insights for developers, publishers, and gamers alike.
This project aims to explore game popularity through data-driven visualizations, uncovering trends in user engagement, reviews, pricing, and genre preferences. By analyzing Steam's extensive dataset, we will identify patterns such as how discounts influence player counts, how reviews correlate with sales, which genres have gained or lost popularity over time, and how gaming preferences vary between player regions. 
Our goal is to present clear, insightful visuals that not only inform but also engage viewers in understanding the key drivers of success in the gaming industry. Through this project, we seek to provide both casual gamers and game developers with actionable insights, demonstrating how data visualization can STEAMulate a deeper understanding of what makes a game thrive in this competitive marketplace

## Project Links
* [Website](https://calicac001.github.io/STEAMulating-Trends/)
* [Screencast Videos]()
* [Process Book](https://docs.google.com/document/d/11ZYcT3DPbJzVECYaHlDDjPvSZZJ4TiAuDt8LC67UKsw/edit?tab=t.0)

## Dataset Source

## Code Overview
This section goes over the project code, the libraries used in the implementation, and the non-obvious features of the website's interface.

### Website Structure and Design
* **FullPage.js**
* **Bootstrap.js**
* **cyberpunk.css**
* **Neon border**
* **Image Carousel**

### Data Visualizations
All data visualizations used the **D3.js** library.

**1. Calendar Plot**
* Adapted code from Mike Bostock's [Calendar Plot](https://observablehq.com/@d3/calendar/2) built in the D3 implementation of the Observable platform
* It was modified to follow the `init()`, `wrangleData()`, and `updateVis()` pattern that we have used in class to create the base plot
* Additional features of the plot such as the data wrangling, filtering, and animation were done by Chloe

**2. Diverging Bar Chart**
* Adapted code from Mike Bostock's [Diverging Bar Chart](https://observablehq.com/@d3/diverging-bar-chart/2) built in the D3 implementation of the Observable platform. 
* It was modified to follow the `init()` and `updateVis()` pattern used in class. The data processing is done in the main js file.
* Additional features such as hover tooltip and data wrangling were done by Runce.

**3. Hexbin Plot**
* Adapted code from Mike Bostock's [Hexbin Plot](https://observablehq.com/@d3/hexbin) built in the D3 implementation of the Observable platform
  * Bostock's code was based on the [d3-hexbin.js](https://github.com/d3/d3-hexbin) library which was also consulted to create the base plot
* It was modified to follow the `init()`, `wrangleData()`, and `updateVis()` pattern that we have used in class
* Additional features such as data wrangling, and overlyaing with different colors (genre vs number of games) were done by Chloe
  
**4. Bubble Chart**

**5. Line Chart**
* Adapted code from Mike Bostock's [Line Chart](https://observablehq.com/@d3/line-chart/2) built in the D3 implementation of the Observable platform.
* Also adapted code from W5 and W6's labs, following the `init()` and `updateVis()` pattern used in class.
* Additional features such as data filtering and hover tooltip were done by Runce.

**6. Distribution Plot**

