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
        publications += _.filter(sources, function(s) {
            if (s.id && (s.id.indexOf('ref.') === 0)) {
                s.name = 'Citation';
                s.url = 'http://www.uniprot.org/uniprot/' + tooltip.accession + '#ref' + s.id.slice(4);
                return true;
            } else {
                return false;
            }
        }).length;
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
                return source.url && (source.url.indexOf('unirule') !== -1);
            })
            : false;
        var saas = sources
            ? _.find(sources, function(source) {
                return source.url && (source.url.indexOf('SAAS') !== -1);
            })
            : false;
        var interpro = sources
            ? _.find(sources, function(source) {
                return source.name === 'Pfam';
            })
            : false;
        evidenceText =  unirule ? 'UniRule annotation'
            : saas ? 'SAAS annotation'
            : interpro ? 'InterPro annotation'
            : sources ? sources[0].name + ' annotation' : 'Automatic annotation';
    } else {
        evidenceText = code;
    }
    return evidenceText +
        (Evidence.text[code] ? ' (' + Evidence.text[code] + ')' : '');
};

var parseVariantDescription = function(data) {
    if (data.description) {
        var descriptionArray = data.description.split(/\[LSS_|\[SWP]: /g);
        descriptionArray = _.groupBy(descriptionArray, function(desc) {
            return desc.length === 0 ? 'NOTHING'
                : desc.indexOf(']: ') !== -1 ? 'LSS' : 'UP';
        });
        data.up_description = descriptionArray.UP ? descriptionArray.UP.join('; ') : undefined;
        data.lss_description = descriptionArray.LSS
            ? descriptionArray.LSS.join('; ').replace(/]: /g, ': ') : undefined;
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

var addFtId = function(tooltip) {
    if (tooltip.data.ftId) {
        var dataId = tooltip.table.append('tr');
        dataId.append('td').text('Feature ID');
        dataId.append('td').text(tooltip.data.ftId);
    }
};

var addDescription = function(tooltip, description){
    if (description) {
        var dataDes = tooltip.table.append('tr');
        dataDes.append('td').text('Description');
        dataDes.append('td').text(description);
    }
};

var Tooltip = function(fv, catTitle, d, container, coordinates) {
    var tooltip = this;
    tooltip.data = d;
    tooltip.sequence = fv.sequence;
    tooltip.accession = fv.accession;
    tooltip.tooltipViewer = undefined;

    var tooltipContainer = createTooltipBox(container);

    if (coordinates) {
        tooltipContainer.style('left', (coordinates.x + 10) + 'px')
            .style('top', coordinates.y + 'px')
            .transition(200)
            .style('opacity',1)
            .style('display','block');
    } else {
        tooltipContainer.style('left', (d3.mouse(container.node())[0] + 10) + 'px')
            .style('top', d3.mouse(container.node())[1] + 'px')
            .transition(200)
            .style('opacity',1)
            .style('display','block');
    }

    d3.select('.up_pftv_tooltip-container table').remove();

    tooltip.table = d3.select('.up_pftv_tooltip-container').append('table');
    tooltip.table
        .on('mousedown', function() { fv.overTooltip = true; })
        .on('mouseup', function() {  fv.overTooltip = false; });

    var descRow = tooltip.table.append('tr');

    var tooltipTitle = tooltip.data.type + ' ' + tooltip.data.begin +
        (tooltip.data.end ? '-' + tooltip.data.end : '');
    descRow.append('th').attr('colspan',2).text(tooltipTitle);

    if (tooltip.data.sourceType !== undefined) {
        var dataSource = tooltip.table.append('tr');
        dataSource.append('td').text('Source');
        var sourceText = '';
        if (tooltip.data.sourceType === Evidence.variantSourceType.mixed) {
            sourceText = 'UniProt and large scale studies';
        } else if (tooltip.data.sourceType === Evidence.variantSourceType.uniprot) {
            sourceText = 'UniProt';
        } else {
            sourceText = 'Large scale studies';
        }
        dataSource.append('td').text(sourceText);
        parseVariantDescription(tooltip.data);
        if (sourceText === 'UniProt') {
            addFtId(tooltip);
            addDescription(tooltip, tooltip.data.up_description, 'up_description');
        } else if (sourceText === 'Large scale studies'){
            addDescription(tooltip, tooltip.data.lss_description, 'lss_description');
        }
    } else {
        addFtId(tooltip);
        addDescription(tooltip, tooltip.data.description, 'description');
    }
};

var addEvidenceXRefLinks = function(tooltip, sourceRow, info) {
    if (!sourceRow) {
        sourceRow = tooltip.table.append('tr')
            .attr('class','up_pftv_evidence-source');

        sourceRow.append('td')
            .text('');
    }

    var list = sourceRow.append('td').text(info.index + ' ');
    _.each(info.elem, function(el, i) {
        var url = info.alternative === true ? el.alternativeUrl: el.url;
        list.append('span').append('a')
            .attr('href', url)
            .attr('target', '_blank')
            .text(function() {
                if (info.textAttr) {
                    return el[info.textAttr];
                } else {
                    return el.id;
                }
            });
        if (i !== (info.elem.length-1)) {
            list.append('span').text(' | ');
        }
    });
};

Tooltip.prototype.addEvidences = function(evidences) {
    var tooltip = this;
    _.each(evidences, function(sources, eco) {
        var typeRow = tooltip.table.append('tr')
            .attr('class','up_pftv_evidence-col');
        typeRow.append('td')
            .text('Evidence');
        var evidenceText = getEvidenceText(tooltip, eco, sources);
        typeRow.append('td')
            .text(evidenceText);

        var groupedSources = _.groupBy(sources, 'name');
        delete groupedSources['undefined'];

        _.each(groupedSources, function(elem, index) {
            addEvidenceXRefLinks(tooltip, undefined, {elem: elem, index: index});
            if (index === 'PubMed') {
                addEvidenceXRefLinks(tooltip, undefined, {elem: elem, index: 'EuropePMC', alternative: true});
            }
        });
    });
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
                var end = tooltip.data.end ? tooltip.data.end : tooltip.data.begin;
                var original = tooltip.sequence.substring(+tooltip.data.begin - 1, +end);
                var text = original + ' > ' + tooltip.data[field];
                return text;
            });
    }
    tooltip.addEvidences(tooltip.data.evidences);
};

