/*jslint node: true */
/*jshint laxbreak: true */
/*jshint laxcomma: true */
"use strict";

var _ = require("underscore");

var Evidence = function() {
    return {
        manual:
            ['ECO:0000269', 'ECO:0000303', 'ECO:0000305', 'ECO:0000250', 'ECO:0000255', 'ECO:0000244', 'ECO:0000312']
        , automatic: ['ECO:0000256', 'ECO:0000213', 'ECO:0000313']
        , acronym: {
            'ECO:0000269': 'EXP', 'ECO:0000303': 'NAS', 'ECO:0000305': 'IC', 'ECO:0000250': 'ISS', 'ECO:0000255': 'ISM',
            'ECO:0000244': 'MIXM', 'ECO:0000312': 'MI',
            'ECO:0000256': 'AA', 'ECO:0000213': 'MIXA', 'ECO:0000313': 'AI'
        }, isLSS: function(evidences) {
            return _.some(evidences, function(evidence) {
                return _.contains(Evidence.automatic, evidence.code);
            });
        }
    };
}();

module.exports = Evidence;