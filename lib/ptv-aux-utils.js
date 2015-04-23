var LayoutGlobal = require('./ptv-aux-global');
var _ = require('underscore');
var d3 = require('d3');

/*
 * biojs_vis_proteinFeaturesViewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 ebi-uniprot
 * Licensed under the Apache 2 license.
 *
 * @class ptv-aux-utils
 * Utility class for the protein track viewer.
 *
 1. Position
 2. ProbablePosition
 3. Bridge
 4. RangePosition
 5. Continuous
 6. ContinuousWithUncertainty: Continuous + {~, <, >}
 7. ContinuousWithRange:
 8. ContinuousWithEnvelope
 9. Discontinuous
 *****
 1. FT   INIT_MET     1   1      Removed [Comment.]
 5. FT   SIGNAL       1   m      [Comment.]
 5. FT   PROPEP       n   m      [Comment.]
 5. FT   TRANSIT      1   m      Organelle [Comment].
 5. FT   CHAIN        n   m      Name of mature protein [Comment].
 5. FT   PEPTIDE      n   m      Name of active peptide [Comment].
 5. FT   TOPO_DOM     n   m      Location of the topological domain.
 5. FT   TRANSMEM     n   m      [Comment.]
 5. FT   DOMAIN       n   m      Nature of the domain [Comment].
 5. FT   REPEAT       n   m      Repeat name and/or repeat number [Comment].
 5. FT   CA_BIND      n   m      [Comment.]
 5. FT   ZN_FING      n   m      Nature of the zinc finger.
 5. FT   DNA_BIND     n   m      Nature of the DNA-binding region [Comment].
 5. FT   NP_BIND      n   m      Nature of the nucleotide phosphate [Comment].
 5. FT   REGION       n   m      Nature of the region.
 5. FT   COILED       n   m      [Comment].
 5. FT   MOTIF        n   m      Nature of the motif.
 5. FT   COMPBIAS     n   m      Nature of the compositionally biased region.
 1. FT   ACT_SITE     n   n(m)   Nature of active site [Comment].
 1. FT   METAL        n   n      Nature of the binding metal [Comment].
 1. FT   BINDING      n   n(m)   Name of the binding chemical group [Comment].
 1. FT   SITE         n   n/m    Nature of the site.
 1. FT   NON_STD      n   n      [Comment.]
 1. FT   MOD_RES      n   n      Modification [Comment].
 1. FT   LIPID        n   n      Name of the attached group [Comment].
 1. FT   CARBOHYD     n   n      Nature of the carbohydrate [Comment].
 3. FT   DISULFID     n   n(m)   [Interchain] [Comment].
 3. FT   CROSSLNK     n   m      Nature of crosslink.
 5. FT   VAR_SEQ      n   n(m)   Sequence variation (Comment).
 5. FT   VARIANT      n   n/m    Sequence variation [Comment].
 5. FT   MUTAGEN      n   n(m)   Modification: Comment.
 5. FT   UNSURE       n   n/m    [Comment.]
 5. FT   CONFLICT     n   n/m    Difference (Origin).
 1. FT   NON_CONS     n   n+1    [Comment.]
 1. FT   NON_TER      n   n
 5. FT   HELIX        n   m
 5. FT   TURN         n   m
 5. FT   STRAND       n   m
 * */

var ProteinTrackUtils;

module.exports = ProteinTrackUtils = function(options){

};

/**
 * Private zone
 */
/*
 * Private variables.
 * */
/**
 * Private methods.
 */


/**
 * Public zone.
 */
/**
 * Public and _protected variables.
 */

/**
 * Compares two string regardless the case.
 * @param str1
 * @param str2
 * @returns {boolean}
 */
ProteinTrackUtils.equalsNoCase = function equalsNoCase(str1, str2) {
    return (str1.toUpperCase() === str2.toUpperCase());
};
/**
 * Returns a track tile depending on whether it is a category track (title comes in the category element),
 * or a type track (title comes in the label element).
 * @param track
 * @returns {string}
 * TODO schema, maybe without the arrow
 */
ProteinTrackUtils.getTrackTitle = function getTrackTitle(track, withArrow) {
    if (track.category === undefined) {//it is a type
        return track.label.toUpperCase();
    } else {
        return withArrow === true ? LayoutGlobal.ARROW_RIGHT + " " + track.category.toUpperCase() : track.category.toUpperCase();
    }
};
/**
 * Returns a trackMode, "category" if the track has an element category and the typeIndex is not undefined,
 * otherwise "type"
 * @param track
 * @param typeIndex
 * @returns {string}
 * TODO
 */
ProteinTrackUtils.getTrackMode = function getTrackMode(track, typeIndex) {
    if (track.category === undefined) {
        return LayoutGlobal.TRACK_MODES.type;
    } else {
        if (typeIndex != undefined) {
            return LayoutGlobal.TRACK_MODES.type;
        }
        return LayoutGlobal.TRACK_MODES.category;
    }
};
/**
 * Returns the types for a features track; if it is a category track types come in the types element,
 * otherwise it is a type and the type itself come in the category element.
 * @param track
 * @returns {*}
 * TODO
 */
ProteinTrackUtils.getTrackTypes = function getTrackTypes(track) {
    if (track.category === undefined) {
        return [track];
    } else {
        return track.types;
    }
};
/**
 * Returns whether the features track is a variant track.
 * @param track
 * @returns {boolean}
 * TODO
 */
ProteinTrackUtils.isVariantsTrack = function isVariantsTrack(track) {
    if (track.variants === undefined) {//it is a category/type with variants
        return false;
    } else {
        return true;
    }
};
/**
 * Returns the tooltip text.
 * @param type
 * @param location
 * @param feature
 * @param self
 * @returns {string}
 * TODO
 */