var addPredictions = function(tooltip) {
    if (tooltip.data.frequency && (tooltip.data.frequency !== 0)) {
        var freqRow = tooltip.table.append('tr');
        freqRow.append('td').append('span').append('a')
            .attr('href', 'http://www.ncbi.nlm.nih.gov/projects/SNP/docs/rs_attributes.html#gmaf')
            .attr('target', '_blank').text('Frequency (MAF)');
        freqRow.append('td').text(tooltip.data.frequency);
    }
    if (tooltip.data.polyphenPrediction && (tooltip.data.polyphenPrediction !== '-')
        && (tooltip.data.polyphenPrediction !== 'unknown')) {
        var polyRow = tooltip.table.append('tr');
        polyRow.append('td').append('span').append('a')
            .attr('href', 'http://genetics.bwh.harvard.edu/pph2/dokuwiki/about')
            .attr('target', '_blank').text('Polyphen');
        var text = tooltip.data.polyphenPrediction + ', score ' + tooltip.data.polyphenScore;
        polyRow.append('td').text(text);
    }
    if (tooltip.data.siftPrediction && (tooltip.data.siftPrediction !== '-')
        && (tooltip.data.siftPrediction !== 'unknown')) {
        var siftRow = tooltip.table.append('tr');
        siftRow.append('td').append('span').append('a')
            .attr('href', 'http://sift.jcvi.org/')
            .attr('target', '_blank').text('SIFT');
        var predictionText = tooltip.data.siftPrediction + ', score ' + tooltip.data.siftScore;
        siftRow.append('td').text(predictionText);
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

var addAssociation = function(tooltip) {
    if (Evidence.existAssociation(tooltip.data.association)) {
        var assocRow = tooltip.table.append('tr');
        assocRow.append('td').attr('colspan', 2).classed('up_pftv_subsection',true).text('Disease Association');
        _.each(tooltip.data.association, function(association){
            if (association.name) {
                var diseaseRow = tooltip.table.append('tr');
                diseaseRow.append('td').text('Disease');
                diseaseRow.append('td').append('span').append('a')
                    .attr('href', 'http://www.uniprot.org/diseases/?query=' + association.name)
                    .attr('target', '_blank').text(association.name);
            }
            if (association.description) {
                var descRow = tooltip.table.append('tr');
                descRow.append('td').text('Description');
                descRow.append('td').text(association.description);
            }
            if (association.xrefs) {
                var groupedSources = _.groupBy(association.xrefs, 'name');
                _.each(groupedSources, function(elem, index) {
                    var xrefs = tooltip.table.append('tr');
                    xrefs.append('td');
                    var list = xrefs.append('td').text(index + ' ');

                    _.each(elem, function(el, index) {
                        list.append('span').append('a').attr('href', el.url)
                            .attr('target', '_blank').text(el.id);
                        if ((index + 1) !== elem.length) {
                            list.append('span').text(' | ');
                        }
                    });
                });
            }
        });
    }
};

var addMutation = function(tooltip) {
    var mutRow = tooltip.table.append('tr');
    mutRow.append('td').text('Variant');
    var text = (tooltip.data.wildType === '-' ? tooltip.sequence.charAt(+tooltip.data.begin): tooltip.data.wildType)
        + ' > ' +
        (tooltip.data.alternativeSequence === '-' ? 'del' : tooltip.data.alternativeSequence);
    mutRow.append('td').text(text);
};

var addXRefs = function(tooltip, xrefs) {
    if (xrefs) {
        var sourceRow = tooltip.table.append('tr')
            .attr('class', 'up_pftv_evidence-source');

        sourceRow.append('td')
            .text('Cross-references');

        var groupedSources = _.groupBy(xrefs, 'id');
        delete groupedSources['undefined'];
        console.log(groupedSources);

        var first = true;
        _.each(groupedSources, function (elem, key) {
            if (first) {
                addEvidenceXRefLinks(tooltip, sourceRow, {elem: elem, index: key, textAttr: 'name'});
                first = false;
            } else {
                addEvidenceXRefLinks(tooltip, undefined, {elem: elem, index: key, textAttr: 'name'});
            }
        });
    }
};
var addUPSection = function(tooltip, upEvidences, upXrefs) {
    if (tooltip.data.ftId || tooltip.data.up_description || (upEvidences.length !== 0) || tooltip.data.association) {
        var upRow = tooltip.table.append('tr').classed('up_pftv_section', true);
        upRow.append('td').attr('colspan',2).text('UniProt');
        addFtId(tooltip);
        addDescription(tooltip, tooltip.data.up_description, 'up_description');
        tooltip.addEvidences(upEvidences);
        addXRefs(tooltip, upXrefs);
        addAssociation(tooltip);
    }
};

var addLSSSection = function(tooltip, lssEvidences, lssXrefs) {
    if (tooltip.data.lss_description || (lssEvidences.length !== 0) || havePredictions(tooltip.data)) {
        var lssRow = tooltip.table.append('tr').classed('up_pftv_section', true);
        lssRow.append('td').attr('colspan',2).text('Large Scale Studies');
        addDescription(tooltip, tooltip.data.lss_description, 'lss_description');
        addPredictions(tooltip);
        tooltip.addEvidences(lssEvidences);
        addXRefs(tooltip, lssXrefs);
    }
};

var VariantTooltipViewer = function(tooltip) {
    if (tooltip.data.sourceType === Evidence.variantSourceType.mixed) {
        var upEvidences = {}, lssEvidences = {};
        _.each(tooltip.data.evidences, function(sources, eco) {
            if (_.contains(Evidence.manual, eco)) {
                upEvidences[eco] = tooltip.data.evidences[eco];
            } else {
                lssEvidences[eco] = tooltip.data.evidences[eco];
            }
        });
        var upXrefs = [], lssXrefs = [];
        _.each(tooltip.data.xrefs, function(xref) {
            if (xref.reviewed === true) {
                upXrefs.push(xref);
            } else {
                lssXrefs.push(xref);
            }
        });
        addMutation(tooltip);
        addUPSection(tooltip, upEvidences, upXrefs);
        addLSSSection(tooltip, lssEvidences, lssXrefs);
    } else {
        addMutation(tooltip);
        addPredictions(tooltip);
        tooltip.addEvidences(tooltip.data.evidences);
        addXRefs(tooltip.data.xrefs);
        addAssociation(tooltip);
    }
};

Tooltip.basic = function() {
    this.tooltipViewer = new BasicTooltipViewer(this);
};
Tooltip.mutagen = function() {
    this.tooltipViewer = new AlternativeTooltipViewer(this, 'Mutation', 'alternativeSequence');
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
        createTooltip: function(fv, catTitle, data, container, coordinates) {
            var tooltip
                , type = data.type.toLowerCase();
            // error if the constructor doesn't exist
            if (typeof Tooltip[type] !== "function") {
                Tooltip.basic.prototype = new Tooltip(fv, catTitle, data, container, coordinates);
                tooltip = new Tooltip.basic();
            } else {
                Tooltip[type].prototype = new Tooltip(fv, catTitle, data, container, coordinates);
                tooltip = new Tooltip[type]();
            }
            return tooltip;
        }
    };
}();

module.exports = TooltipFactory;
