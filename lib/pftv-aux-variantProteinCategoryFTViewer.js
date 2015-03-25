var _ = require("underscore");
var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils");
/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */
 
/**
 @class pftv-aux-variantProteinCategoryFTViewer
 This class deals with natural variations, which follows a structure different from other feature categories.
 */
var VariantProteinCategoryFTViewer;

module.exports = VariantProteinCategoryFTViewer = function(){};
/**********
 * Private zone
 **********/
/* ----------
 * Private variables.
 * ---------- */
var
    _availableScores = {"SIFT": "siftScore", "Polyphen": "polyphenScore"},
    _availablePredictions = {"SIFT": "siftPrediction", "Polyphen": "polyphenPrediction"},
    _floatingPointPrecision = 3,
    _mutationTypes = ["benign", "damaging", "mixed", "no_prediction"],
    _unknownMutationType = "no_prediction",
    //Range values for each consequence type, the keys name set here are used dynamically
    _scoreRanges = {"benign":[-2,0.4], "mixed":[0.4,0.6], "damaging":[0.6, 2]},
    _shouldInvertScores = ["siftScore"],
    _typeVariantsList = "TypeVariantsList"
;
 /* ----------
 * Private methods.
 * ---------- */
var
    /**
     * Initializes all the overview related stuff.
     * @private
     */
    _init = function(that, categoryViewer) {
        //var startTime = new Date().getTime();
        that._variantDataObject = {};
        that._consequenceTypesList = [];
        that._activeMutationTypes = _mutationTypes.slice(0);
        that._activeMutationTypes.sort();
        //Initially all scores are active
        that._activeScoreKeys = Object.keys(_availableScores);
        _variantParser(that, categoryViewer);
        _adjustHeight(that, categoryViewer);
        _createYScale(that, categoryViewer);
        //var endTime = new Date().getTime();
        //console.log("VAR: " + (endTime-startTime) + "ms");
    },
    /**
     * Populates the class attribute _variantDataObject, a sparse array that contains one element per each position in the sequence with at least one variant.
     * Each element will have the summary corresponding to all the variants in that sequence position.
     * We suppose here that at least one variant exists in the input variants array,
     * we also suppose that the variants array is ordered by amino acid positions.
     * @param that
     * @param categoryViewer
     * @returns {number}
     */
    _variantParser = function(that, categoryViewer){
        that._variantDataObject = {};
        var activePredictors = _.map(that._activeScoreKeys, function(key) {
            return {"predictionAttr": _availablePredictions[key], "scoreAttr": _availableScores[key]};
        });
        if (activePredictors.length !== 0){
            //variants are ordered by position, here we will calculate some totals and other stuff per position as well as some general totals
            var previousPosition = 0;//all protein sequences start in 1
            that._maximumTotalVar = 0;
            that._maximumTotalVarFrequency = 0.0;
            that._maximumVarFrequency = 0.0;
            that._minimumVarFrequency = 0.0;
            _.each(categoryViewer.opt.category.variants, function(variant, variantArrayPosition) {
                var position = variant.position;
                var frequency = +variant.frequency;
                if (frequency < that._minimumVarFrequency) {
                    that._minimumVarFrequency = frequency;
                }
                if (frequency > that._maximumVarFrequency) {
                    that._maximumVarFrequency = frequency;
                }
                if (position !== previousPosition) {//we have a new position, initiate position object with counters in 0
                    if (previousPosition !== 0) { //record the maximums including the previousPosition, if a real one
                        if (that._variantDataObject[previousPosition].total > that._maximumTotalVar) {
                            that._maximumTotalVar = that._variantDataObject[previousPosition].total;
                        }
                        if (that._variantDataObject[previousPosition].totalFrequency > that._maximumTotalVarFrequency) {
                            that._maximumTotalVarFrequency = that._variantDataObject[previousPosition].totalFrequency;
                        }
                    }
                    that._variantDataObject[position] = {
                        "position": position,
                        "total": 0,
                        "totalFrequency": 0.0,
                        "residue": FTVUtils.getResidue(categoryViewer.opt.sequence[position-1])
                    };
                    _.each(_mutationTypes, function(mutationType) {
                        var key = mutationType + _typeVariantsList;
                        that._variantDataObject[position][mutationType] = 0; //damaging, benign, mixed, no prediction set to 0
                        that._variantDataObject[position][key] = []; //list containing the variants positions in the category for that mutation type
                    });
                    previousPosition = position;
                }
                //Increase counters
                that._variantDataObject[position]["total"] += 1;
                that._variantDataObject[position]["totalFrequency"] += frequency;
                //What predictions do we have?
                var averageScore = 0;
                var score = 0;
                var prediction = null;
                //Calculate the average score
                var validPredictors = 0;
                _.each(activePredictors, function(predictor) {
                    if (variant[predictor.predictionAttr] !== "-") {
                        score = +variant[predictor.scoreAttr];
                        if (_shouldInvertScores.indexOf(predictor.scoreAttr) !== -1){
                            score = 1-score;
                        }
                        averageScore += score;
                        validPredictors++;
                    }
                });
                averageScore = validPredictors == 0 ? 0 : averageScore / validPredictors;
                averageScore = +averageScore.toFixed(_floatingPointPrecision); //Use at max three decimal places
                variant.averageScore = averageScore;
                //Calculate the final predicted mutation based on the average score, and update the total number of variants of such mutation type in the current position
                if (validPredictors !== 0) {
                    var key;
                    for (key in _scoreRanges){
                        var range = _scoreRanges[key];
                        if (_isBetween(averageScore, range[0], range[1])){
                            that._variantDataObject[position][key] += 1;
                            prediction = key;
                            break;
                        }
                    }
                    if (prediction === null){//should not happen
                        prediction = _unknownMutationType;
                        that._variantDataObject[position][_unknownMutationType] += 1;
                    }
                    variant.averagePrediction = prediction;
                } else {
                    prediction = _unknownMutationType;
                    that._variantDataObject[position][_unknownMutationType] += 1;
                }
                //Link to the original variant in the category features depending on the mutation type (we have mutation type lists pointing to the actual variants)
                var predictionKey = prediction + _typeVariantsList;
                that._variantDataObject[position][predictionKey].push(variantArrayPosition);
                //Now add to the count how many of each consequence we have so far and add any new to the general array containing all of them
                var consequenceTypes = variant.consequenceTypes.split(",");
                _.each(consequenceTypes, function(consequenceType) {
                    if (that._consequenceTypesList.indexOf(consequenceType) == -1 && consequenceType != "-"){
                        that._consequenceTypesList.push(consequenceType);
                    }
                });
            });
            //updates for the very last position recorded
            if (that._variantDataObject[previousPosition].total > that._maximumTotalVar) {
                that._maximumTotalVar = that._variantDataObject[previousPosition].total;
            }
            if (that._variantDataObject[previousPosition].totalFrequency > that._maximumTotalVarFrequency) {
                that._maximumTotalVarFrequency = that._variantDataObject[previousPosition].totalFrequency;
            }
        }
    },
    /**
     * Adjust the height for SVG and divs based on the maximum variable at the same position and the maximum frequency.
     * @param that
     * @param categoryViewer
     * @private
     */
    _adjustHeight = function(that, categoryViewer) {
        //find possible max heights
        var maxPossibleVarHeight = Math.floor(categoryViewer.opt.ftHeight / that._maximumTotalVar);
        var minNeededHeight = FTVUtils.getMaxShapeSize() * that._maximumTotalVar;
        var maxNeededHeightVarMaxFreq = that._maximumVarFrequency === 0 ?
            minNeededHeight
            : Math.min(that._maximumTotalVar, Math.ceil(1 / that._maximumVarFrequency)) * maxPossibleVarHeight;
        //adjust the divs and svg height
        categoryViewer.opt.ftHeight = Math.max(minNeededHeight, maxNeededHeightVarMaxFreq);
        categoryViewer._sequenceLine = categoryViewer.opt.ftHeight + 4; //we need 2 extra pixels for borders, but 4 actually looks better
        categoryViewer._svgBottomGap = -1.5;
        categoryViewer._calculateAdjustHeight(categoryViewer, categoryViewer._sequenceLine, true);
        categoryViewer._applyHeight(categoryViewer, categoryViewer._height, 2);
    },
    /**
     * Creates the y scale to determine the height of a variant depending on its.
     * @param that
     * @param categoryViewer
     * @private
     */
    _createYScale = function(that, categoryViewer) {
        that._yScale = d3.scale.linear().
            domain([that._minimumVarFrequency, that._maximumVarFrequency]).
            range([FTVUtils.getMaxShapeSize(), Math.floor(categoryViewer.opt.ftHeight / that._maximumTotalVar)]);
    },
    /** Method to return if a number lies between the other two numbers
     * @param {float} number Number
     * @param {float} min Lower Cap
     * @param {float} max Upper Cap
     * @private
     **/
    _isBetween = function(number, min, max){
        return number>=min && number<max;
    },
    /**
     *
     * @param categoryViewer
     * @param feature
     * @private
     */
    _calculatePosition = function (that, categoryViewer, feature, shift) {
        feature.begin = feature.position;
        feature.end = feature.position;
        var scaledStart = categoryViewer._xScale(FTVUtils.getStart(feature));
        var scaledEnd = categoryViewer._xScale(FTVUtils.getEnd(feature));
        feature.x = scaledStart;
        feature.y = categoryViewer._sequenceLine - shift;
        feature.width = Math.floor(scaledEnd - scaledStart + categoryViewer._pixelPerAA);
        feature.height = that._yScale(feature.frequency);
    },
    /**
     * Returns the tooltip text
     * @param positionSummary
     * @param feature
     * @returns {string}
     * @private
     */
    _getFeatureTooltipText = function(positionSummary, feature) {
        var text = "";
        //type
        text = "Type: Natural Variant" + "<br/>";
        // id
        text =
            feature.spId == undefined ?
                (feature.sourceIds == undefined) || (feature.sourceIds.length === 0) ?
                    text
                : text + "ID: " + feature.sourceIds[0] + "<br/>"
            : text + "ID: " + feature.spId + "<br/>";
        // location
        var mutation = "";
        _.each(feature.mutation, function(charAt) {
            mutation += charAt === "*" ? charAt : FTVUtils.getResidue(charAt.toUpperCase());
        });
        text = text + "Residue (" + feature.position + "): " + positionSummary.residue + " --> " + mutation + "<br/>";
        //prediction
        text = text + "Total variants: " + positionSummary.total + "<br/>";
        _.each(_mutationTypes, function(mutation) {
            text = text + mutation + ": " + positionSummary[mutation] + "<br/>";
        });
        //description
        text =
            feature.associations == undefined ?
                feature.description == undefined ?
                    text
                : text + "Description: " + feature.description + "<br/>"
            : text + "Associations: " + feature.associations + "<br/>" + "Description: " + feature.description + "<br/>"
        return text;
    }
