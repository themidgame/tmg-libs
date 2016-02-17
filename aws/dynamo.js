var Promise = require('bluebird'),
  AWS = require('aws-sdk');

module.exports = function (region, tableName) {
  if (!region || !tableName) {
    throw new Error('region and tableName are required');
  }

  AWS.config.update({ region: region });
  var docClient = new AWS.DynamoDB.DocumentClient();
  Promise.promisifyAll(Object.getPrototypeOf(docClient));

  var store = {

    getItemsByPartitionKey: function (partitionName, keyValue, currentItems, lastEvaluatedKey) {
      var items = currentItems || [];

      return store._getItemsPage(partitionName, keyValue, lastEvaluatedKey)
        .then(function (resultsPage) {
          if (resultsPage.Items) {
            items.push.apply(items, resultsPage.Items);
          }

          if (resultsPage.LastEvaluatedKey) {
            return store.getItemsByPartitionKey(partitionName, keyValue, items, resultsPage.LastEvaluatedKey);
          } else {
            return items;
          }
        });
    },

    _getItemsPage: function (partitionName, keyValue, lastEvaluatedKey, retryCount) {
      var retries = retryCount || 0,
        options = {
          TableName: tableName,
          KeyConditionExpression: "#partitionKey = :keyValue",
          ExpressionAttributeNames: {
            "#partitionKey": partitionName
          },
          ExpressionAttributeValues: {
            ":keyValue": keyValue
          }
        };

      if (lastEvaluatedKey) {
        options.ExclusiveStartKey = lastEvaluatedKey;
      }

      return docClient.queryAsync(options)
        .catch(function () {
          retries++;
          return store._backoffGetItemsPage(partitionName, keyValue, lastEvaluatedKey, retries);
        });
    },

    _backoffGetItemsPage: function (partitionName, keyValue, lastEvaluatedKey, retries) {
      if (retries <= 10) {
        var delay = 2 ^ retries * 200;
        return Promise.delay(delay)
          .then(function () {
            return store._getItemsPage(partitionName, keyValue, lastEvaluatedKey, retries);
          });
      } else {
        console.log('Could not retrieve page of items', partitionName, keyValue);
        return {};
      }
    },

    saveItems: function (items) {
      var workingItems = items.slice();

      return store._saveItemsInChain(workingItems)
        .then(function () {
          return items;
        });
    },

    _saveItemsInChain: function (items) {
      if (!items.length) {
        return null;
      }

      return store.saveItem(items.pop()).delay(5)
        .then(function () {
          return store._saveItemsInChain(items);
        });
    },

    saveItem: function (item, retryCount) {
      var retries = retryCount || 0,
        options = {
          TableName: tableName,
          Item: item
        };

      return docClient.putAsync(options)
        .then(function () {
          return item;
        })
        .catch(function (error) {
          console.log('Failed to save item. Error:', error);
          console.log('Item:', item);
          retries++;
          return store._backoffSaveItem(item, retries);
        });
    },

    _backoffSaveItem: function (item, retries) {
      if (retries <= 10) {
        var delay = 2 ^ retries * 200;
        return Promise.delay(delay)
          .then(function () {
            return store.saveItem(item, retries);
          });
      } else {
        console.log('Item could not be stored:', item);
        return null;
      }
    }
  };

  return store;
};