/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var $ = require('jquery');
var Evidence = require('./Evidence');
var Constants = require("./Constants");
var LegendDialog = require("./VariantLegendDialog");

var populated = false;
var defaultFilterCaseDisease = {
    label: 'Disease (reviewed)',
    on: true,
    properties: {
        'association': function(variant) {
            return _.some(variant.association, function(association) {
                return association.disease === true;
            });
        }
    },
    color: LegendDialog.UPDiseaseColor
};
var defaultFilterCasePrediction = {
    label: ['Predicted deleterious', 'Predicted benign'],
    on: true,
    properties: {
        'alternativeSequence': /[^*]/,
        'sourceType': [Evidence.variantSourceType.lss, null],
        'externalData': function(variant) {
            if (!variant.sourceType) {
                return _.some(variant.externalData, function(data) {
                    return (data.polyphenPrediction && (data.polyphenPrediction !== 'del')) ||
                        (data.siftPrediction && (data.siftPrediction !== 'del'));
                });
            } else {
                return true;
            }
        }
    },
    colorRange: [LegendDialog.deleteriousColor, LegendDialog.benignColor]
};
var defaultFilterCaseNonDisease = {
    label: 'Non-disease (reviewed)',
    on: true,
    properties: {
        'association': function(variant) {
            return _.every(variant.association, function(association) {
                return association.disease !== true;
            }) || (!variant.association);
        },
        'sourceType': [
            Evidence.variantSourceType.uniprot,
            Evidence.variantSourceType.mixed
        ]
    },
    color: LegendDialog.UPNonDiseaseColor
};
var defaultFilterCaseOthers = {
    label: 'Init, stop loss or gain',
    on: true,
    properties: {
        'alternativeSequence': '*'
    },
    color: LegendDialog.othersColor
};
var defaultFilterConsequence = {
    label: 'Filter consequence',
    cases: []
};

var defaultFilterCaseUP = {
    label: 'UniProt reviewed',
    on: true,
    properties: {
        'sourceType': [
            Evidence.variantSourceType.uniprot,
            Evidence.variantSourceType.mixed
        ]
    },
    color: 'grey'
};
var defaultFilterCaseLSS = {
    label: 'Large scale studies',
    on: true,
    properties: {
        'sourceType': [
            Evidence.variantSourceType.lss,
            Evidence.variantSourceType.mixed
        ]
    },
    color: 'grey'
};
var defaultFilterSource = {
    label: 'Filter data source',
    cases: []
};

var filters = [];

var populateFilters = function(fv) {
    if (!populated) {
        if (fv.defaultSource === true) {
            defaultFilterConsequence.cases.push(defaultFilterCaseDisease);
            defaultFilterConsequence.cases.push(defaultFilterCasePrediction);
            defaultFilterConsequence.cases.push(defaultFilterCaseNonDisease);
            defaultFilterConsequence.cases.push(defaultFilterCaseOthers);
            filters.push(defaultFilterConsequence);
            defaultFilterSource.cases.push(defaultFilterCaseUP);
            defaultFilterSource.cases.push(defaultFilterCaseLSS);
            filters.push(defaultFilterSource);
        } else {
            defaultFilterConsequence.cases.push(defaultFilterCasePrediction);
            filters.push(defaultFilterConsequence);
            filters.push(defaultFilterSource);
        }
        populated = true;
    }
};

var addSourceFilters = function() {
    _.each(Constants.getDataSources(), function(dataSource) {
        if (dataSource.source !== Constants.getUniProtSource()) {
            var exist = _.find(filters[1].cases, function(aCase) {
                return aCase.label === dataSource.source;
            });
            if (!exist) {
                filters[1].cases.push({
                    label: dataSource.source,
                    on: true,
                    properties: {
                        'externalData': function(variant, label) {
                            var hasCustom = variant.externalData && (_.keys(variant.externalData).length !== 0);
                            return label ? hasCustom && variant.externalData[label] : hasCustom;
                        }
                    },
                    color: 'grey',
                    border: '2px solid black'
                });
            }
        }
    });
};

var addConsequenceTypes = function() {
    _.each(Constants.getConsequenceTypes(), function(consequence, index) {
        var exist = _.find(filters[0].cases, function(aCase) {
            return aCase.label === consequence;
        });
        if (!exist) {
            filters[0].cases.push({
                label: consequence,
                on: true,
                properties: {
                    'consequence': function(variant) {
                        var keys = _.keys(variant.externalData);
                        return (keys.length > 0) ? variant.externalData[keys[0]].consequence === consequence : false;
                    }
                },
                color: LegendDialog.consequenceColors[index % LegendDialog.consequenceColors.length]
            });
        }
    });
};

