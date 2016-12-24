'use strict;'

var libraryFolder = '/Users/BryceD/Documents/cdnlibrary/';
var minutesCacheTime = 15;
var mongoURI = '10.211.55.7';
var mongoPORT = '27017';
var mongoDB = 'testdb';


//Libraries
var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
//var memCache = require('memory-cache');
var timer = require('timers');
var fs = require('fs');
const util = require('util');
const path = require('path');

var option = {encoding: 'utf-8'};

var app = express();

//return file if found
app.use(express.static(libraryFolder));

syncLocalFileLibrary();
timer.setInterval(syncLocalFileLibrary, minutesToMS(minutesCacheTime));

app.get('/refresh', function (request, response) {
    syncLocalFileLibrary();
    response.send('refreshed');
});

app.get('*', function(request, response){
    response.statusCode = 404;
    response.send('file not found');
})

app.listen(3000, function () {
    console.log('express app started on 3000.');
});



function syncLocalFileLibrary() {

    var conn = mongoose.createConnection('mongodb://' + mongoURI + ':' + mongoPORT + '/' + mongoDB);
    conn.on('error', console.error.bind(console, 'connection error:'));
    conn.once('open', function () {

        var gfs = Grid(conn.db);

        //gfs.files.find({'metadata.deleted': false}).toArray(function (err, files) {

        //return all files
        gfs.files.find({}).toArray(function (err, files) {
            if (err) {
                console.log('find files error');
                console.log(err);
            } else {
                console.log('files found:');

                var currentDate = new Date();

                //iterate through files.
                for (x = 0; x < files.length; x++) {

                    var file = path.join(libraryFolder, files[x].filename);

                    if (files[x].metadata.deleted) {
                        //If file is flagged as to delete and exists, delete file.
                        fs.unlink(file, (err) => {
                            if (err) {
                                console.log('file ' + file + '  not found or not readable');
                            } else {
                                console.log('file deleted');
                            }
                        });

                    } else if (files[x].metadata.modifiedDate) {
                        //check if filed modified and needs to be replaced.
                        var modifiedDate = new Date(Date.parse(files[x].metadata.modifiedDate));

                        if (Object.prototype.toString.call(modifiedDate) === "[object Date]") {
                            // it is a date

                            if (isNaN(modifiedDate.getTime())) {  // d.valueOf() could also work
                                // date is not valid
                            } else {
                                // date is valid

                                var fileStat = fs.stat(file, (err, stats) => {
                                    if (err) {
                                        console.log('file ' + file + '  not found or not readable');
                                    } else {
                                        if (stats.ctime < modifiedDate) {
                                            console.log('need to update file: ' + file + '. modified date: ' + modifiedDate + ' - fileChangeTime: ' + stats.ctime);
                                            fs.unlink(file, (err) => {
                                                if (err) {
                                                    console.log('file not found or not deleteable');
                                                } else {
                                                    console.log('file deleted');
                                                }
                                            });
                                        }
                                    }
                                });

                                //TODO: write file
                            }
                        } else {
                            // not a date
                        }

                    } else {
                        //check if file exists

                        fs.stat(file, function (err, stats) {
                            //file not found
                            if (err) {
                                //return console.error('file not found: ' + this.fileName + ' ID: ' + this.fileID + '. Downloading file to library');
                                console.error('file not found: ' + this.fileName + ' ID: ' + this.fileID + '. Downloading file to library');

                                // streaming to gridfs
                                var fileReadStream = gfs.createReadStream({
                                    _id: this.fileID
                                });

                                var newFileName = path.join(libraryFolder, this.fileName);

                                console.log('writeFile: ' + newFileName);
                                var fileWriteStream = fs.createWriteStream(newFileName);

                                fileReadStream.pipe(fileWriteStream);

                                fileReadStream.on('error', function (err) {
                                    console.log('error: ' + err);
                                });

                            }
                        }.bind({fileName: files[x].filename, fileID: files[x]._id}));
                    }
                    console.log('fileName: ' + files[x].filename);

                }
            }
        });

    }, function (err) {
        console.log(err);
        console.log('fin error');
    });

}

function minutesToMS(minutes){
    return minutes * 60 * 1000;
}


function addFileToDB() {
    var conn = mongoose.createConnection('mongodb://' + mongoURI + ':27017/testdb');
    conn.on('error', console.error.bind(console, 'connection error:'));
    conn.once('open', function () {

        var gfs = Grid(conn.db);

        // streaming to gridfs
        var writestream = gfs.createWriteStream();

        var file = path.join(libraryFolder + 'sample.txt');

        var readStream = fs.createReadStream(file);
        readStream.on('error', function (err) {
            console.log('error: ' + err);
        });


        //write the file stream to GridFS
        readStream.on('readable', function () {
            var writestream = gfs.createWriteStream({
                filename: 'sampleFileName', //TODO: make variable
                metadata: {'modifiedDate': null, 'deleted': false}
            });
            readStream.pipe(writestream);
        });
    });

}
