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
    var evidenceText = '';
    if ((acronym === 'EXP') || (acronym === 'NAS')) {
        evidenceText = publications + (publications > 1 ? ' Publications' : ' Publication');
    } else if (acronym === 'IC') {
        evidenceText = publications === 0
            ? 'Curated'
            : publications + (publications > 1 ? ' Publications' : ' Publication');
    } else if (acronym === 'ISS') {
        evidenceText = 'By similarity';
    } else if (acronym === 'ISM') {
        evidenceText = !sources || sources.length === 0 ? 'Sequence Analysis': sources[0].name + ' annotation';
    } else if ((acronym === 'MIXM') || (acronym === 'MIXA')) {
        evidenceText = 'Combined sources';
    } else if ((acronym === 'MI') || (acronym === 'AI')){
        evidenceText = 'Imported';
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
        evidenceText =  unirule ? 'UniRule annotation'
            : saas ? 'SAAS annotation'
            : sources ? sources[0].name + ' annotation' : 'Automatic annotation';
    } else {
        evidenceText = code;
    }
    return evidenceText +
        (Evidence.text[code] ? ' (' + Evidence.text[code] + ')' : '');
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

var parseVariantDescription = function(data) {
    if (data.description) {
        var index = data.description.indexOf('Ftid: ');
        if (index !== -1) {
            data.ftId = data.description.substr(index+6, 10);
            data.description = (data.description.slice(0, index) + data.description.slice(index+16)).trim();
        }
        index = data.description.indexOf('LSS: ');
        if (index !== -1) {
            data.lss_description = data.description.slice(index+5).trim();
            data.up_description = data.description.slice(0, index).trim();
        } else {
            data.up_description = data.description;
        }
        data.description = undefined;
    }
    if (Evidence.existAssociation(data.association)) {
        _.each(data.association, function(association) {
            if (association.description) {
                var index = association.description.indexOf('Ftid: ');
                if (index !== -1) {
                    data.ftId = association.description.substr(index+6, 10);
                    association.description = (association.description.slice(0, index)
                    + association.description.slice(index+16)).trim();
                }
            }
        });
    }
};

var addFtId = function(tooltip, pinDataSection) {
    if (tooltip.data.ftId !== undefined) {
        var dataId = tooltip.table.append('tr');
        dataId.append('td').text('Feature ID');
        dataId.append('td').text(tooltip.data.ftId);
        pinDataSection.information.styled_feature_id = {
            key: "Feature ID",
            value: tooltip.data.ftId
        };
    }
};

