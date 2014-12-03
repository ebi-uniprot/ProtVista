var d3 = require("d3");
var FTVUtils = require("./pftv-aux-utils.js");
/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 */

/**
@class biojs_vis_proteinFeaturesViewer
 */
var  biojs_vis_proteinFeaturesViewer;
module.exports = biojs_vis_proteinFeaturesViewer = function(options){
    this.opt = options;
    console.log("working");
    FTVUtils.getTest();
    //biojs_vis_proteinFeaturesViewer.start();
    //this.start();
};

/**
 * Private Methods
 */

/*
 * Public Methods
 */
biojs_vis_proteinFeaturesViewer.opt = {
    target: "targetID",
    testText: "test"
};
/**
 * Initializes the configuration options.
 * @param options
 */
biojs_vis_proteinFeaturesViewer.start = function() {
    //do something, the options have been already set
};
/**
 * Gets a DOM id and sets its innerHTML to text
 * @param id DOM id
 * @param text Text to be injected
 */
biojs_vis_proteinFeaturesViewer.greetings = function(id, text) {
    this.start();
    d3.select("#" + id).text("hello " + text);
};
/**
 * Greetings test method.
 * @example
 *     biojs_vis_proteinFeaturesViewer.greetingsTest('biojs');
 *
 * @method greetingsTest
 * @param {String} text Text to greet to
 * @return {String} Returns hello + text
 */
biojs_vis_proteinFeaturesViewer.getGreetings = function (text) {
    return 'hello ' + text;
};