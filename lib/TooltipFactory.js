"use strict";

var d3 = require("d3");
var _ = require("underscore");

var Tooltip = function(d, sequence) {
    var tooltip = this;
    tooltip.data = d;
    tooltip.sequence = sequence;
    tooltip.tooltipViewer = undefined;

	d3.select('.fv-tooltip-container')
				.style('left',d3.event.pageX + 'px')
				.style('top',d3.event.pageY + 'px')
				.transition(200)
				.style('opacity',1)
				.style('display','block');

	d3.select('.fv-tooltip-container table').remove();

    tooltip.table = d3.select('.fv-tooltip-container').append('table');

	var descRow = tooltip.table.append('tr');

	descRow.append('th')
			.attr('colspan',3)
            .text(tooltip.data.type.label.toUpperCase());

    if (tooltip.data.description) {
        var descRow = tooltip.table.append('tr');
        descRow.append('td').attr('colspan',2).text('Description');
        descRow.append('td').text(tooltip.data.description);
    }

	var startEndRow = tooltip.table.append('tr');
	startEndRow.append('td').attr('colspan',2).text('Position');
	startEndRow.append('td').text(tooltip.data.begin + (tooltip.data.end ? '-' + tooltip.data.end : ''));

    tooltip.addEvidences = function(evidences) {
        var self = this;
        _.each(evidences, function(e, i){
            var typeRow = self.table.append('tr');
            typeRow.append('td').attr('colspan', 2).text('Evidence');
            typeRow.append('td')
                .append('a')
                .attr('href', 'http://www.ebi.ac.uk/ontology-lookup/?termId=' + e.code)
                .attr('target', '_blank')
                .text(e.code);

            var groupedSources = _.groupBy(e.sources, 'name');

            _.each(groupedSources, function(elem, index) {
                var sourceRow = self.table.append('tr').classed('fv-tooltip-small', true);
                sourceRow.append('td').classed('fv-tooltip-bar', true);
                sourceRow.append('td').text(index);
                var list = sourceRow.append('td');
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

    tooltip.addEvidences(tooltip.data.evidences);
};

Tooltip.mutagen = function() {
   this.tooltipViewer = new AlternativeTooltipViewer(this, 'Mutation');
};
Tooltip.conflict = function() {
    this.tooltipViewer = new AlternativeTooltipViewer(this, 'Conflict');
};
Tooltip.missense = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};
Tooltip.ms_del = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};
Tooltip.insdel = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};
Tooltip.stop_lost = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};
Tooltip.stop_gained = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};
Tooltip.init_codon = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};

var AlternativeTooltipViewer = function(tooltip, change) {
    if (tooltip.data.alternativeSequence) {
        var seqRow = tooltip.table.append('tr');
        seqRow.append('td').attr('colspan',2).text(change);
        seqRow.append('td')
            .text(function() {
                var original = tooltip.sequence.substring(+tooltip.data.begin - 1, +tooltip.data.begin - 1 + tooltip.data.alternativeSequence.length);
                return original + '\u2192' + tooltip.data.alternativeSequence;
            });
    }
};

var VariantTooltipViewer = function(tooltip) {
    if (tooltip.data.mutatedType) {
        var seqRow = tooltip.table.append('tr');
        seqRow.append('td').attr('colspan',2).text('Change');
        seqRow.append('td')
            .text(function() {
                var original = tooltip.sequence.substring(+tooltip.data.begin - 1, +tooltip.data.begin - 1 + tooltip.data.mutatedType.length);
                return original + '\u2192' + tooltip.data.mutatedType;
            });
    }
    if (tooltip.data.frequency && (tooltip.data.frequency !== 0)) {
        var freqRow = tooltip.table.append('tr');
        freqRow.append('td').attr('colspan',2).text('Frequency');
        freqRow.append('td').text(tooltip.data.frequency);
    }
    if (tooltip.data.polyphenPrediction && (tooltip.data.polyphenPrediction !== '-')) {
        var polyRow = tooltip.table.append('tr');
        polyRow.append('td').attr('colspan',2).text('Polyphen');
        polyRow.append('td').text(tooltip.data.polyphenPrediction + ', score ' + tooltip.data.polyphenScore);
    }
    if (tooltip.data.siftPrediction && (tooltip.data.siftPrediction !== '-')) {
        var siftRow = tooltip.table.append('tr');
        siftRow.append('td').attr('colspan',2).text('SIFT');
        siftRow.append('td').text(tooltip.data.siftPrediction + ', score ' + tooltip.data.siftScore);
    }
    if (tooltip.data.association) {
        var assocRow = tooltip.table.append('tr');
        assocRow.append('th').attr('colspan',3).text('Disease Association');

        var diseaseRow = tooltip.table.append('tr');
        diseaseRow.append('td').attr('colspan',2).text('Disease');
        diseaseRow.append('td').text(tooltip.data.association.diseaseName);

        if (tooltip.data.association.description) {
            var descRow = tooltip.table.append('tr');
            descRow.append('td').attr('colspan', 2).text('Description');
            descRow.append('td').text(tooltip.data.association.description);
        }
        tooltip.addEvidences(tooltip.data.association.evidences);
    }
};

var TooltipFactory = function() {
    return {
        createTooltip: function(data, sequence) {
            var tooltip
                , type = data.type.name.toLowerCase();

            // error if the constructor doesn't exist
            if (typeof Tooltip[type] !== "function") {
                tooltip = new Tooltip(data, sequence);
            } else {
                Tooltip[type].prototype = new Tooltip(data, sequence);
                tooltip = new Tooltip[type]();
            }

            return tooltip;
        }
    };
}();

module.exports = TooltipFactory;