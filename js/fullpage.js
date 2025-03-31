// Initialize the fullpage object
var myFullpage = new fullpage('#fullpage', {
    anchors: ["STEAMulating-Trends", "Overview &#x1F30D", "A Look Through Time &#8987", "Seasonal Trends",
        "Review Sentiment", "Reviews by Genres", "Player Engagement", "Genre Growth", "Niche Genres", "Main Message",
        "Solution", "Our Team", "Sources"],

    navigation: true,

    // Navigation for horizontal slides
    slidesNavigation: true,

    controlArrows: false,
    licenseKey: ""
});

// Create the navigation bar see on the right side of the page
document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll(".section");
    const navContainer = document.createElement("div");
    navContainer.id = "fp-nav";
    navContainer.className = "fp-right";

    const navList = document.createElement("ul");

    sections.forEach((section, index) => {
        const anchor = section.getAttribute("data-anchor") || `section${index + 1}`;
        const sectionName = ["STEAMulating-Trends", "Overview &#x1F30D", "A Look Through Time &#8987", "Seasonal Trends",
            "Review Sentiment", "Reviews by Genres", "Player Engagement", "Genre Growth", "Niche Genres", "Main Message",
            "Solution", "Our Team", "Sources"];

        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <a href="#${anchor}">
                <span class="fp-sr-only">${encodeURIComponent(sectionName[index])}</span>
                <span></span>
            </a>
            <div class="fp-tooltip fp-right">${sectionName[index]}</div>
        `;
        navList.appendChild(listItem);
    });

    navContainer.appendChild(navList);
    document.body.appendChild(navContainer);
});

