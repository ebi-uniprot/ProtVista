// if you don't specify a html file, the sniper will generate a div
var app = require("ProtVista");
new app(
    {
        el: yourDiv,
        uniprotacc : 'P05067',
        customDataSource: {
            url: './data/externalFeatures_',
            source: 'myLab',
            useExtension: true
        },
        overwritePredictions: true,
        defaultSources: false
    }
);
