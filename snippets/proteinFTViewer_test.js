var sequence = "abcdefghikklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk"
    + "lmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdef"
    + "ghijklmnopqrstuvwxyz";

//test with variants
sequence = var_j3kp33.sequence;

var domainsAndSites = {
    category: "Domains and sites",
    types: [
        {
            type: "ACT_SITE", label: "Active site", cvid: "SO:0000417",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "act-site-1", description: "act-site-1-desc", begin: 5, end:6}
                        ,{ ftid: "act-site-2", description: "act-site-2-desc", begin: 10, end: 10}
                        ,{ ftid: "act-site-3", description: "act-site-3-desc", begin: sequence.length-10, end: sequence.length-10}
                        //,{ ftid: "act-site-4", description: "act-site-4-desc", begin: 116, end: 116}
                    ]
                }
            ]
        },
        {
            type: "SITE", label: "Site", cvid: "SO:0000SSS",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "site-1", description: "site-1-desc", begin: 20, end:20}
                    ]
                }
            ]
        },
        {
            type: "METAL", label: "Metal", cvid: "SO:0000MMM",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "metal-1", description: "metal-1-desc", begin: 30, end:30}
                    ]
                }
            ]
        },
        {
            type: "BINDING", label: "Binding", cvid: "SO:0000BBB",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "binding-1", description: "binding-1-desc", begin: 40, end:41}
                    ]
                }
            ]
        },
        {
            type: "LIPID", label: "Lipid", cvid: "SO:0000LLL",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "lipid-1", description: "lipid-1-desc", begin: 50, end:50}
                    ]
                }
            ]
        },
        {
            type: "NON_STD", label: "Non standard", cvid: "SO:0000NNN",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "non-std-1", description: "non-std-1-desc", begin: 60, end:60}
                    ]
                }
            ]
        },
        {
            type: "CA_BIND", label: "Calcium binding", cvid: "SO:0001080",
            locations: [
                {
                    locationType: "CONTINUOUS",
                    features: [
                        { ftid: "ca_bind-1", description: "ca_bind-1-desc", begin: 7, end: 14},
                        { ftid: "ca_bind-2", description: "ca_bind-2-desc", begin: 38, end: 45}
                    ]
                }
            ]
        }
    ]
};
var structural = {
    category: "Structural features - Seq info",
    types: [
        {
            type: "DISULFID", label: "Disulfide bond", cvid: "MOD:00689",
            locations: [
                {
                    locationType: "BRIDGE",
                    features: [
                        { ftid: "bond-1", description: "bond-1-desc", begin: 15, end: 25}
                    ]
                }
            ]
        },
        {
            type: "TURN", label: "turn", cvid: "SO:0001128",
            locations: [
                {
                    locationType: "CONTINUOUS",
                    features: [
                        {
                            ftid: "turn-1", description: "turn-1-desc", begin: 8, end: 59,
                            evidence: {type: "ECO:0000218", source: {ref: "23"}}
                        },
                        {
                            ftid: "turn-2", description: "turn-2-desc", begin: 18, end: 69,
                            evidence: {type: "ECO:0000203", source: {dbReferenceType: "MIM", dbReferenceId: "123"}}
                        },
                        {
                            ftid: "turn-3", description: "turn-3-desc", begin: 28, end: 79,
                            evidence: {type: "ECO:0000203", source: {dbReferenceType: "MIM", dbReferenceId: "123"}}
                        }
                    ]
                }
            ]
        },
        {
            type: "NON_TER", label: "Non terminal residue", cvid: "NA",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        {ftid: "non-ter-0", description: "non-ter-0-desc", id: "internal ID", begin: sequence.length, end: sequence.length}
                    ]
                }
            ]

        },
        {
            type: "NON_CONS", label: "Non consecutive residue", cvid: "NA",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "non-cons-0", description: "non-cons-0-desc", begin: 21, end: 21}
                        //,{ ftid: "non-cons-1", description: "non-cons-1-desc", begin: 113, end: 113}
                        ,{ ftid: "non-cons-2", description: "non-cons-1-desc", begin: sequence.length-10, end: sequence.length-10}
                    ]
                }
            ]
        },
        {
            type: "INIT_MET", label: "Removed initiator methionine", cvid: "NA",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "init-met-0", description: "init-met-0-desc", begin: 1, end: 1}
                    ]
                }
            ]
        }
    ]
};
var ptms = {
    category: "Post translational modification",
    types: [
        {
            type: "CARBOHYD", label: "Glycosylation", cvid: "MOD:00693",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        { ftid: "carbohyd-0", description: "carbohyd-0-desc", begin: 7, end: 7},
                        { ftid: "carbohyd-1", description: "carbohyd-1-desc", begin: 52, end: 53}
                    ]
                }
            ]
        },
        {
            type: "MOD_RES", label: "Modified residue", cvid: "SO:0001089",
            locations: [
                {
                    locationType: "POSITION",
                    features: [
                        //{ ftid: "mod_res-1", description: "mod_res-1-desc", begin: 103, end: 103}
                        //,
                        { ftid: "mod_res-2", description: "mod_res-2-desc", begin: 40, end: 40}
                    ]
                }
            ]
        }
    ]
};
var topo = {
    "category": "Topological",
    "types": [ ]

};
var variants = {
    "category": "Variants",
    "type": "NATURAL_VARIANT",
    /*"variants": [
        {"id":"J3KP33_variant754","sourceIds":["COSM44191"],"position":5,"wild_type":"Q","mutation":"*","frequency":0.0,"polyphenPrediction":"-","polyphenScore":0.0,"siftPrediction":"-","siftScore":0.0,"somaticStatus":1,"consequenceTypes":"stop gained","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579900G>A"}
        ,{"id":"J3KP33_variant769","sourceIds":["COSM45588"],"position":5,"wild_type":"Q","mutation":"H","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.025,"siftPrediction":"deleterious","siftScore":0.05,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579898C>A"}
        ,{"id":"J3KP33_variant133","sourceIds":["COSM45800"],"position":7,"wild_type":"D","mutation":"H","frequency":0.0,"polyphenPrediction":"probably damaging","polyphenScore":0.974,"siftPrediction":"deleterious","siftScore":0.01,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579894C>G"}
        ,{"id":"J3KP33_variant1084","sourceIds":["COSM510151"],"position":10,"wild_type":"V","mutation":"G","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.176,"siftPrediction":"deleterious","siftScore":0.01,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579884A>C"}
        ,{"id":"J3KP33_variant1096","sourceIds":["COSM1386937","COSM1386938","COSM1386939","COSM45361"],"position":10,"wild_type":"V","mutation":"I","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.002,"siftPrediction":"tolerated","siftScore":0.73,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579885C>T"}
        ,{"id":"J3KP33_variant232","sourceIds":["COSM11606","COSM327259","COSM327260","COSM327261","rs201382018"],"position":11,"wild_type":"E","mutation":"Q","frequency":5.0E-4,"polyphenPrediction":"probably damaging","polyphenScore":0.918,"siftPrediction":"deleterious","siftScore":0.02,"somaticStatus":0,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579882C>G"}
        ,{"id":"J3KP33_variant783","sourceIds":["COSM1197252","COSM1197253","COSM1197254","COSM12732"],"position":16,"wild_type":"Q","mutation":"L","frequency":0.0,"polyphenPrediction":"probably damaging","polyphenScore":0.936,"siftPrediction":"deleterious","siftScore":0.0,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579866T>A"}
        ,{"id":"J3KP33_variant987","sourceIds":["COSM220785","COSM220786","COSM220787","COSM220788"],"position":18,"wild_type":"T","mutation":"A","frequency":0.0,"polyphenPrediction":"possibly damaging","polyphenScore":0.866,"siftPrediction":"deleterious","siftScore":0.01,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579861T>C"}
        ,{"id":"J3KP33_variant714","sourceIds":["COSM1167900","COSM1167901","COSM1167902","COSM1167903"],"position":27,"wild_type":"P","mutation":"S","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.148,"siftPrediction":"tolerated","siftScore":0.27,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579717G>A"}
        ,{"id":"J3KP33_variant1097","sourceIds":["COSM45360","rs201753350"],"position":31,"wild_type":"V","mutation":"I","frequency":0.0018,"polyphenPrediction":"benign","polyphenScore":0.01,"siftPrediction":"tolerated","siftScore":0.35,"somaticStatus":0,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579705C>T"}
        ,{"id":"J3KP33_variant972","sourceIds":["COSM45129"],"position":33,"wild_type":"S","mutation":"T","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.013,"siftPrediction":"tolerated","siftScore":0.31,"somaticStatus":1,"consequenceTypes":"missense variant,splice_region_variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579590A>T"}
        ,{"id":"J3KP33_variant661","sourceIds":["COSM43672"],"position":34,"wild_type":"P","mutation":"L","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.003,"siftPrediction":"tolerated","siftScore":0.07,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579586G>A"}
        ,{"id":"J3KP33_variant483","sourceIds":["COSM45193","COSM46160"],"position":35,"wild_type":"L","mutation":"F","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.363,"siftPrediction":"tolerated","siftScore":0.71,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579582C>A"}
        ,{"id":"J3KP33_variant973","sourceIds":["COSM44483"],"position":37,"wild_type":"S","mutation":"T","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.02,"siftPrediction":"tolerated","siftScore":0.45,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579578A>T"}
        ,{"id":"J3KP33_variant755","sourceIds":["COSM236889","COSM236890","COSM46286"],"position":38,"wild_type":"Q","mutation":"*","frequency":0.0,"polyphenPrediction":"-","polyphenScore":0.0,"siftPrediction":"-","siftScore":0.0,"somaticStatus":1,"consequenceTypes":"stop gained","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579575G>A"}
        ,{"id":"J3KP33_variant784","sourceIds":["COSM307330"],"position":38,"wild_type":"Q","mutation":"L","frequency":0.0,"polyphenPrediction":"benign","polyphenScore":0.082,"siftPrediction":"tolerated","siftScore":0.27,"somaticStatus":1,"consequenceTypes":"missense variant","cytogeneticBand":"17p13.1","genomicLocation":"17:g.7579574T>A"}
    ] */
    "variants": var_j3kp33.variants
};
var model = {
    accession: "P00000",
    identifier: "P0_human",
    sequence: sequence,
    categories: [domainsAndSites, structural, topo, ptms, variants] //
    //sequence: p51587.sequence,
    //categories: p51587.categories
};

var biojs_proteinFTViewer = require("biojs-vis-proteinFeaturesViewer");
//d3.select("body").append("div");
var instance = new biojs_proteinFTViewer({
    element: document.getElementById("target"),
    //element: document.getElementsByTagName("div")[0],
    useTooltips: true,
    width: 1200,
    featuresModel: model,
    transparency: 0.4
});