#!/usr/bin/env node

var Canvas = require('canvas'),
    Image = Canvas.Image,
    fs = require('fs'),
    glob = require('glob'),
    queue = require('queue-async'),
    optimist = require('optimist'),
    options = optimist
        .usage('$0 --width --height <images>')
        .options('h', {
            alias: 'help',
            describe: 'Show this help',
            type: 'boolean',
            default: false
        })
        .option('width', {
            describe: 'The pixel width of each tile. This assumes all tiles have equal width',
            demand: true
        })
        .option('height', {
            describe: 'The pixel height of each tile. This assumes all tiles have equal height',
            demand: true
        })
        .argv,
    dir = options._[0],
    top = Infinity,
    bottom = -Infinity,
    left = Infinity,
    right = -Infinity,
    maxId = -Infinity,
    minId = Infinity,
    canvas,
    ctx;

if (options.h) {
    optimist.showHelp();
    process.exit(1);
}

console.log('reading', dir);

fs.readdir(dir, function (error, fileNames) {
    console.log('Found ' + fileNames.length + ' files');
    var fileObjs = fileNames.map(function (fileName) {
        var matches = fileName.match(/(\d+)_(-?\d+)_(-?\d+)/),
            id = Number(matches[1]),
            x = Number(matches[2]),
            y = Number(matches[3]);

        top = Math.min(top, y);
        bottom = Math.max(bottom, y + options.height);
        left = Math.min(left, x);
        right = Math.max(right, x + options.width);

	maxId = Math.max(maxId, id);
	minId = Math.min(minId, id);

        return {
            path: [dir, fileName].join('/').replace(/\/+/, '/'),
            id: id,
            x: x,
            y: y
        };
    })
    console.log(minId, maxId);
    console.log('Dimensions: ', right - left, bottom - top);

    canvas = new Canvas(Math.sqrt(fileNames.length) * options.width, Math.sqrt(fileNames.length) * options.height),
    ctx = canvas.getContext('2d');


var q = queue(3);
fileObjs.forEach(function (fileObj) {
    q.defer(function (callback) {
        fs.readFile(fileObj.path, function (error, data) {
            var img = new Image();
            img.onload = function () {
console.log(fileObj.path);
                var x = fileObj.id % 750;
                var y = (fileObj.id - x) / 750;
                ctx.drawImage(img, x * options.width, y * options.height, img.width, img.height);
                process.stdout.write('.');
                callback();
            }
            img.onerror = function (e) {
console.log(fileObj.path, img, data);
                throw e;
            }
            img.src = data;
        });
    });
});
q.awaitAll(function () {
    fs.writeFile('map.png', canvas.toBuffer(), function () {
        console.log('map.png ('+ (right - left) + 'x'+ (bottom - top) +') written');
    });
});

});
