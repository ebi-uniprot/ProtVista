"use strict";

var d3 = require("d3");
var _ = require("underscore");

var TooltipHandler = function(d) {
	d3.select('.fv-tooltip-container')
				.style('left',d3.event.pageX + 'px')
				.style('top',d3.event.pageY + 'px')
				.transition(200)
				.style('opacity',1)
				.style('display','block');

	d3.select('.fv-tooltip-container table').remove();

	var table = d3.select('.fv-tooltip-container').append('table');

	var descRow = table.append('tr');

	descRow.append('th')
			.attr('colspan',3)
			.text(d.description ? d.description : '');

	var startEndRow = table.append('tr');
	startEndRow.append('td').attr('colspan',2).text('Position');
	startEndRow.append('td').classed('fv-tooltip-value', true).text(d.begin + '-' + (d.end ? d.end : d.begin));

	_.each(d.evidences, function(e,i){
		var typeRow = table.append('tr');
		typeRow.append('td').attr('colspan',2).text('Evidence');
		typeRow.append('td').classed('fv-tooltip-value', true)
            .append('a')
            .attr('href', 'http://www.ebi.ac.uk/ontology-lookup/?termId=' + e.code)
            .attr('target', '_blank')
			.text(e.code);

        var groupedSources = _.groupBy(e.sources, 'name');

		_.each(groupedSources, function(elem, index) {
            var sourceRow = table.append('tr').classed('fv-tooltip-small', true);
            sourceRow.append('td').classed('fv-tooltip-bar', true);
            sourceRow.append('td').text(index);
            var list = sourceRow.append('td').classed('fv-tooltip-value', true);
            _.each(elem, function(el, i) {
                list.append('span').append('a')
                    .attr('href', el.url)
                    .attr('target', '_blank')
                    .text(el.id);
                if (i !== (elem.length-1)) {
                    list.append('span').text(', ');
                }
            })
        });
	});

};

module.exports = TooltipHandler;