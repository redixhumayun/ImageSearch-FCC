var express = require('express');
var request = require('request');
var fs = require('fs');
var stream = require('stream');
var util = require('util');
var Filter = require('./transform.js');
var mongo = require('mongodb').MongoClient;

var Transform = stream.Transform;

var app = express();

var url = 'mongodb://localhost:27017/myproject';

var PORT = process.env.PORT;

app.get('/', function(req, res) {
    res.json('Enter your query parameters for an image search like so: https://fcc-imagesearch-redixhumayun.c9users.io/imagesearch/cats?count=30&offset=20 and for the latest search results enter the url https://api.cognitive.microsoft.com/bing/v5.0/images/*');
});

app.get('/imagesearch/:image*', function(req, res) {
    var result = '';
    var final_array = []; //array variable to return the results to user
    var obj = {};
    var offset = 0;

    //connecting to mongodb client here
    mongo.connect(url, function(err, db) {
        if (err) {
            throw err;
        }
        console.log('Connected to mongo server');
        db.createCollection('requests', {
            autoIndexId: true
        });
        var today = new Date();
        var day = today.getDate();
        var month = today.getMonth() + 1;
        var year = today.getFullYear();
        var date = day + '/' + month + '/' + year;
        db.collection('requests').insert({
            'search': req.params.image,
            'when': date
        }, function(err, document) {
            if (err) {
                throw err
            }
            console.log(document);
        });
        //db.close();
    });

    if (parseInt(req.query.offset) > 0 && parseInt(req.query.offset) < parseInt(req.query.count)) {
        offset = req.query.offset;
    }
    var options = {
        url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=' + req.params.image + '&count=' + req.query.count + '&offset=' + offset,
        headers: {
            'Ocp-Apim-Subscription-Key': '17c6f5fcfe3547329a6b253199c4f6dc'
        }
    };
    request
        .get(options)
        .on('error', function(err) {
            console.log(err);
        })
        .on('response', function(response) {
            console.log('response is submitted');
        })
        .on('data', function(chunk) {
            result += chunk;
        })
        .on('end', function() {
            var result_obj = JSON.parse(result);
            for (var i = 0; i < result_obj.value.length; i++) {
                var response_obj = new Filter(['name', 'datePublished', 'contentSize', 'hostPageDisplayUrl', 'encodingFormat', 'width', 'height', 'thumbnail', 'imageInsightsToken', 'insightsSourcesSummary', 'imageId', 'accentColor'], {
                    objectMode: true
                });


                response_obj.on('readable', function() {
                    var obj;
                    while (null !== (obj = response_obj.read())) {
                        final_array.push(obj);
                    }
                });

                response_obj.write(result_obj.value[i]);
                response_obj.end();
            }
            res.send(final_array);

        });
});

app.get('/latest/imagesearch', function(req, res) {
    retrieve().then(function(data){
       res.send(data); 
    });
});


app.listen(PORT, function() {
    console.log('Express listening on: ' + PORT);
});

function retrieve(callback) {
    var search_array = [];
    return new Promise(function(resolve, reject) {
        mongo.connect(url, function(err, db) {
            if (err) {
                throw err;
            }
            console.log('Retrieving documents');
            db.collection('requests').find({}, {'_id':0}).toArray().then(function(data) {
                resolve(data);
            });
        });
    });

}