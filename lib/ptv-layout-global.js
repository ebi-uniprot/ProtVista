/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.

 * @class ptv-layout-global
 * Exposes global variables that will be used by category layouts.
 */

var LayoutGlobal;
module.exports = LayoutGlobal = function(options){

};
//var LayoutGlobal = module.exports = {};

/**
 * Public zone
 */
LayoutGlobal.CSS_PREFIX = "up_pftv_";
LayoutGlobal.TRACK_PADDING = 3; //Should be the same as the padding in CSS for title and feature containers

LayoutGlobal.DISPLAY_NONE = "none";

LayoutGlobal.WITH_SHAPES = "withShapes";
LayoutGlobal.WITH_BRIDGES = "withBridges";
LayoutGlobal.WITH_REGIONS = "withRegions";
LayoutGlobal.WITH_VARIANTS = "withVariants";

LayoutGlobal.ARROW_RIGHT = "\u25BA";
LayoutGlobal.ARROW_DOWN = "\u25BC";

LayoutGlobal.AA_RESIDUE_MAP = {"A":"Ala","R":"Arg","N":"Asn","D":"Asp","C":"Cys","E":"Glu","Q":"Gln","G":"Gly","H":"His","I":"Ile","L":"Leu","K":"Lys","M":"Met","F":"Phe","P":"Pro","S":"Ser","T":"Thr","W":"Trp","Y":"Tyr","V":"Val"};

/**
 * Possible locations for features; these will be use in the JSON and the code.
 */
LayoutGlobal.FT_LOCATION = {
    position: "POSITION",
    bridge: "BRIDGE",
    continuous: "CONTINUOUS",
    variation: "VARIATION"
};

/**
 * Possible values for features track, they are either categories or types
 * (variant is a special case that can be either a category or a type).
 */
LayoutGlobal.TRACK_MODES = {
    category: "category",
    type: "type"
};

/**
 * Style views for categories and types, must be all in low case!
 */
LayoutGlobal.STYLE_VIEWS = {
    centered : "centered",
    nonOverlapping: "nonoverlapping",
    variants: "variants"
};

/**
 * Evidence types for manual and automatic annotations, will be used for filtering.
 */
LayoutGlobal.EVIDENCE_TYPES = {
    manual: ["ECO:0000218"],
    automatic: ["ECO:0000203"]
};
/**
 * Possible values for evidence based filter.
 */
LayoutGlobal.EVIDENCE_GROUPS = {
    manual: {name: "manual", text: "Manually curated"},
    automatic: {name: "automatic", text: "Automatically predicted"},
    unknown: {name: "unknown", text: "Unknown"}
};

/**
 * Compares two string regardless the case.
 * @param str1
 * @param str2
 * @returns {boolean}
 */
LayoutGlobal.equalsNoCase = function equalsNoCase(str1, str2) {
    return (str1.toUpperCase() === str2.toUpperCase());
};