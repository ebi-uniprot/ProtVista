var sequence = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk"
    + "lmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdef"
    + "ghijklmnopqrstuvwxyz";
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
var model = {
    accession: "P00000",
    identifier: "P0_human",
    sequence: sequence,
    categories: [domainsAndSites, structural, topo, ptms]
    //sequence: p51587.sequence,
    //categories: p51587.categories
};

var biojs_proteinFTViewer = require("biojs-vis-proteinFeaturesViewer");
var instance = new biojs_proteinFTViewer({
    element: document.getElementById("target"),
    useTooltips: true,
    width: 1200,
    featuresModel: model,
    transparency: 0.7
});