// if you don't specify a html file, the sniper will generate a div
var app = require("ProtVista");
new app(
    {
        el: yourDiv, text: 'biojs',
        uniprotacc : 'P05067',
        customDataSources: [
            {
                url: './data/externalFeatures_',
                authority: 'myLab',
                useExtension: true
            },
            {
                url: './data/externalVariants_',
                authority: 'myOtherLab',
                useExtension: true
            }
        ]
    }
);
