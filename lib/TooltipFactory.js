/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var Evidence = require('./Evidence');

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
    var acronym = Evidence.acronym[code];
    var publications = _.where(sources, {name: 'PubMed'}).length;
    publications += _.where(sources, {name: 'Citation'}).length;
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

var addPinPad = function(fv, tooltip, descRow, tooltipTitle) {
    if (fv.pinPad) {
        var th = descRow.append('th')
            .attr('colspan',2);
        var pinClass = 'up_pftv_iconContainer-unpinned';
        var pinTitle = 'Pin tooltip';
        if (tooltip.data.pinned === true) {
            pinClass = 'up_pftv_iconContainer-pinned';
            pinTitle = 'Unpin tooltip';
        }
        var pinContainer = th.append('div').classed('up_pftv_tooltip-pin-container', true)
            .append('div').attr('class', 'up_pp_iconContainer ' + pinClass);
        pinContainer.attr('title', pinTitle);

        pinContainer.append('div').attr('class', 'up-pp-icon-pin up_pp_icon up_pp_clickable-icon')
            .on('click', function() {
                if (tooltip.data.pinned === true) {
                    tooltip.data.pinned = false;
                    pinContainer.classed('up_pftv_iconContainer-unpinned', true);
                    pinContainer.classed('up_pftv_iconContainer-pinned', false);
                    pinContainer.attr('title', 'Pin tooltip');
                    fv.pinPad.removeElement(tooltip.pinData.id);
                } else {
                    tooltip.data.pinned = true;
                    fv.pinPad.addElement(tooltip.pinData);
                    pinContainer.classed('up_pftv_iconContainer-unpinned', false);
                    pinContainer.classed('up_pftv_iconContainer-pinned', true);
                    pinContainer.attr('title', 'Unpin tooltip');
                }
            });
        th.append('div').style('display', 'inline-block').text(tooltipTitle);
    } else {
        descRow.append('th').attr('colspan',2).text(tooltipTitle);
    }
};

var Tooltip = function(fv, catTitle, d, container) {
    var tooltip = this;
    tooltip.data = d;
    tooltip.pinData = {
        category: catTitle, id: d.internalId,
        ordering: {
            type: tooltip.data.type.name,
            start: +tooltip.data.begin,
            end: tooltip.data.end ? +tooltip.data.end : +tooltip.data.begin
        },
        sections: []
    };
    tooltip.sequence = fv.sequence;
    tooltip.tooltipViewer = undefined;
    tooltip.tooltipViewer = undefined;

    var tooltipContainer = createTooltipBox(container);

    tooltipContainer.style('left', (d3.mouse(container.node())[0] + 10) + 'px')
                .style('top', d3.mouse(container.node())[1] + 'px')
                .transition(200)
                .style('opacity',1)
                .style('display','block');

    d3.select('.up_pftv_tooltip-container table').remove();

    tooltip.table = d3.select('.up_pftv_tooltip-container').append('table');
    tooltip.table
        .on('mousedown', function() { fv.overTooltip = true; })
        .on('mouseup', function() {  fv.overTooltip = false; });

    var descRow = tooltip.table.append('tr');

    var tooltipTitle = tooltip.data.type.label + ' ' + tooltip.data.begin +
        (tooltip.data.end ? '-' + tooltip.data.end : '');

    tooltip.pinData.sections.push({title: tooltipTitle, information: {}});

    addPinPad(fv, tooltip, descRow, tooltipTitle);

    if (tooltip.data.sp !== undefined) {
        var dataSource = tooltip.table.append('tr');
        dataSource.append('td').text('Source');
        dataSource.append('td').text(function() {
            if (tooltip.data.sp && Evidence.isLSS(tooltip.data.evidences)) {
                tooltip.pinData.sections[0].information.source = 'UniProt and large scale studies';
                return 'UniProt and large scale studies';
            } else if (tooltip.data.sp) {
                tooltip.pinData.sections[0].information.source = 'UniProt';
                return 'UniProt';
            } else {
                tooltip.pinData.sections[0].information.source = 'Large scale studies';
                return 'Large scale studies';
            }
        });
    }

    if (tooltip.data.description) {
        var dataDes = tooltip.table.append('tr');
        dataDes.append('td').text('Description');
        dataDes.append('td').text(tooltip.data.description);
        tooltip.pinData.sections[0].information.description = tooltip.data.description;
    }
};

