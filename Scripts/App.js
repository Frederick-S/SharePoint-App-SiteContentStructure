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
        this.title = '';
        this.serverRelativeUrl = '';
        this.type = '';
        this.iconUrl = '';
        this.children = [];
    };

    function queryWeb(absoluteWebUrl) {
        var subWebsDeferred = $.Deferred();
        var listsDeferred = $.Deferred();

        var appWebUrl = queryStringParameters.SPAppWebUrl;
        var subWebsRequestExecutor = new SP.RequestExecutor(appWebUrl);
        var listsRequestExecutor = new SP.RequestExecutor(appWebUrl);

        subWebsRequestExecutor.executeAsync({
            url: appWebUrl + '/_api/SP.AppContextSite(@target)/web/Webs?@target=%27' + absoluteWebUrl + '%27',
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
            url: appWebUrl + '/_api/SP.AppContextSite(@target)/web/Lists?@target=%27' + absoluteWebUrl + '%27',
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

    var hostWebUrl = queryStringParameters.SPHostUrl;

    queryWeb(hostWebUrl).then(function (subWebsResponse, listsRespnose) {


    }, function (errorMessage) {

    });
})(jQuery, SP);