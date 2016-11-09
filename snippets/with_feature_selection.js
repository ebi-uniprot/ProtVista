// if you don't specify a html file, the sniper will generate a div
var app = require("ProtVista");
var instance = new app({
    el: yourDiv,
    uniprotacc : 'P05067',
    selectedFeature: {
        begin: 26,
        end: 26,
        type: 'VARIANT',
        alternativeSequence: 'G'
    }
});
