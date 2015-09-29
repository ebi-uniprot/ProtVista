/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");

var createTooltipBox = function(container) {
    d3.select('.up_pftv_tooltip-container').remove();
    var tooltipContainer = container.append('div')
        .attr('class','up_pftv_tooltip-container');
    tooltipContainer.append('span')
        .text('x')
        .attr('class','up_pftv_tooltip-close')
        .on('click',function(){
            tooltipContainer.transition(20)
                .style('opacity',0)
                .style('display','none');
            tooltipContainer.remove();
        });
    return tooltipContainer;
};

var getEvidenceText = function(tooltip, code, sources) {
    var acronym = tooltip.evidences[code];
    var publications = _.where(sources, {name: 'PubMed'}).length;
    publications += _.where(sources, {name: 'citation'}).length;
    if ((acronym === 'EXP') || (acronym === 'NAS')) {
        return publications + (publications > 1 ? ' Publications' : ' Publication');
    } else if (acronym === 'IC') {
        return publications === 0
            ? 'Curated'
            : publications + (publications > 1 ? ' Publications' : ' Publication');
    } else if (acronym === 'ISS') {
        return 'By similarity';
    } else if (acronym === 'ISM') {
        return !sources || sources.length === 0 ? 'Sequence Analysis': sources[0].name + ' annotation';
    } else if ((acronym === 'MIXM') || (acronym === 'MIXA')) {
        return 'Combined sources';
    } else if ((acronym === 'MI') || (acronym === 'AI')){
        return 'Imported';
    } else if (acronym === 'AA') {
        var unirule = sources
            ? _.find(sources, function(source) {
            return source.url && (sources.url.indexOf('unirule') !== -1);
        })
            : false;
        var saas = sources
            ? _.find(sources, function(source) {
            return source.url && (sources.url.indexOf('SAAS') !== -1);
        })
            : false;
        return unirule
            ? 'UniRule annotation'
            : saas
            ? 'SAAS annotation'
            : sources ? sources[0].name + ' annotation' : 'Automatic annotation';
    } else {
        return code;
    }
};

var Tooltip = function(fv, d, container) {
    var tooltip = this;
    tooltip.data = d;
    tooltip.sequence = fv.sequence;
    tooltip.tooltipViewer = undefined;

    tooltip.evidences = {
        'ECO:0000269': 'EXP', 'ECO:0000303': 'NAS', 'ECO:0000305': 'IC', 'ECO:0000250': 'ISS', 'ECO:0000255': 'ISM',
        'ECO:0000244': 'MIXM', 'ECO:0000312': 'MI',
        'ECO:0000256': 'AA', 'ECO:0000213': 'MIXA', 'ECO:0000313': 'AI'
    };

    var tooltipContainer = createTooltipBox(container);

    tooltipContainer.style('left', (d3.mouse(container.node())[0] + 10) + 'px')
                .style('top', d3.mouse(container.node())[1] + 'px')
                .transition(200)
                .style('opacity',1)
                .style('display','block');

    d3.select('.up_pftv_tooltip-container table').remove();

    tooltip.table = d3.select('.up_pftv_tooltip-container').append('table');
    tooltip.table
        .on('mousedown', function() {
            fv.overTooltip = true;
        })
        .on('mouseup', function() {
            fv.overTooltip = false;
        });

    var descRow = tooltip.table.append('tr');

    descRow.append('th')
            .attr('colspan',2)
            .text(tooltip.data.type.label + ' ' + tooltip.data.begin + (tooltip.data.end ? '-' + tooltip.data.end : ''));

    if (tooltip.data.sp !== undefined) {
        var dataSource = tooltip.table.append('tr');
        dataSource.append('td').text('Source');
        dataSource.append('td').text(function() {
            var isSift = tooltip.data.siftPrediction && (tooltip.data.siftPrediction !== '-')
                && (tooltip.data.siftPrediction !== 'unknown');
            var isPolyphen = tooltip.data.polyphenPrediction && (tooltip.data.polyphenPrediction !== '-')
                && (tooltip.data.polyphenPrediction !== 'unknown');
            if (tooltip.data.sp && (isSift || isPolyphen)) {
                return 'UniProt and large scale studies';
            } else if (tooltip.data.sp) {
                return 'UniProt';
            } else {
                return 'Large scale studies';
            }
        });
    }

    if (tooltip.data.description) {
        var dataDes = tooltip.table.append('tr');
        dataDes.append('td').text('Description');
        dataDes.append('td').text(tooltip.data.description);
    }

    tooltip.addEvidences = function(evidences) {
        var self = this;
        _.each(evidences, function(e){
            var typeRow = self.table.append('tr')
                            .attr('class','up_pftv_evidence-col');
            typeRow.append('td')
                    .text('Evidence');
            typeRow.append('td')
                .text(getEvidenceText(tooltip, e.code, e.sources));

            var groupedSources = _.groupBy(e.sources, 'name');

            _.each(groupedSources, function(elem, index) {
                var sourceRow = self.table.append('tr')
                                    .attr('class','up_pftv_evidence-source');

                sourceRow.append('td')
                        .text(index);
                var list = sourceRow.append('td');
                _.each(elem, function(el, i) {
                    list.append('span').append('a')
                        .attr('href', el.url)
                        .attr('target', '_blank')
                        .text(el.id);
                    if (i !== (elem.length-1)) {
                        list.append('span').text(', ');
                    }
                });
            });
        });
    };
};

