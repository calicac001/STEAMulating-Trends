// Initialize the fullpage object
var myFullpage = new fullpage('#fullpage', {
    //anchors: ['firstPage', 'secondPage', '3rdPage', '4thPage'],
    // you can also use the HTML attribute data-tooltip on each section instead
    //navigationTooltips: ['First Section', 'Second Section', 'Third Section'],
    navigation: true,

    // Navigation for horizontal slides
    slidesNavigation: true,

    controlArrows: false
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
        const sectionName = section.querySelector("h1")?.innerText || `Section ${index + 1}`;

        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <a href="#${anchor}">
                <span class="fp-sr-only">${encodeURIComponent(sectionName)}</span>
                <span></span>
            </a>
            <div class="fp-tooltip fp-right">${sectionName}</div>
        `;
        navList.appendChild(listItem);
    });

    navContainer.appendChild(navList);
    document.body.appendChild(navContainer);
});

