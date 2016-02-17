var google = require('googleapis'),
  youtube = google.youtube('v3'),
  merge = require('merge'),
  Paginator = require('./libs/paginator'),
  Promise = require('bluebird');

Promise.promisifyAll(youtube.videos);

function Video(videoId, channelId, apiKey) {
  if (!videoId || !channelId || !apiKey) {
    throw new Error('videoId, channelId and apiKey are required');
  }

  this.videoId = videoId;
  this.channelId = channelId;
  this.apiKey = apiKey;
  var video = this;

  this.getInformation = function () {
    var options = {
      key: video.apiKey,
      id: video.videoId,
      part: 'snippet,contentDetails'
    };

    return youtube.videos.listAsync(options)
      .then(function (response) {
        return response.items[0];
      });
  }

  this.comments = {
    _getCommentThreads: function () {
      var options = {
        key: video.apiKey,
        videoId: video.videoId,
        part: 'id,snippet',
        textFormat: 'plainText',
        maxResults: 100
      };

      var paginator = new Paginator({
        endpoint: 'commentThreads.list',
        mergePages: true,
        params: options
      });

      return paginator.getAllPages()
        .then(function (threadsResponse) {
          return threadsResponse.items;
        });
    },

    _getRepliesForCommentThread: function (commentThread) {
      if (commentThread.snippet.totalReplyCount == 0) {
        return Promise.resolve([]);
      }

      var options = {
        key: video.apiKey,
        part: 'id,snippet',
        maxResults: 100,
        textFormat: 'plainText',
        parentId: commentThread.snippet.topLevelComment.id
      };

      var paginator = new Paginator({
        endpoint: 'comments.list',
        mergePages: true,
        params: options
      });

      return paginator.getAllPages()
        .then(function (commentsResponse) {
          return commentsResponse.items;
        });
    },

    _addRepliesToCommentThread: function (commentThread, retryCount) {
      var retries = retryCount || 0;

      return video.comments._getRepliesForCommentThread(commentThread)
        .then(function (comments) {
          commentThread.replies = {
            comments: comments
          };

          return commentThread;
        })
        .catch(function () {
          retries++;
          return video.comments._backoffAddRepliesToCommentThread(commentThread, retries);
        });
    },

    _backoffAddRepliesToCommentThread: function (commentThread, retries) {
      if (retries <= 10) {
        var delay = 2 ^ retries * 200;
        return Promise.delay(delay)
          .then(function () {
            return video.comments._addRepliesToCommentThread(commentThread, retries);
          });
      } else {
        throw new Error('Replies could not be retrieved');
      }
    },

    _addRepliesToCommentThreads: function (commentThreads) {
      var promises = commentThreads.map(function (commentThread) {
        return video.comments._addRepliesToCommentThread(commentThread);
      });

      return Promise.all(promises);
    },

    _getCommentsArrayFromCommentThreads: function (commentThreads) {
      var comments = [];

      commentThreads.forEach(function (commentThread) {
        var topLevelComment = commentThread.snippet.topLevelComment,
          commentReplies = commentThread.replies.comments;

        topLevelComment.snippet.channelId = video.channelId;
        topLevelComment.snippet.videoId = video.videoId;

        commentReplies.forEach(function (reply) {
          reply.snippet.channelId = video.channelId;
          reply.snippet.videoId = video.videoId;
        });

        comments.push(topLevelComment);
        comments.push.apply(comments, commentReplies);
      });

      return comments;
    },

    getAll: function () {
      return video.comments._getCommentThreads()
        .then(video.comments._addRepliesToCommentThreads)
        .then(video.comments._getCommentsArrayFromCommentThreads);
    }
  };
}

module.exports = Video;