Tooltip.prototype.addEvidences = function(evidences, section) {
    var tooltip = this;
    _.each(evidences, function(e, counter) {
        var typeRow = tooltip.table.append('tr')
            .attr('class','up_pftv_evidence-col');
        typeRow.append('td')
            .text('Evidence');
        var evidenceText = getEvidenceText(tooltip, e.code, e.sources);
        typeRow.append('td')
            .text(evidenceText);
        section.information.evidence = evidenceText;

        var groupedSources = _.groupBy(e.sources, 'name');

        _.each(groupedSources, function(elem, index) {
            var sourceRow = tooltip.table.append('tr')
                .attr('class','up_pftv_evidence-source');

            sourceRow.append('td')
                .text('');

            section.information['styled_evidenceArray_' + index + '_' + counter] = {
                key: index,
                key_right: true,
                value: []
            };
            var list = sourceRow.append('td').text(index + ' ');
            _.each(elem, function(el, i) {
                list.append('span').append('a')
                    .attr('href', el.url)
                    .attr('target', '_blank')
                    .text(el.id);
                if (i !== (elem.length-1)) {
                    list.append('span').text(', ');
                }
                section.information['styled_evidenceArray_' + index + '_' + counter].value.push({
                    value: el.id,
                    link: el.url
                });
            });
        });
    });
};

var BasicTooltipViewer = function(tooltip) {
    tooltip.addEvidences(tooltip.data.evidences, tooltip.pinData.sections[0]);
};

var AlternativeTooltipViewer = function(tooltip, change, field) {
    if (tooltip.data[field]) {
        var seqRow = tooltip.table.append('tr');
        seqRow.append('td').text(change);
        seqRow.append('td')
            .text(function() {
                var end = tooltip.data.end ? tooltip.data.end : tooltip.data.begin;
                var original = tooltip.sequence.substring(+tooltip.data.begin - 1, +end);
                var text = original + ' > ' + tooltip.data[field];
                tooltip.pinData.sections[0].information[change] = text;
                return text;
            });
    }
    tooltip.addEvidences(tooltip.data.evidences, tooltip.pinData.sections[0]);
};

var addPredictions = function(tooltip, section) {
    if (tooltip.data.frequency && (tooltip.data.frequency !== 0)) {
        var freqRow = tooltip.table.append('tr');
        freqRow.append('td').text('Frequency');
        freqRow.append('td').text(tooltip.data.frequency);
        section.information.frequency = tooltip.data.frequency;
    }
    if (tooltip.data.polyphenPrediction && (tooltip.data.polyphenPrediction !== '-')
        && (tooltip.data.polyphenPrediction !== 'unknown')) {
        var polyRow = tooltip.table.append('tr');
        polyRow.append('td').append('span').append('a')
            .attr('href', 'http://genetics.bwh.harvard.edu/pph2/dokuwiki/about')
            .attr('target', '_blank').text('Polyphen');
        var text = tooltip.data.polyphenPrediction + ', score ' + tooltip.data.polyphenScore;
        polyRow.append('td').text(text);
        section.information.polyphen = text;
    }
    if (tooltip.data.siftPrediction && (tooltip.data.siftPrediction !== '-')
        && (tooltip.data.siftPrediction !== 'unknown')) {
        var siftRow = tooltip.table.append('tr');
        siftRow.append('td').append('span').append('a')
            .attr('href', 'http://sift.jcvi.org/')
            .attr('target', '_blank').text('SIFT');
        var text = tooltip.data.siftPrediction + ', score ' + tooltip.data.siftScore;
        siftRow.append('td').text(text);
        section.information.sift = text;
    }
};