;
/**********
 * Public zone
 **********/
/* ----------
 * Public variables.
 * ---------- */
VariantProteinCategoryFTViewer.prototype._scaleFactor = 5;
VariantProteinCategoryFTViewer.prototype._activeMutationTypes = undefined;
VariantProteinCategoryFTViewer.prototype._activeScoreKeys = undefined;
VariantProteinCategoryFTViewer.prototype._activeScoreValues = undefined;
VariantProteinCategoryFTViewer.prototype._variantDataObject = undefined;
VariantProteinCategoryFTViewer.prototype._consequenceTypesList = undefined;
VariantProteinCategoryFTViewer.prototype._maximumTotalVar = 0;
VariantProteinCategoryFTViewer.prototype._maximumTotalVarFrequency = 0.0;
VariantProteinCategoryFTViewer.prototype._maximumVarFrequency = 0.0;
VariantProteinCategoryFTViewer.prototype._minimumVarFrequency = 0.0;

 /* ----------
 * Public methods
 * ---------- */
//*****
/**
 * Some additional painting to that already done by the category painter.
 * @param categoryViewer Viewer that actually takes care of category features display, it contains all the options and variants.
 * */
VariantProteinCategoryFTViewer.paintFeatures = function(categoryViewer) {
    //var startTime = new Date().getTime();
    var self = this;
    if (categoryViewer._stylingOpt._overviewVariantsPainted !== true) {
        _init(self, categoryViewer);
        categoryViewer._stylingOpt._consequenceTypes = self._consequenceTypesList;
        categoryViewer._stylingOpt._variantDataObject = self._variantDataObject;
        categoryViewer._stylingOpt._yScale = self._yScale;
        categoryViewer._stylingOpt._overviewVariantsPainted = true;
    } else {
        self._consequenceTypesList = categoryViewer._stylingOpt._consequenceTypes;
        self._variantDataObject = categoryViewer._stylingOpt._variantDataObject;
        self._yScale = categoryViewer._stylingOpt._yScale;
    }
    //Paint
    categoryViewer._featureSVGGroup.selectAll("g").remove();
    categoryViewer._featureSVGGroup.selectAll("text").remove();
    var typeClass = FTVUtils.stringToClass(categoryViewer.opt.category.type);
    _.each(self._variantDataObject, function(positionObject) {
        var positionClass = FTVUtils.stringToClass("variant_at_" + positionObject.position);
        var shift = 0;
        _.each(self._activeMutationTypes, function(mutationType) {
            var mutationClass = FTVUtils.stringToClass(mutationType);
            var groups = categoryViewer._featureSVGGroup.selectAll("g." + typeClass + " g." + mutationClass + " g." + positionClass)
                .data(function() {
                    //if (positionObject[mutationType + _typeVariantsList + _filteredSuffix] != undefined) {
                    //    return positionObject[mutationType + _typeVariantsList + _filteredSuffix];
                    //} else {
                        return positionObject[mutationType + _typeVariantsList];
                    //}
                }).enter().append("g").classed(typeClass, true)
                    .on("mouseover", function (varArrayPos) {
                        var feature = categoryViewer.opt.category.variants[varArrayPos];
                        categoryViewer._onMouseOverFeature(categoryViewer, this.firstChild, feature);
                    })
                    .on("mousemove", function () {
                        if (categoryViewer.opt.useTooltips == true) {
                            FTVUtils.mousemove(categoryViewer._tooltipdiv);
                        }
                    })
                    .on("mouseout", function (varArrayPos) {
                        var feature = categoryViewer.opt.category.variants[varArrayPos];
                        categoryViewer._onMouseOutFeature(categoryViewer, this.firstChild, feature);
                    })
                    .on("click", function(varArrayPos) {
                        var feature = categoryViewer.opt.category.variants[varArrayPos];
                        categoryViewer._onClickFeature(categoryViewer, this.firstChild, feature);
                    })
            ;
            groups.append("path")
                .attr("class", function (varArrayPos) {
                    var feature = categoryViewer.opt.category.variants[varArrayPos];
                    /*if (feature.color != undefined) {
                        d3.select(this).style("fill", feature.color);
                        d3.select(this).style("stroke", feature.color);
                    }*/
                    return typeClass + " " + mutationClass + " " + positionClass;
                })
                .style("fill-opacity", function (varArrayPos) {
                    var feature = categoryViewer.opt.category.variants[varArrayPos];
                    if (feature.selected === true) {
                        return 1;
                    } else {
                        return categoryViewer.opt.transparency;
                    }
                })
                .attr("id", function (varArrayPos) {
                    var feature = categoryViewer.opt.category.variants[varArrayPos];
                    return FTVUtils.ID_CLASS_PREFIX + feature.ftid + "_index_" + categoryViewer.opt.myArrayIndex;
                })
                .attr("index", function (varArrayPos) {
                    var feature = categoryViewer.opt.category.variants[varArrayPos];
                    feature.categoryIndex = categoryViewer.opt.categoryIndex;
                    feature.typeIndex = categoryViewer.opt.typeIndex;
                    feature.featureIndex = feature.featureIndex == undefined ? varArrayPos : feature.featureIndex;
                    return categoryViewer.opt.myArrayIndex;
                })
                .attr("tooltip", function (varArrayPos) {
                    var feature = categoryViewer.opt.category.variants[varArrayPos];
                    return _getFeatureTooltipText(positionObject, feature);
                })
                .style("cursor", function () {
                    if ((categoryViewer.opt.clickable === true) || (categoryViewer.opt.clickableStyle === true)) {
                        return "pointer";
                    }
                })
                .attr("d", function (varArrayPos) {
                    var feature = categoryViewer.opt.category.variants[varArrayPos];
                    if (feature.color == undefined) {
                        feature.color = d3.select(this).style("fill");
                    }
                    _calculatePosition(self, categoryViewer, feature, shift);
                    shift = shift + feature.height;
                    return FTVUtils.getShape(FTVUtils.getFTLocation().variation, feature, categoryViewer._pixelPerAA, categoryViewer.opt.useShapes, typeClass);
                })
            ;
            if (categoryViewer._zoomed === true) {
                groups.append("text")
                    .attr("class", typeClass + " " + mutationClass + " " + positionClass + " " + FTVUtils.stringToClass("mutatedAA"))
                    .text(function(varArrayPos) {
                        var feature = categoryViewer.opt.category.variants[varArrayPos];
                        return feature.mutation;
                    })
                    .attr("x", function (varArrayPos) {
                        var feature = categoryViewer.opt.category.variants[varArrayPos];
                        return feature.x + 3;
                    })
                    .attr("y", function (varArrayPos) {
                        var feature = categoryViewer.opt.category.variants[varArrayPos];
                        return feature.y - feature.height/2 + 4;
                    })
                ;
            }
        });
    });
    //var endTime = new Date().getTime();
    //console.log("PAINTING VAR: " + (endTime-startTime) + "ms");
};

/**
 * Returns an array of consequence types; each consequence type has a category (consequence type name), a type (same as the category viewer),
 * and an array of variants.
 * @param categoryViewer Viewer that actually takes care of category features display, it contains all the options and variants.
 * @returns {*}
 */
VariantProteinCategoryFTViewer.getTypes = function(categoryViewer) {
    var types = [];
    _.each(categoryViewer._stylingOpt._consequenceTypes, function(consequenceType) {
        var variantsType = _.filter(categoryViewer.opt.category.variants, function(variant) {
            return variant.consequenceTypes.indexOf(consequenceType) !== -1;
        });
        if (variantsType.length !== 0) {
            types.push({category: consequenceType, type: categoryViewer.opt.category.type, variants: variantsType});
        }
    });
    return types;
};