// if you don't specify a html file, the sniper will generate a div
var app = require("ProtVista");
var instance = new app({
    el: yourDiv
    , uniprotacc : 'P05067'
    , categoryOrder: ['DOMAINS_AND_SITES', 'VARIATION', 'PTM']
});
//P05067 most of the times, P21802 has a deletion

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