var addAssociation = function(tooltip, section) {
    if (tooltip.data.association) {
        var assocRow = tooltip.table.append('tr');
        assocRow.append('td').attr('colspan', 2).classed('up_pftv_subsection',true).text('Disease Association');
        section.information.subsection_disease = {
            title: 'Disease Association',
            information: {}
        };
        _.each(tooltip.data.association, function(association, counter){
            if (association.name) {
                var diseaseRow = tooltip.table.append('tr');
                diseaseRow.append('td').text('Disease');
                diseaseRow.append('td').append('span').append('a')
                    .attr('href', 'http://www.uniprot.org/diseases/?query=' + association.name)
                    .attr('target', '_blank').text(association.name);
                section.information.subsection_disease.information.disease = {
                    value: association.name,
                    link: 'http://www.uniprot.org/diseases/?query=' + association.name
                };
            }
            if (association.description) {
                var descRow = tooltip.table.append('tr');
                descRow.append('td').text('Description');
                descRow.append('td').text(association.description);
                section.information.subsection_disease.information.description = association.description;
            }
            if (association.moreInfo) {
                var groupedSources = _.groupBy(association.moreInfo, 'name');
                _.each(groupedSources, function(elem, index) {
                    var moreInfo = tooltip.table.append('tr');
                    moreInfo.append('td');
                    var list = moreInfo.append('td').text(index + ' ');

                    section.information.subsection_disease.information
                        ['styled_associationArray_' + index + '_' + counter] = {
                        key: index,
                        key_right: true,
                        value: []
                    };

                    _.each(elem, function(el, i) {
                        list.append('span').append('a').attr('href', el.url)
                            .attr('target', '_blank').text(el.id);
                        section.information.subsection_disease.information
                            ['styled_associationArray_' + index + '_' + counter].value.push({
                                value: el.id,
                                link: el.url
                            });
                    });
                });
            }
        });
    }
};

var addMutation = function(tooltip, section) {
    var mutRow = tooltip.table.append('tr');
    mutRow.append('td').text('Mutation');
    var text = tooltip.data.wildType + ' > ' + tooltip.data.mutation;
    mutRow.append('td').text(text);
    section.information.mutation = text;
};

var VariantTooltipViewer = function(tooltip) {
    if (tooltip.data.sp && Evidence.isLSS(tooltip.data.evidences)) {
        var upEvidences = [], lssEvidences = [];
        _.each(tooltip.data.evidences, function(e) {
            _.contains(Evidence.manual, e.code) ? upEvidences.push(e) : lssEvidences.push(e);
        });

        addMutation(tooltip, tooltip.pinData.sections[0]);

        var upRow = tooltip.table.append('tr').classed('up_pftv_section', true);
        upRow.append('td').attr('colspan',2).text('UniProt');
        var length = tooltip.pinData.sections.push({title: 'UniProt', information: {}});
        tooltip.addEvidences(upEvidences, tooltip.pinData.sections[length-1]);
        addAssociation(tooltip, tooltip.pinData.sections[length-1]);

        var lssRow = tooltip.table.append('tr').classed('up_pftv_section', true);
        lssRow.append('td').attr('colspan',2).text('Large Scale Studies');
        length = tooltip.pinData.sections.push({title: 'Large Scale Studies', information: {}});
        addPredictions(tooltip, tooltip.pinData.sections[length-1]);
        tooltip.addEvidences(lssEvidences, tooltip.pinData.sections[length-1]);
    } else {
        addMutation(tooltip, tooltip.pinData.sections[0]);
        addPredictions(tooltip, tooltip.pinData.sections[0]);
        tooltip.addEvidences(tooltip.data.evidences, tooltip.pinData.sections[0]);
        addAssociation(tooltip, tooltip.pinData.sections[0]);
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
        createTooltip: function(fv, catTitle, data, container) {
            var tooltip
                , type = data.type.name.toLowerCase();
            // error if the constructor doesn't exist
            if (typeof Tooltip[type] !== "function") {
                Tooltip.basic.prototype = new Tooltip(fv, catTitle, data, container);
                tooltip = new Tooltip.basic();
            } else {
                Tooltip[type].prototype = new Tooltip(fv, catTitle, data, container);
                tooltip = new Tooltip[type]();
            }
            return tooltip;
        }
    };
}();

module.exports = TooltipFactory;