// if you don't specify a html file, the sniper will generate a div
var catType = require("categoryTypeTrack");
var instance = new catType({
    element: document.getElementById("target"),
    isTrackCategory: true,
    categoryIndex: 0,
    typeIndex: 0,
    wrapperSeedId: "catWrapperId",
    collapsible: true,
    dark: true,
    featuresStyle: {
        width: "1050px",
        height: "39px"
    }
});
