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
        this.icon = '';
        this.children = [];
    };

    function queryRootWeb() {
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
            url: appWebUrl + '/_api/SP.AppContextSite(@target)/web/Webs?@target=%27' + absoluteWebUrl + '%27&$select=ID, Title, Url, ServerRelativeUrl',
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

    function createRootWebNode(web) {
        var deferred = $.Deferred(function () {
            var node = new Node();

            node.id = web.get_id().toString();
            node.title = web.get_title();
            node.type = 'SP.Web';
            node.icon = '/_layouts/15/images/SharePointFoundation16.png';
            node.absoluteUrl = web.get_url();
            node.serverRelativeUrl = web.get_serverRelativeUrl();
            node.expanded = true;

            this.resolve(node);
        });

        return deferred.promise();
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
                        node.icon = '/_layouts/15/images/SharePointFoundation16.png';
                        node.absoluteUrl = result['Url'];
                        node.serverRelativeUrl = result['ServerRelativeUrl'];
                        node.lazy = true;
                        
                        break;
                    case 'SP.List':
                        node.id = result['Id'];
                        node.title = result['Title'];
                        node.icon = result['ImageUrl'];
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

    function createSubNodesForWeb(node) {
        var deferred = $.Deferred();

        queryWebChildren(node.absoluteUrl).then(function (subWebsResponse, listsRespnose) {
            var subWebsData = subWebsResponse.body;
            var listsData = listsRespnose.body;

            var subWebsNodes = createSubNodes(subWebsData);
            var listsNodes = createSubNodes(listsData);

            var children = subWebsNodes.concat(listsNodes);

            node.children = children;

            deferred.resolve(node);
        }, function (errorMessage) {
            deferred.reject(errorMessage);
        });

        return deferred.promise();
    }

    function render(node) {
        if (!node) {
            return;
        }

        $('.spinner').hide();
        $('.container').fancytree({
            source: [node],
            lazyLoad: function (event, data) {
                switch (data.node.data.type) {
                    case 'SP.Web':
                        var node = new Node();
                        node.absoluteUrl = data.node.data.absoluteUrl;

                        data.result = $.Deferred(function () {
                            var deferred = this;

                            createSubNodesForWeb(node).then(function (node) {
                                deferred.resolve(node.children);
                            });
                        });

                        break;
                    case 'SP.List':
                        break;
                    default:
                        break;
                }
            },
        });
    }
    
    function onError(errorMessage) {
        alert(errorMessage);
    }

    queryRootWeb().then(createRootWebNode, onError).then(createSubNodesForWeb, onError).then(render);
})(jQuery, SP);