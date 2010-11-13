var ejs = require('ejs'),
    fs = require('fs'),
    path = require('path'),
    templatesPath = './templates/';


function render(name, cnt, callback) {

    var context = cnt | {},
        filePath = path.join(templatesPath, name),
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
                callback(err, null);
                return;
            }

            callback(null, ejs.render(fileData, context));
        }
    );

    rS.on('error',
        function(err) {
            callback(err, null);
        }
    );
}

exports.render = render;

exports.templatesPath = templatesPath;
