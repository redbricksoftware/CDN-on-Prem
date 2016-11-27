var express = require("express");
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var fs = require("fs");

var app = express();

var option = {encoding: "utf-8"};
var libraryFolder = '/Users/BryceD/Documents/cdnlibrary/';

app.use(express.static(libraryFolder));

app.get("/", function (request, response) {
    response.send("CDN Home");
});

app.get("/refresh", function (request, response) {
    refreshLibrary();
    response.send("refreshed");
});

app.listen(3000, function () {
    console.log("express app started on 3000.");
});


refreshLibrary2 = function () {
    console.log("refresh");
    fs.readdir(libraryFolder, function (err, files) {
        if (err) {
            console.error("Could not list the directory.", err);
            //process.exit( 1 );
        }
        else {

            files.forEach(function (file, index) {
                // Make one pass and make the file complete
                //var fromPath = path.join(moveFrom, file);
                //var toPath = path.join(moveTo, file);
                console.log(file);
            });
        }
    });
};

var mongoURI = '10.211.55.3';
var mongoPORT = '';
refreshLibrary = function () {
    //mongoose.connect('mongodb://localhost/test');


    var conn = mongoose.createConnection('mongodb://' + mongoURI + ':27017/testdb');
    conn.on('error', console.error.bind(console, 'connection error:'));
    conn.once('open', function () {


            var gfs = Grid(conn.db);

            //gfs.files.find({'metadata.deleted': false}).toArray(function (err, files) {
            //return all files
            gfs.files.find({}).toArray(function (err, files) {
                if (err) {
                    console.log(err);
                }
                for (x = 0; x < files.length; x++) {
                    console.log(files[x]);
                    if (files[x].metadata) {
                        if (files[x].metadata.deleted) {
                            fs.unlink(libraryFolder + files[x].filename, function (err) {
                                if (err) {
                                    console.log('file does not exist');
                                    //console.log(err);
                                } else {
                                    console.log('file deleted successfully');
                                }
                            });
                        }

                    }
                }
            });

            /*console.log('totally connected!');

             //TODO: don't write a file, setup a URL to write the file and check if file already in GridFS before overwriting
             //display all files in dir
             fs.readdir(libraryFolder, function (err, files) {
             if (err) {
             console.error("Could not list the directory.", err);
             }
             else {

             files.forEach(function (file, index) {
             console.log(file);
             });
             }
             });

             //Library location
             console.log(libraryFolder);

             // streaming to gridfs
             var writestream = gfs.createWriteStream();
             var readStream = fs.createReadStream(libraryFolder + 'sample.txt');
             readStream.on('error', function(err){
             console.log('error: ' + err);
             });

             //write the file stream to GridFS
             readStream.on('readable', function () {
             var writestream = gfs.createWriteStream({
             filename: 'sampleFileName', //TODO: make variable
             metadata: {'modifiedDate':null, 'deleted': false}
             });
             readStream.pipe(writestream);
             });*/


            conn.close();
        },
        function (err) {
            console.log(err);
        }
    );

};

