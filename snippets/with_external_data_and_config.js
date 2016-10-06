// if you don't specify a html file, the sniper will generate a div
var app = require("ProtVista");
new app(
    {
        el: yourDiv, text: 'biojs',
        uniprotacc : 'P05067',
        customDataSource: {
            url: './data/externalFeatures_',
            source: 'myLab',
            useExtension: true
        },
        customConfig: './data/externalConfig.json'
    }
);