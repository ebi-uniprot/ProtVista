/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var d3 = require("d3");
var _ = require("underscore");
var FeatureFactory = require("./FeatureFactory");
var NonOverlappingLayout = require("./NonOverlappingLayout");
var tooltipHandler = require("./TooltipFactory");
var BasicViewer = require("./BasicViewer");
var VariantViewer = require("./VariantViewer");
var VariantFilterDialog = require("./VariantFilterDialog");
var LegendFactory = require("./LegendFactory");

var Track = function(typeFeatures, category) {
    var track = this;
    track.data = typeFeatures;
    track.type = typeFeatures[0].type.name;
    track.label = typeFeatures[0].type.label;
    track.category = category;
    track.id = track.type + '_track';

    track.titleContainer = category.tracksContainer.append('div').style('display', 'inline-block');

    track.trackContainer = category.tracksContainer.append('div')
        .attr('class', 'up_pftv_track');

    track.typeLabels = {
        //molecular processing
        chain:'(aka mature region). This describes the extent of a polypeptide chain in the mature protein following' +
            ' processing',
        transit: 'This describes the extent of a transit peptide',
        init_met: "This indicates that the initiator methionine is cleaved from the mature protein",
        propep: 'Part of a protein that is cleaved during maturation or activation',
        peptide:'The position and length of an active peptide in the mature protein',
        signal:'N-terminal signal peptide',
        //structural
        helix:'The positions of experimentally determined helical regions',
        strand:'The positions of experimentally determined beta strands',
        turn:'The positions of experimentally determined hydrogen-bonded turns',
        disulfid:'The positions of cysteine residues participating in disulphide bonds',
        crosslnk:'Covalent linkages of various types formed between two proteins or between two parts of the same' +
            ' protein',
        //domains & sites
        region:'Regions in multifunctional enzymes or fusion proteins, or characteristics of a region, e.g.,' +
        ' protein-protein interactions mediation',
        coiled: 'Coiled coils are built by two or more alpha-helices that wind around each other to form a supercoil',
        motif:'Short conserved sequence motif of biological significance',
        repeat:'Repeated sequence motifs or repeated domains within the protein',
        ca_bind:'Calcium-binding regions, such as the EF-hand motif',
        dna_bind: 'DNA-binding domains such as AP2/ERF domain, the ETS domain, the Fork-Head domain, the HMG box and' +
            ' the Myb domain',
        domain:'Specific combination of secondary structures organized into a characteristic three-dimensional' +
            ' structure or fold',
        zn_fing: 'Small, functional, independently folded domain that coordinates one or more zinc ions',
        np_bind: '(aka flavin-binding). Region in the protein which binds nucleotide phosphates',
        metal: "Binding site for a metal ion",
        site: "Any interesting single amino acid site on the sequence",
        binding: "Binding site for any chemical group (co-enzyme, prosthetic group, etc.)",
        act_site: "Amino acid(s) directly involved in the activity of an enzyme",
        //ptms
        mod_res: "Modified residues such as phosphorylation, acetylation, acylation, methylation",
        lipid: "Covalently attached lipid group(s)",
        carbohyd: "Covalently attached glycan group(s)",
        //seqInfo
        compbias:'Position of regions of compositional bias within the protein and the particular amino acids that ' +
            'are over-represented within those regions',
        conflict:'Sequence discrepancies of unknown origin',
        non_cons: 'Indicates that two residues in a sequence are not consecutive and that there is an undetermined ' +
            'number of unsequenced residues between them',
        non_ter: 'The sequence is incomplete. The residue is not the terminal residue of the complete protein',
        unsure: 'Regions of a sequence for which the authors are unsure about the sequence assignment',
        non_std: "Non-standard amino acids (selenocysteine and pyrrolysine)",
        //mutagenesis
        mutagen:'Site which has been experimentally altered by mutagenesis',
        //topology
        topo_dom:'Location of non-membrane regions of membrane-spanning proteins',
        transmem:'Extent of a membrane-spanning region',
        intramem:'Extent of a region located in a membrane without crossing it',
        //variants
        variant: 'Natural variant of the protein, including polymorphisms, variations between strains, isolates or ' +
            'cultivars, disease-associated mutations and RNA editing events'
    };
};

Track.prototype.update = function() {
    var track = this;
    track.trackViewer.update();
};

var BasicTrackViewer = function(track) {
    return new BasicViewer(
        track.data, track.trackContainer, track.category.fv
    );
};

var VariantTrackViewer = function(track) {
    return new VariantViewer(
        track.data, track.trackContainer, track.category.fv
    );
};

Track.basic = function() {
    var self = this;
    this.titleContainer.attr('class', 'up_pftv_track-header')
        .attr('title', self.label.toUpperCase() + '\n' + self.typeLabels[self.type.toLowerCase()])
        .text(self.label);
    this.trackViewer = new BasicTrackViewer(this);
};

Track.variant = function() {
    var self = this;
    this.titleContainer.classed('up_pftv_track-header-container', true);
    this.titleContainer.append('div')
        .attr('class', 'up_pftv_track-header')
        .attr('title', self.label + '\n' + self.typeLabels.variant)
        .text(self.label);
    VariantFilterDialog.displayDialog(self.titleContainer, self.category.fv);
    LegendFactory.createLegendDialog(self.titleContainer);
    this.trackViewer = new VariantTrackViewer(this);
};

var TrackFactory = function() {
    return {
        createTrack: function(typeFeatures, type, category) {
            var track;

            // error if the constructor doesn't exist
            if (typeof Track[type] !== "function") {
                console.log('WARNING: Track viewer type ' + type + " doesn't exist");
            }

            //inherit parent constructor
            Track[type].prototype = new Track(typeFeatures, category, type);
            track = new Track[type]();
            return track;
        }
    };
}();

module.exports = TrackFactory;