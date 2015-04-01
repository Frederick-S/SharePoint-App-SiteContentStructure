(function ($, SP) {
    var Node = function () {
        this.title = '';
        this.serverRelativeUrl = '';
        this.absoluteUrl = '';
        this.type = '';
        this.iconUrl = '';
        this.children = [];
    };

    function getQueryStringParameters() {
        var params = document.URL.split("?")[1].split("&");
        var obj = {};

        for (var i = 0; i < params.length; i = i + 1) {
            var singleParam = params[i].split("=");
            obj[singleParam[0]] = decodeURIComponent(singleParam[1]);
        }

        return obj;
    }


})(jQuery, SP);