var BasicTooltipViewer = function(tooltip) {
    tooltip.addEvidences(tooltip.data.evidences);
};

var AlternativeTooltipViewer = function(tooltip, change, field) {
    if (tooltip.data[field]) {
        var seqRow = tooltip.table.append('tr');
        seqRow.append('td').text(change);
        seqRow.append('td')
            .text(function() {
                var original = tooltip.sequence.substring(+tooltip.data.begin - 1,
                    +tooltip.data.begin - 1 + tooltip.data[field].length);
                return original + ' > ' + tooltip.data[field];
            });
    }
    tooltip.addEvidences(tooltip.data.evidences);
};

var VariantTooltipViewer = function(tooltip) {
    var mutRow = tooltip.table.append('tr');
    mutRow.append('td').text('Mutation');
    mutRow.append('td').text(tooltip.data.wildType + ' > ' + tooltip.data.mutation);
    if (tooltip.data.frequency && (tooltip.data.frequency !== 0)) {
        var freqRow = tooltip.table.append('tr');
        freqRow.append('td').text('Frequency');
        freqRow.append('td').text(tooltip.data.frequency);
    }
    if (tooltip.data.polyphenPrediction && (tooltip.data.polyphenPrediction !== '-')
        && (tooltip.data.polyphenPrediction !== 'unknown')) {
        var polyRow = tooltip.table.append('tr');
        polyRow.append('td').text('Polyphen');
        polyRow.append('td').text(tooltip.data.polyphenPrediction + ', score ' + tooltip.data.polyphenScore);
    }
    if (tooltip.data.siftPrediction && (tooltip.data.siftPrediction !== '-')
        && (tooltip.data.siftPrediction !== 'unknown')) {
        var siftRow = tooltip.table.append('tr');
        siftRow.append('td').text('SIFT');
        siftRow.append('td').text(tooltip.data.siftPrediction + ', score ' + tooltip.data.siftScore);
    }

    tooltip.addEvidences(tooltip.data.evidences);

    if (tooltip.data.association) {
        var assocRow = tooltip.table.append('tr');
        assocRow.append('th').attr('colspan',2).text('Disease Association');

        _.each(tooltip.data.association, function(association){
            if (association.name) {
                var diseaseRow = tooltip.table.append('tr');
                diseaseRow.append('td').text('Disease');
                diseaseRow.append('td').text(association.name);
            }

            if (association.description) {
                var descRow = tooltip.table.append('tr');
                descRow.append('td').text('Description');
                descRow.append('td').text(association.description);
            }

            if (association.moreInfo) {
                _.each(association.moreInfo, function(item) {
                    var moreInfo = tooltip.table.append('tr');
                    moreInfo.append('td').text('See also');
                    moreInfo.append('td').append('a')
                        .attr('href', item.url)
                        .attr('target', '_blank')
                        .text(item.name + ':' + item.id);
                });
            }
        });
    }
};

Tooltip.basic = function() {
    this.tooltipViewer = new BasicTooltipViewer(this);
};
Tooltip.mutagen = function() {
    this.tooltipViewer = new AlternativeTooltipViewer(this, 'Mutation', 'mutation');
};
Tooltip.conflict = function() {
    this.tooltipViewer = new AlternativeTooltipViewer(this, 'Conflict', 'alternativeSequence');
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
Tooltip.variant = function() {
    this.tooltipViewer = new VariantTooltipViewer(this);
};

var TooltipFactory = function() {
    return {
        createTooltip: function(fv, data, container) {
            var tooltip
                , type = data.type.name.toLowerCase();
            // error if the constructor doesn't exist
            if (typeof Tooltip[type] !== "function") {
                Tooltip.basic.prototype = new Tooltip(fv, data, container);
                tooltip = new Tooltip.basic();
            } else {
                Tooltip[type].prototype = new Tooltip(fv, data, container);
                tooltip = new Tooltip[type]();
            }

            return tooltip;
        }
    };
}();

module.exports = TooltipFactory;