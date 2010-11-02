var ejs = require('ejs'),
    fs = require('fs'),
    path = require('path');


exports.templatesPath = './templates/';


exports.render = function(name, cnt, callback) {

    var context = cnt | {},
        filePath = path.join(exports.templatesPath, '/index.html'),
        rS = fs.createReadStream(filePath),
        fileData = '';

    rS.on('data',
        function(data) {
            fileData += data;
        }
    );

    rS.on('end',
        function(err) {
            if(err) {
                console.log(err);
                throw err;
            }

            callback(ejs.render(fileData, context));
        }
    );
}