var addDescription = function(tooltip, description, pinDataSection, descriptionType){
    if (description) {
        var dataDes = tooltip.table.append('tr');
        dataDes.append('td').text('Description');
        dataDes.append('td').text(description);
        pinDataSection.information['styled_' + descriptionType] = {
            key: "Description",
            value: description
        };
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

    if (tooltip.data.sourceType !== undefined) {
        var dataSource = tooltip.table.append('tr');
        dataSource.append('td').text('Source');
        var sourceText = '';
        if (tooltip.data.sourceType === Evidence.variantSourceType.mixed) {
            tooltip.pinData.sections[0].information.source = 'UniProt and large scale studies';
            sourceText = 'UniProt and large scale studies';
        } else if (tooltip.data.sourceType === Evidence.variantSourceType.uniprot) {
            tooltip.pinData.sections[0].information.source = 'UniProt';
            sourceText = 'UniProt';
        } else {
            tooltip.pinData.sections[0].information.source = 'Large scale studies';
            sourceText = 'Large scale studies';
        }
        dataSource.append('td').text(sourceText);
        parseVariantDescription(tooltip.data);
        if (sourceText === 'UniProt') {
            addFtId(tooltip, tooltip.pinData.sections[0]);
            addDescription(tooltip, tooltip.data.up_description, tooltip.pinData.sections[0], 'up_description');
        } else if (sourceText === 'Large scale studies'){
            addDescription(tooltip, tooltip.data.lss_description, tooltip.pinData.sections[0], 'lss_description');
        }
    } else {
        addFtId(tooltip, tooltip.pinData.sections[0]);
        addDescription(tooltip, tooltip.data.description, tooltip.pinData.sections[0], 'description');
    }
};

var addEvidenceXRefLinks = function(tooltip, section, sourceRow, info) {
    if (!sourceRow) {
        sourceRow = tooltip.table.append('tr')
            .attr('class','up_pftv_evidence-source');

        sourceRow.append('td')
            .text('');
    }

    section.information['styled_'+ info.attrText + 'Array_' + info.index + '_' + info.counter] = {
        key: info.index,
        key_right: true,
        value: []
    };
    var list = sourceRow.append('td').text(info.index + ' ');
    _.each(info.elem, function(el, i) {
        var url = info.alternative === true ? el.alternativeUrl: el.url;
        list.append('span').append('a')
            .attr('href', url)
            .attr('target', '_blank')
            .text(el.id);
        if (i !== (info.elem.length-1)) {
            list.append('span').text(', ');
        }
        section.information['styled_'+ info.attrText + 'Array_' + info.index + '_' + info.counter].value.push({
            value: el.id,
            link: url
        });
    });
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
        section.information['styled_evidence_' + counter] = {
            key: 'Evidence',
            value: evidenceText
        };

        var groupedSources = _.groupBy(e.sources, 'name');
        delete groupedSources['undefined'];

        _.each(groupedSources, function(elem, index) {
            addEvidenceXRefLinks(tooltip, section, undefined, {
                counter: counter, elem: elem, index: index, attrText: 'evidence'
            });
            if (index === 'PubMed') {
                addEvidenceXRefLinks(tooltip, section, undefined, {
                    counter:counter, elem: elem, index: 'EuropePMC', attrText: 'evidence', alternative: true
                });
            }
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
        freqRow.append('td').append('span').append('a')
            .attr('href', 'http://www.ncbi.nlm.nih.gov/projects/SNP/docs/rs_attributes.html#gmaf')
            .attr('target', '_blank').text('Frequency (MAF)');
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

var havePredictions = function(data) {
    var response = false;
    if (data.frequency && (data.frequency !== 0)) {
        response = true;
    }
    if (data.polyphenPrediction && (data.polyphenPrediction !== '-')
        && (data.polyphenPrediction !== 'unknown')) {
        response = true;
    }
    if (data.siftPrediction && (data.siftPrediction !== '-')
        && (data.siftPrediction !== 'unknown')) {
        response = true;
    }
    return response;
};

var addAssociation = function(tooltip, section) {
    if (Evidence.existAssociation(tooltip.data.association)) {
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
                section.information.subsection_disease.information['styled_evidenceArray_disease_' + counter] = {
                    key: 'Disease',
                    value: {
                        value: association.name,
                        link: 'http://www.uniprot.org/diseases/?query=' + association.name
                    }
                };
            }
            if (association.description) {
                var descRow = tooltip.table.append('tr');
                descRow.append('td').text('Description');
                descRow.append('td').text(association.description);
                section.information.subsection_disease.information['styled_evidenceArray_description_' + counter] = {
                    key: 'Description',
                    value: association.description
                };
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

                    _.each(elem, function(el) {
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
    mutRow.append('td').text('Variant');
    var text = tooltip.data.wildType + ' > ' + tooltip.data.mutation;
    mutRow.append('td').text(text);
    section.information.mutation = text;
};

var addXRefs = function(tooltip, section) {
    if (tooltip.data.xrefs) {
        var sourceRow = tooltip.table.append('tr')
            .attr('class','up_pftv_evidence-source');

        sourceRow.append('td')
            .text('Cross-references');

        var groupedSources = _.uniq(tooltip.data.xrefs, function(ref) {
            return ref.name + ref.id + ref.url;
        });
        groupedSources = _.groupBy(groupedSources, 'name');
        delete groupedSources['undefined'];

        var first = true;
        _.each(groupedSources, function (elem, key) {
            if (first) {
                addEvidenceXRefLinks(tooltip, section, sourceRow, {
                    counter: 0, elem: elem, index: key, attrText: 'xref'
                });
                first = false;
            } else {
                addEvidenceXRefLinks(tooltip, section, undefined, {
                    counter: 0, elem: elem, index: key, attrText: 'xref'
                });
            }


        });
    }
};

var addUPSection = function(tooltip, upEvidences) {
    if (tooltip.data.ftId || tooltip.data.up_description || (upEvidences.length !== 0) || tooltip.data.association) {
        var upRow = tooltip.table.append('tr').classed('up_pftv_section', true);
        upRow.append('td').attr('colspan',2).text('UniProt');
        var length = tooltip.pinData.sections.push({title: 'UniProt', information: {}});
        addFtId(tooltip, tooltip.pinData.sections[length-1]);
        addDescription(tooltip, tooltip.data.up_description, tooltip.pinData.sections[length-1], 'up_description');
        tooltip.addEvidences(upEvidences, tooltip.pinData.sections[length-1]);
        addAssociation(tooltip, tooltip.pinData.sections[length-1]);
    }
};

var addLSSSection = function(tooltip, lssEvidences) {
    if (tooltip.data.lss_description || (lssEvidences.length !== 0) || havePredictions(tooltip.data)) {
        var lssRow = tooltip.table.append('tr').classed('up_pftv_section', true);
        lssRow.append('td').attr('colspan',2).text('Large Scale Studies');
        var length = tooltip.pinData.sections.push({title: 'Large Scale Studies', information: {}});
        addDescription(tooltip, tooltip.data.lss_description, tooltip.pinData.sections[length-1], 'lss_description');
        addPredictions(tooltip, tooltip.pinData.sections[length-1]);
        tooltip.addEvidences(lssEvidences, tooltip.pinData.sections[length-1]);
    }
};

var VariantTooltipViewer = function(tooltip) {
    if (tooltip.data.sourceType === Evidence.variantSourceType.mixed) {
        var upEvidences = [], lssEvidences = [];
        _.each(tooltip.data.evidences, function(e) {
            _.contains(Evidence.manual, e.code) ? upEvidences.push(e) : lssEvidences.push(e);
        });
        addMutation(tooltip, tooltip.pinData.sections[0]);
        addXRefs(tooltip, tooltip.pinData.sections[0]);
        addUPSection(tooltip, upEvidences);
        addLSSSection(tooltip, lssEvidences);
    } else {
        addMutation(tooltip, tooltip.pinData.sections[0]);
        addPredictions(tooltip, tooltip.pinData.sections[0]);
        tooltip.addEvidences(tooltip.data.evidences, tooltip.pinData.sections[0]);
        addXRefs(tooltip, tooltip.pinData.sections[0]);
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