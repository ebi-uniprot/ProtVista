// if you don't specify a html file, the sniper will generate a div
var app = require("biojs-vis-proteinfeaturesviewer");
var instance = new app(
    {
        el: yourDiv, text: 'biojs',
        uniprotacc : 'P05067',
        customCategories: [
            {sourceType: 'basic', categories: [{NOVELTIES: 'Novel features'}]}
        ],
        customTypes: {
            catalytic_site: {label: 'Catalytic site', tooltip: '', 'color': '#806699'},
            novel_feature: {label: 'Novel experimental features', tooltip: ''}
        },
        customDataSources: [
            {
                url: './data/externalFeatures_',
                type: 'basic',
                authority: 'myLab'
            }
        ]
    }
);
//P05067 most of the times, P21802 has a deletion
instance.getDispatcher().on("ready", function() {
    // console.log('ready');
});
instance.getDispatcher().on("featureSelected", function(obj) {
    // console.log('Feature selected');
    // console.log(obj);
});
instance.getDispatcher().on("featureDeselected", function(obj) {
    // console.log('Feature deselected');
    // console.log(obj);
});

var input = d3.select('body').append('div');
input.append('span').text('FtType: ');
input.append('input').attr('type', 'text').attr('id', 'ftType');
input.append('span').text('Begin: ');
input.append('input').attr('type', 'text').attr('id', 'ftBegin');
input.append('span').text('End: ');
input.append('input').attr('type', 'text').attr('id', 'ftEnd');
input.append('span').text('AltSeq: ');
input.append('input').attr('type', 'text').attr('id', 'atlSeq');
input.append('button').text('Select')
    .on('click', function() {
        var altSeq = d3.select('#atlSeq').node().value.toUpperCase();
        altSeq = altSeq.length === 0 ? undefined : altSeq;
        instance.selectFeature(
            d3.select('#ftType').node().value.toUpperCase(),
            d3.select('#ftBegin').node().value,
            d3.select('#ftEnd').node().value,
            altSeq);
    });
