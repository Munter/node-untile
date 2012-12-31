#!/usr/bin/env node

var Canvas = require('canvas'),
    Image = Canvas.Image,
    fs = require('fs'),
    Progress = require('progress'),
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
console.log('Reading tile directory');
fs.readdir(dir, function (error, fileNames) {
    var fileObjs = fileNames.map(function (fileName) {
            var matches = fileName.match(/([\w\d]+)_(-?\d+)_(-?\d+)/),
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
        }),
        width = Math.sqrt(fileNames.length) * options.width,
        height = Math.sqrt(fileNames.length) * options.height;

    canvas = new Canvas(width, height),
    ctx = canvas.getContext('2d');

    var bar = new Progress('Injecting tiles: :current of :total [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: fileNames.length,
    });

    var q = queue(30);
    fileObjs.forEach(function (fileObj) {
        q.defer(function (callback) {
            fs.readFile(fileObj.path, function (error, data) {
                var img = new Image();
                img.onload = function () {
                    var x = (fileObj.id * options.width) % width;
                    var y = ((fileObj.id * options.width) - x) / width * options.height;
                    ctx.drawImage(img, x, y, img.width, img.height);
                    bar.tick(1);
                    callback();
                }
                img.onerror = function (e) {
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