var VariantFilterDialog = function(fv, container, variantViewer) {
    populateFilters(fv);
    addConsequenceTypes();
    addSourceFilters();

    var variantFilterDialog = this;
    variantFilterDialog.variantViewer = variantViewer;
    variantFilterDialog.filters = $.extend(true, [], filters);
    var buttons = container.append('div')
        .attr('class', 'up_pftv_buttons');

    buttons.append('span')
        .style('visibility', 'hidden')
        .classed('up_pftv_inner-icon-container', true)
        .append('a')
        .attr('class', 'up_pftv_icon-button up_pftv_icon-reset')
        .attr('title', 'Reset all filters')
        .attr('href', '#')
        .on('click', function() {
            variantFilterDialog.reset();
            variantFilterDialog.variantViewer.updateData(variantFilterDialog.variantViewer.features);
        });

    _.each(variantFilterDialog.filters, function(filterSet, index) {
        var filterTitle = container.append('h4').text(filterSet.label);
        if (index === 0) {
            filterTitle.classed('up_pftv_keepWithPrevious', true);
        }
        var ul = container.append('ul')
            .attr('class', 'up_pftv_dialog-container');

        var li = ul
            .selectAll('li')
            .data(filterSet.cases)
            .enter()
            .append('li');

        var anchor = li.append('a')
            .on('click', function(filter) {
                if (filter.on === true) {
                    clearOthers(filterSet, filter);
                    container.select('.up_pftv_inner-icon-container')
                        .style('visibility', 'visible');
                } else {
                    filter.on = true;
                    updateResetButton(variantFilterDialog.filters, container);
                }
                update();
                var filteredData = filterData(variantFilterDialog.filters, variantFilterDialog.variantViewer.features);
                variantFilterDialog.variantViewer.updateData(filteredData);
            });

        anchor.append('div')
            .attr('class', function(filter) {
                if (filter.label instanceof Array) {
                    return 'up_pftv_legend up_pftv_legend_double';
                } else {
                    return 'up_pftv_legend';
                }
            })
            .attr('style', function(filter) {
                return getBackgroundAndBorder(filter);
            });

        anchor.append('span')
            .attr('class', 'up_pftv_legend_text')
            .html(function(filter) {
                if (filter.label instanceof Array) {
                    return filter.label.join('<br/>');
                } else {
                    return filter.label;
                }
            });

        var update = function() {
            anchor.select('div').attr('style', function(filter) {
                return getBackgroundAndBorder(filter);
            });
        };
    });

    variantFilterDialog.reset = function() {
        _.each(variantFilterDialog.filters, function(filterset) {
            _.each(filterset.cases, function(filterCase) {
                filterCase.on = true;
            });
        });
        container.select('.up_pftv_inner-icon-container')
            .style('visibility', 'hidden');
        container.selectAll('.up_pftv_legend')
            .attr('style', function(filter) {
                return getBackgroundAndBorder(filter);
            });
    };

    return variantFilterDialog;
};

var updateResetButton = function(filters, container) {
    var allOn = _.every(filters, function(filterset) {
        return _.every(filterset.cases, function(filterCase) {
            return filterCase.on === true;
        });
    });
    if (allOn === true) {
        container.select('.up_pftv_inner-icon-container')
            .style('visibility', 'hidden');
    }
};

var getBackgroundAndBorder = function(filter) {
    if (filter.colorRange) {
        return 'background:' + (filter.on ? 'linear-gradient(' + filter.colorRange + ');' : '#ffffff');
    } else {
        var background = 'background-color:' + (filter.on ? filter.color : '#ffffff');
        var border = filter.border ? 'border: ' + filter.border : '';
        return background + ';' + border;
    }
};

var clearOthers = function(filterSet, filterCase) {
    _.each(filterSet.cases, function(e) {
        e.on = filterCase.label === e.label ? true : false;
    });
};

var filterData = function(filters, data) {
    var newData = [];
    _.each(data, function(feature) {
        var filtered = _.filter(feature.variants, function(variant) {
            var returnValue = _.every(filters, function(filterSet) {
                var activeFilters = _.filter(filterSet.cases, 'on');
                if (activeFilters.length === filterSet.cases.length) {
                    return true;
                }
                var anyOfSet = _.some(activeFilters, function(filter) {
                    var allOfProps = _.every(_.keys(filter.properties), function(prop) {
                        if (filter.properties[prop] instanceof Array) {
                            return _.some(filter.properties[prop], function(orProp) {
                                return variant[prop] == orProp;
                            });
                        } else if (typeof filter.properties[prop] === 'string') {
                            return filter.properties[prop] === variant[prop];
                        } else if (filter.properties[prop] instanceof RegExp) {
                            return filter.properties[prop].test(variant[prop]);
                        } else if (filter.properties[prop] instanceof Function) {
                            return filter.properties[prop](variant, filter.label);
                        } else {
                            return variant[prop] === filter.properties[prop];
                        }
                    });
                    return allOfProps;
                });
                return anyOfSet;
            });
            return returnValue;
        });
        var featureCopy = $.extend(true, {}, feature);
        featureCopy.variants = filtered;
        newData.push(featureCopy);
    });
    return newData;
};

module.exports = VariantFilterDialog;