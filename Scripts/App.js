(function ($, SP) {
    function getQueryStringParameters() {
        var params = document.URL.split("?")[1].split("&");
        var obj = {};

        for (var i = 0; i < params.length; i = i + 1) {
            var singleParam = params[i].split("=");
            obj[singleParam[0]] = decodeURIComponent(singleParam[1]);
        }

        return obj;
    }

    var queryStringParameters = getQueryStringParameters();

    var Node = function () {
        this.id = '';
        this.title = '';
        this.serverRelativeUrl = '';
        this.absoluteUrl = '';
        this.type = '';
        this.iconUrl = '';
        this.children = [];
    };

    function queryCurrentWeb() {
        var deferred = $.Deferred();
        var appWebUrl = queryStringParameters.SPAppWebUrl;
        var hostWebUrl = queryStringParameters.SPHostUrl;

        var clientContext = SP.ClientContext.get_current();
        var appContextSite = new SP.AppContextSite(clientContext, hostWebUrl);
        var web = appContextSite.get_web();

        clientContext.load(web);
        clientContext.executeQueryAsync(function (sender, args) {
            deferred.resolve(web);
        }, function (sender, args) {
            var message = args.get_message();

            deferred.reject(message);
        });

        return deferred.promise();
    }

    function queryWebChildren(absoluteWebUrl) {
        var subWebsDeferred = $.Deferred();
        var listsDeferred = $.Deferred();

        var appWebUrl = queryStringParameters.SPAppWebUrl;
        var subWebsRequestExecutor = new SP.RequestExecutor(appWebUrl);
        var listsRequestExecutor = new SP.RequestExecutor(appWebUrl);

        subWebsRequestExecutor.executeAsync({
            url: appWebUrl + '/_api/SP.AppContextSite(@target)/web/Webs?@target=%27' + absoluteWebUrl + '%27&$select=ID, Title, Url, ServerRelativeUrl, SiteLogoUrl',
            method: 'GET',
            headers: {
                'accept': 'application/json; odata=verbose'
            },
            success: function (response) {
                subWebsDeferred.resolve(response);
            },
            error: function (response) {
                subWebsDeferred.reject(response.statusCode + ": " + response.statusText);
            }
        });

        listsRequestExecutor.executeAsync({
            url: appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists?@target=%27' + absoluteWebUrl + '%27&$select=ID, Title, DefaultDisplayFormUrl, ImageUrl&$filter=Hidden eq false',
            method: 'GET',
            headers: {
                'accept': 'application/json; odata=verbose'
            },
            success: function (response) {
                listsDeferred.resolve(response);
            },
            error: function (response) {
                listsDeferred.reject(response.statusCode + ": " + response.statusText);
            }
        });

        return $.when(subWebsDeferred, listsDeferred);
    }

    function createSubNodes(data) {
        var subNodes = [];

        if (!data) {
            return subNodes;
        }

        try {
            var obj = JSON.parse(data);
            var results = obj['d']['results'];

            for (var i = 0, length = results.length; i < length; i++) {
                var result = results[i];
                var metaData = result['__metadata'];

                var node = new Node();
                node.type = metaData.type;

                switch (node.type) {
                    case 'SP.Web':
                        node.id = result['Id'];
                        node.title = result['Title'];
                        node.iconUrl = result['SiteLogoUrl'];
                        node.absoluteUrl = result['Url'];
                        node.serverRelativeUrl = result['ServerRelativeUrl'];
                        break;
                    case 'SP.List':
                        node.id = result['Id'];
                        node.title = result['Title'];
                        node.iconUrl = result['ImageUrl'];
                        node.serverRelativeUrl = result['DefaultDisplayFormUrl'];
                        break;
                    default:
                        break;
                }

                subNodes.push(node);
            }
        } catch (error) {
            subNodes = [];
        }

        return subNodes;
    }

    function createSubNodesForWeb(absoluteWebUrl) {
        var deferred = $.Deferred();

        queryWebChildren(absoluteWebUrl).then(function (subWebsResponse, listsRespnose) {
            var subWebsData = subWebsResponse.body;
            var listsData = listsRespnose.body;

            var subWebsNodes = createSubNodes(subWebsData);
            var listsNodes = createSubNodes(listsData);

            var children = subWebsNodes.concat(listsNodes);

            deferred.resolve(children);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise();
    }

    queryCurrentWeb().done(function (web) {
        var node = new Node();
        node.id = web.get_id().toString();
        node.title = web.get_title();
        node.type = 'SP.Web';
        node.absoluteUrl = web.get_url();
        node.serverRelativeUrl = web.get_serverRelativeUrl();
        node.expanded = true;

        createSubNodesForWeb(web.get_url()).done(function (children) {
            node.children = children;

            $('.spinner').hide();
            $('.container').fancytree({
                source: [node]
            });
        }).fail(function (errorMessage) {
            alert(errorMessage);
        });
    }).fail(function (errorMessage) {
        alert(errorMessage);
    });
})(jQuery, SP);