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
    }
  }
}();

module.exports = Constants;
