var Promise = require('bluebird'),
  _ = require("underscore"),
  google = require('googleapis'),
  youtube = google.youtube('v3');

function Paginator(options) {
  var component = this;
  this.setOptions(options);

  this.getAllPages = function (responses) {
    if (!component.options.endpoint || !component.options.params) {
      throw new Error('missing required params');
    }

    if (!responses) {
      responses = [];
    }

    return component.getPage().then(function (response) {
      responses.push(response);

      if (response.nextPageToken) {
        component.options.params.pageToken = response.nextPageToken;

        return component.getAllPages(responses);
      } else {
        if (component.options.mergePages) {
          return component.mergePages(responses);
        }

        return responses;
      }
    });
  };

  this.getPage = function () {
    return component.executeFunctionByName(component.options.endpoint, youtube, component.options.params);
  };

  this.executeFunctionByName = function (functionName, context) {
    var args = [].slice.call(arguments).splice(2),
      namespaces = functionName.split("."),
      func = namespaces.pop();

    for (var i = 0; i < namespaces.length; i++) {
      context = context[namespaces[i]];
    }

    var promisified = Promise.promisify(context[func]);
    return promisified.apply(this, args);
  };

  this.mergePages = function (pages) {
    if (!pages || !Array.isArray(pages) || pages.length < 1) {
      throw new Error('must provide an array containing pages to merge');
    }

    var mergedPages = {
      "pageInfo": {
        "totalResults": 0
      },
      "items": []
    };

    _.each(pages, function (page) {
      if (page.items) {
        mergedPages.items = mergedPages.items.concat(page.items);
      }
    });

    mergedPages.pageInfo.totalResults = mergedPages.items.length;
    return mergedPages;
  };
}

Paginator.prototype.setOptions = function (options) {
  this.options = options || {};
};

Paginator.prototype.getOptions = function () {
  return this.options;
};

module.exports = Paginator;
