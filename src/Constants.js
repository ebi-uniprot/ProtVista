/*jslint node: true */
/*jshint laxbreak: true */
"use strict";

var _ = require('underscore');

var Constants = function() {
  return {
    getDataSources: function() {
      var sources = [{
        url: 'https://wwwdev.ebi.ac.uk/uniprot/services/restful/features/',
        type: 'basic'
      }, {
        url: 'https://wwwdev.ebi.ac.uk/uniprot/services/restful/proteomics/',
        type: 'basic'
      }, {
        url: 'https://wwwdev.ebi.ac.uk/uniprot/services/restful/variation/',
        type: 'variant'
      }];
      return sources;
    },
    getCategoryNames: function() {
      return [{
        MOLECULE_PROCESSING: 'Molecule processing'
      }, {
        DOMAINS_AND_SITES: 'Domains & sites'
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
      }];
    }
  }
}();

module.exports = Constants;
