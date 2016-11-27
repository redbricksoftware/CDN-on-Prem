var express = require("express");
var fs = require("fs");

var app = express();

var option = { encoding: "utf-8" };
var libraryFolder = '/Users/BryceD/Documents/cdnlibrary/';

app.use(express.static(libraryFolder));

app.get("/", function (request, response) {
    response.send("CDN Home");
});

app.get("/refresh", function(request, response) {
    refreshLibrary();
    response.send("refreshed");
});

app.listen(3000, function() {
    console.log("express app started on 3000.");
});


refreshLibrary = function() {
    console.log("refresh");
    fs.readdir(libraryFolder, function( err, files ) {
        if( err ) {
            console.error( "Could not list the directory.", err );
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
    } );
}