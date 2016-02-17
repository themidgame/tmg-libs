# tmg-libs #

Contains a set of tools used at themidgame to retrieve, process and store data.

```
// install
npm install git+https://github.com/themidgame/tmg-libs.git

// require
var tmg = require('tmg-libs');
```

## AWS ##
### S3 ###

```
var s3 = tmg.aws.s3(awsRegion);

// download file
s3.getFile(bucketName, key);

// upload file
s3.saveFile(bucketName, key, content);

// list files
s3.listFilesInBucket(bucketName, prefix);
```

### SQS ###

```
var sqs = tmg.aws.sqs(awsRegion, queueUrl);

// send notification
sqs.notify(jsonMessageObject);
```

### DynamoDB ###

```
var dynamo = tmg.aws.dynamo(awsRegion, tableName);

// get items
dynamo.getItemsByPartitionKey(partitionKeyName, partitionKeyValue);

// save items
dynamo.saveItems(items);

// save item
dynamo.saveItem(item);
```

### CloudSearch ###

```
var cloudSearch = tmg.aws.cloudSearch(awsRegion, cloudSearchEndpoint);

// export items to index
cloudSearch.exportItems(items);
```

### Firehose ###

```
var firehose = tmg.aws.firehose(awsRegion, deliveryStreamName);

// save items
firehose.saveItems(items);
```

## YouTube ##
### Video ###

```
var Video = tmg.youtube.video;
var video = new Video(videoId, apiKey);

// get video information
video.getInformation();

// get comments
video.comments.getAll();
```

### Channel ###

```
var Channel = tmg.youtube.channel;
var channel = new Channel(channelId, apiKey);

// get channel information
channel.getInformation();

// get uploads playlist id
channel.getUploadsPlaylistId();

// get playlist items
channel.getPlaylistItems(playlistId);

// get videoIds from playlist
channel.getVideoIdsFromPlaylist(playlistId);
```