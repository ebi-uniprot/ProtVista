"use strict";

var d3 = require("d3");
var _ = require("underscore");

var tooltipHandler = function(d) {
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
			.attr('colspan',2)
			.text(d.description);

	var startEndRow = table.append('tr');
	startEndRow.append('td').text('Position');
	startEndRow.append('td').text(d.begin + '-' + d.end);

	_.each(d.evidences, function(e,i){
		var typeRow = table.append('tr');
		typeRow.append('td').text('Type');
		typeRow.append('td').text(e.type);

		var sourceRow = table.append('tr');
		sourceRow.append('td').text('Source');
		sourceRow.append('td').text(e.source.dbReferenceType + ': ')
					.append('a')
					.attr('href', e.source.url)
					.text(e.source.dbReferenceId);
	});

};

module.exports = tooltipHandler;