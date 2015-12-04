var dealsHub = {};

dealsHub.vm = {};

dealsHub.vm.init = function() {
    this.deals = m.prop([]);
    this.backupDeals = m.prop([]);
    this.shortlist = m.prop([]);
    this.showShortlist = m.prop(false);
    this.apiHits = m.prop("0");
    this.doOnce = m.prop(true);
}


dealsHub.controller = function() {
    dealsHub.vm.init();
    if (localStorage.getItem("shortlist") != null)
        dealsHub.vm.shortlist(JSON.parse(localStorage.getItem("shortlist")));
    m.request({
        method: "GET",
        url: "https://nutanix.0x10.info/api/deals?type=json&query=list_deals"
    }).then(
        function(response) {
            dealsHub.vm.deals(response.deals);
            dealsHub.vm.backupDeals(response.deals);
        },
        function(error) {});
}


dealsHub.search = function(e) {
    dealsHub.vm.deals(dealsHub.vm.backupDeals());
    if (e.target.value != "") {
        var list = [];
        dealsHub.vm.deals().map(function(value, index) {
            if (value["name"].toUpperCase().search(e.target.value.toUpperCase()) != -1 || value["provider"].toUpperCase().search(e.target.value.toUpperCase()) != -1 || value["actual_price"].search(e.target.value) != -1 || value["discount"].toUpperCase().search(e.target.value.toUpperCase()) != -1)
                list.push(value)
        })
        dealsHub.vm.deals(list);
    }
}

dealsHub.likeItem = function(value) {
    if (localStorage.getItem(value.name) === null) {
        localStorage.setItem(value.name, "1");
        dealsHub.vm.shortlist().push(value);
        localStorage.setItem("shortlist", (JSON.stringify(dealsHub.vm.shortlist())));
    } else {
        localStorage.removeItem(value.name);
        var index = 0;
        for (var i = 0; i < dealsHub.vm.shortlist().length; i++) {
            if (dealsHub.vm.shortlist()[i].name === value.name) {
                index = i;
            }
        }
        dealsHub.vm.shortlist().splice(index, 1);
        localStorage.setItem("shortlist", (JSON.stringify(dealsHub.vm.shortlist())));
    }
}


dealsHub.getApiHits = function() {
    m.request({
        method: "GET",
        url: "https://nutanix.0x10.info/api/deals?type=json&query=api_hits"
    }).then(function(response) {
        dealsHub.vm.apiHits(response["api_hits"]);
        setTimeout(dealsHub.getApiHits, 5000);
    });
}


dealsHub.loadShortlist = function() {
    if (dealsHub.vm.showShortlist() == false) {
        if (dealsHub.vm.shortlist().length > 0)
            dealsHub.vm.deals(dealsHub.vm.shortlist());
        dealsHub.vm.showShortlist(true);
    }else{
        dealsHub.vm.showShortlist(false);
        dealsHub.vm.deals(dealsHub.vm.backupDeals());
    }
}

dealsHub.view = function() {
    if(dealsHub.vm.doOnce()){
        dealsHub.vm.doOnce(false);
        dealsHub.getApiHits();
    }
    return m(".container-fluid", [
        m(".row.header", [
            m(".logo.hidden-xs", m("img[src=images/logo.png]")),
            m(".small-logo.hidden-sm.hidden-md.hidden-lg", m("img[src=images/logo-small.png]")),
            m(".search", m("input[type=text][placeholder=Filter Items by Name/price/discount/provider]", {
                oninput: dealsHub.search
            })),
            m(".shortlist", {
                onclick: dealsHub.loadShortlist,
                class:dealsHub.vm.showShortlist()?"highlight":""
            }, [
                (function() {
                    if (dealsHub.vm.shortlist().length > 0)
                        return m("i.fa.fa-heart");
                    else
                        m("i.fa.fa-heart-o");
                })(),
                m("span", (function() {
                    return " ( " + dealsHub.vm.shortlist().length + " ) ";
                })()),
                m("span", "Shortlist")
            ]),
            m(".api-hits","API Hits : "+dealsHub.vm.apiHits())
        ]),
        m(".row.deals", [
            (function() {
                var list = [];
                dealsHub.vm.deals().map(function(value, index) {
                    list.push(m(".col-sm-5.col-xs-6.col-md-3.col-lg-3.col-xs-offset-3.deal", [
                        m(".image", [
                            m("img[src=" + value.image + "]"),
                            m(".name", [m(".product-name", m("a[href=" + value.link +  "][target=_blank]",value.name)), m(".actual-price", [m("i.fa.fa-inr"), m("span.price", value.actual_price), m("span", value.discount + " OFF")]),
                                m(".discounted-price", (function() {
                                    var price = Math.round(value.actual_price - (parseFloat(value.discount) * value.actual_price / 100));
                                    return [m("i.fa.fa-inr"), m("span.price", price)];
                                })()),
                            ]),
                            m(".rating", [m("i.fa.fa-star"), m("span", value.rating)]),
                            m(".fav", {
                                onclick: dealsHub.likeItem.bind('', value)
                            }, (function() {
                                if (localStorage.getItem(value.name) === null)
                                    return m("i.fa.fa-heart-o");
                                else
                                    return m("i.fa.fa-heart");
                            })())
                        ]),
                        m(".provider", value.provider)
                    ]))
                })
                return list;
            })()
        ])
    ]);
}
