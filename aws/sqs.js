var AWS = require('aws-sdk'),
  Promise = require('bluebird');

module.exports = function (region, queueUrl) {
  if (!region || !queueUrl) {
    throw new Error('region and queueUrl are required');
  }

  AWS.config.update({ region: region });
  var sqsClient = new AWS.SQS();
  Promise.promisifyAll(Object.getPrototypeOf(sqsClient));

  var notifier = {
    notify: function (messageObject) {
      var sqsMessage = notifier._setupMessage(messageObject);
      return sqsClient.sendMessageAsync(sqsMessage);
    },

    _setupMessage: function (messageObject) {
      return {
        MessageBody: JSON.stringify(messageObject),
        QueueUrl: queueUrl
      };
    }
  };

  return notifier;
}
