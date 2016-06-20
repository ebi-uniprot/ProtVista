/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var _ = require('underscore');

var Constants = function() {
  return {
    getBlastURL: function() {
        return 'http://www.uniprot.org/blast/?about='
    },
    getNoBlastTypes: function() {
      return ['helix', 'strand', 'turn', 'disulfid', 'crosslnk', 'variant'];
    },
    getDataSources: function() {
      var sources = [{
        url: 'https://www.ebi.ac.uk/uniprot/api/features/',
        type: 'basic'
      }, {
        url: 'https://www.ebi.ac.uk/uniprot/api/proteomics/',
        type: 'basic'
      }, {
        url: 'https://www.ebi.ac.uk/uniprot/api/variation/',
        type: 'variant'
      }];
      return sources;
    }, getCategoryNamesInOrder: function() {
      return [{
        DOMAINS_AND_SITES: 'Domains & sites'
      }, {
        MOLECULE_PROCESSING: 'Molecule processing'
      }, {
        PTM: 'Post translational modifications'
      }, {
        SEQUENCE_INFORMATON: 'Sequence information'
      }, {
        STRUCTURAL: 'Structural features'
      }, {
        TOPOLOGY: 'Topology'
      }, {
        MUTAGENESIS: 'Mutagenesis'
      }, {
        PROTEOMICS: 'Proteomics'
      }, {
        VARIATION: 'Variants'
      }];
    }, getCategoryName: function(name) {
      var names = this.getCategoryNamesInOrder();
      var match = _.find( names, function(item){
        return name === _.keys(item)[0];
      });
      if(match) {
        return match[name];
      } else {
        return name;
      }
    }, getTrackNames: function() {
      return {
          //molecular processing
          chain: {label: 'Chain',
              tooltip: '(aka mature region). This describes the extent of a polypeptide chain in the mature protein' +
              ' following processing'
          }, transit: {label: 'Transit peptide', tooltip: 'This describes the extent of a transit peptide'
          }, init_met: {label: 'Initiator methionine', tooltip: 'This indicates that the initiator methionine is cleaved from the mature' +
              ' protein'
          }, propep: {label: 'Propeptide', tooltip: 'Part of a protein that is cleaved during maturation or activation'
          }, peptide: {label: 'Peptide', tooltip: 'The position and length of an active peptide in the mature protein'
          }, signal: {label: 'Signal', tooltip: 'N-terminal signal peptide'},
          //structural
          helix: {label: 'Helix', tooltip: 'The positions of experimentally determined helical regions'
          }, strand: {label: 'Beta strand', tooltip: 'The positions of experimentally determined beta strands'
          }, turn: {label: 'Turn', tooltip: 'The positions of experimentally determined hydrogen-bonded turns'
          }, disulfid: {label: 'Disulfide bond', tooltip: 'The positions of cysteine residues participating in' +
              ' disulphide bonds'
          }, crosslnk: {label: 'Cross-link', tooltip: 'Covalent linkages of various types formed between two proteins' +
              ' or between two parts of the same protein'},
          //domains & sites
          region: {label: 'Region', tooltip: 'Regions in multifunctional enzymes or fusion proteins, or' +
              ' characteristics of a region, e.g., protein-protein interactions mediation'
          }, coiled:  {label: 'Coiled coil', tooltip: 'Coiled coils are built by two or more alpha-helices that wind' +
              ' around each other to form a supercoil'
          }, motif: {label: 'Motif', tooltip: 'Short conserved sequence motif of biological significance'
          }, repeat: {label: 'Repeat', tooltip: 'Repeated sequence motifs or repeated domains within the protein'
          }, ca_bind: {label: 'Calcium binding', tooltip: 'Calcium-binding regions, such as the EF-hand motif'
          }, dna_bind: {label: 'DNA binding', tooltip: 'DNA-binding domains such as AP2/ERF domain, the ETS domain,' +
              ' the Fork-Head domain, the HMG box and the Myb domain'
          }, domain: {label: 'Domain', tooltip: 'Specific combination of secondary structures organized into a ' +
              'characteristic three-dimensional structure or fold'
          }, zn_fing: {label: 'Zinc finger', tooltip: 'Small, functional, independently folded domain that coordinates' +
              ' one or more zinc ions'
          }, np_bind: {label: 'Nucleotide binding', tooltip: '(aka flavin-binding). Region in the protein which binds' +
              ' nucleotide phosphates'
          }, metal: {label: 'Metal binding', tooltip: 'Binding site for a metal ion'
          }, site: {label: 'Site', tooltip: 'Any interesting single amino acid site on the sequence'
          }, binding: {label: 'Binding site', tooltip: 'Binding site for any chemical group (co-enzyme, prosthetic' +
          ' group, etc.)'
          }, act_site: {label: 'Active site', tooltip: 'Amino acid(s) directly involved in the activity of an enzyme'},
          //ptms
          mod_res: {label: 'Modified residue', tooltip: 'Modified residues such as phosphorylation, acetylation,' +
              ' acylation, methylation'
          }, lipid: {label: 'Lipidation', tooltip: 'Covalently attached lipid group(s)'
          }, carbohyd: {label: 'Glycosylation', tooltip: 'Covalently attached glycan group(s)'},
          //seqInfo
          compbias: {label: 'Compositional bias', tooltip: 'Position of regions of compositional bias within the' +
              ' protein and the particular amino acids that are over-represented within those regions'
          }, conflict: {label: 'Sequence conflict', tooltip: 'Sequence discrepancies of unknown origin'
          }, non_cons: {label: 'Non-adjacent residues', tooltip: 'Indicates that two residues in a sequence are not ' +
              'consecutive and that there is an undetermined number of unsequenced residues between them'
          }, non_ter: {label: 'Non-terminal residue', tooltip: 'The sequence is incomplete. The residue is not the ' +
              'terminal residue of the complete protein'
          }, unsure: {label: 'Sequence uncertainty', tooltip: 'Regions of a sequence for which the authors are unsure ' +
              'about the sequence assignment'
          }, non_std: {label: 'Non-standard residue', tooltip: 'Non-standard amino acids (selenocysteine and ' +
              'pyrrolysine)'},
          //mutagenesis
          mutagen: {label: 'Mutagenesis', tooltip: 'Site which has been experimentally altered by mutagenesis'},
          //topology
          topo_dom: {label: 'Topological domain', tooltip: 'Location of non-membrane regions of membrane-spanning ' +
              'proteins'
          }, transmem: {label: 'Transmembrane', tooltip: 'Extent of a membrane-spanning region'
          }, intramem: {label: 'Intramembrane', tooltip: 'Extent of a region located in a membrane without crossing it'},
          //variants
          variant: {label: 'Natural variant', tooltip: 'Natural variant of the protein, including polymorphisms, ' +
              'variations between strains, isolates or cultivars, disease-associated mutations and RNA editing events'
          },
          unique:{label:'Unique peptide',tooltip:''},
          non_unique:{label:'Non-unique peptide',tooltip:''}
      };
    }, getTrackInfo: function(name) {
      return this.getTrackNames()[name];
    }
  };
}();

module.exports = Constants;