ProteinTrackUtils.getFeatureTooltipText = function getFeatureTooltipText(type, location, feature, self) {
    var text = "";
    //type
    text =
        type.label == undefined ?
            type.cvId == undefined ?
                ""
                : text + "Type: " + type.cvId + "<br/>"
            : type.cvId == undefined ?
        text + "Type: " + type.label + "<br/>"
            : text + "Type: " + type.label + " - " + type.cvId + "<br/>";
    // location
    if (this.equalsNoCase(location, LayoutGlobal.FT_LOCATION.position)) {
        var residues = FTVUtils.getResidue(self.opt.sequence[FTVUtils.getStart(feature)-1]);//aa position starts in 1, sequence string starts in 0
        if (FTVUtils.getStart(feature) != FTVUtils.getEnd(feature)) {
            residues = residues + FTVUtils.getResidue(self.opt.sequence[FTVUtils.getEnd(feature)-1]);
        }
        text = text + "Residues: " + residues + " [" + FTVUtils.getStart(feature) + "," + FTVUtils.getEnd(feature) + "]" + "<br/>";
    } else {
        text = text + "Residues: [" + FTVUtils.getStart(feature) + "," + FTVUtils.getEnd(feature) + "]" + "<br/>";
    }
    //description
    text =
        (feature.description == undefined) || (feature.description.length === 0) ?
            (feature.comments == undefined) || (feature.comments.length === 0) ?
                text
                : text + "Description: (" + feature.comments[0] + ")<br/>"
            : feature.comments == undefined ?
        text + "Description: " + feature.description + "<br/>"
            : text + "Description: " + feature.description + " (" + feature.comments[0] + ")<br/>";
    // id
    text = feature.internalId == undefined ? text : text + "Feature ID: " + feature.internalId + "<br/>";
    return text;
};
/**
 * Returns the residue name corresponding to an amino acid letter.
 * @param aa
 * @returns {*}
 * TODO
 */
ProteinTrackUtils.getResidue = function getResidue(aa) {
    if (LayoutGlobal.AA_RESIDUE_MAP[aa] === undefined) {
        return "";
    } else {
        return LayoutGlobal.AA_RESIDUE_MAP[aa];
    }
};
/**
 * Converts a feature type into a valid CSS class name.
 * @param type
 * @returns {string}
 * TODO
 */
ProteinTrackUtils.stringToClass = function stringToClass(type) {
    return LayoutGlobal.CSS_PREFIX + type.toLowerCase().replace(/ /g,'_');
};
/**
 * Gets the start position for a feature depending on its type.
 * Note: It works fine with the currently supported location types, i.e., CONTINUOUS, POSITION, and BRIDGE.
 * It would also work with RANGE_POSITION, CONTINUOUS_WITH_UNCERTAINTY, and CONTINUOUS_WITH_ENVELOPE (maybe) but not for PROBABLE_POSITION, CONTINUOUS_WITH_RANGE, and DISCONTINUOUS.
 * @param feature
 * @return Number
 */
ProteinTrackUtils.getStart = function getStart(feature) {
    return parseInt(feature.begin);
};
/**
 * Gets the end position for a feature depending on its type.
 * * Note: It works fine with the currently supported location types, i.e., CONTINUOUS, POSITION, and BRIDGE.
 * It would also work with RANGE_POSITION, CONTINUOUS_WITH_UNCERTAINTY, and CONTINUOUS_WITH_ENVELOPE (maybe) but not for PROBABLE_POSITION, CONTINUOUS_WITH_RANGE, and DISCONTINUOUS.
 * @param feature
 * @return {*}
 */
ProteinTrackUtils.getEnd = function getEnd(feature) {
    return parseInt(feature.end);
};
/**
 * Returns the length of a feature.
 * @param feature
 * @returns {number}
 */
ProteinTrackUtils.getLength = function getLength(feature) {
    return this.getEnd(feature)-this.getStart(feature) + 1;
};
/**
 * Returns the evidence group for the evidence provided.
 * @param evidence
 * @returns {string}
 */
ProteinTrackUtils.getEvidenceType = function getEvidenceType(evidence) {
    if (((evidence != undefined) && (evidence.type != undefined))) {
        if (_.contains(LayoutGlobal.EVIDENCE_TYPES.manual, evidence.type)) {
            return LayoutGlobal.EVIDENCE_GROUPS.manual.name;
        }
        if (_.contains(LayoutGlobal.EVIDENCE_TYPES.automatic, evidence.type)) {
            return LayoutGlobal.EVIDENCE_GROUPS.automatic.name;
        }
    }
    return LayoutGlobal.EVIDENCE_GROUPS.unknown.name;
};
/**
 * Returns true if the evidence provided corresponds to the group "manual".
 * @param evidence
 * @returns {boolean}
 */
ProteinTrackUtils.isManualEvidence = function isManualEvidence(evidence) {
    return (this.getEvidenceType(evidence) === LayoutGlobal.EVIDENCE_GROUPS.manual.name);
};
/**
 * Returns true if the evidence provided corresponds to the group "automatic".
 * @param evidence
 * @returns {boolean}
 */
ProteinTrackUtils.isUnknownEvidence = function isUnknownEvidence(evidence) {
    return (this.getEvidenceType(evidence) === LayoutGlobal.EVIDENCE_GROUPS.automatic.name);
};
/**
 * Returns true if the evidence provided corresponds to the group "unknown".
 * @param evidence
 * @returns {boolean}
 */
ProteinTrackUtils.isUnknownEvidence = function isUnknownEvidence(evidence) {
    return (this.getEvidenceType(evidence) === LayoutGlobal.EVIDENCE_GROUPS.unknown.name);
};
