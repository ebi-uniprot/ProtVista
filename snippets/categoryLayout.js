// if you don't specify a html file, the sniper will generate a div
var catType = require("biojs-vis-proteinTrackViewer");
var instance = new catType({
    element: document.getElementById("target"),
    title: "MOLECULE PROCESSING",
    isTrackCategory: true,
    categoryIndex: 0,
    typeIndex: 0,
    wrapperSeedId: "catWrapperId",
    collapsible: true,
    dark: true,
    content: "withBridges",
    featuresWidth: 1050
});
