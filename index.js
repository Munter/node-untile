#!/usr/bin/env node

var Canvas = require('canvas'),
    Image = Canvas.Image,
    fs = require('fs'),
    glob = require('glob'),
    Seq = require('seq'),
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
            name: fileName,
            id: id,
            x: x,
            y: y
        };
    })
    console.log(minId, maxId);
    console.log('Dimensions: ', right - left, bottom - top);

    canvas = new Canvas(right - left, bottom - top),
    ctx = canvas.getContext('2d');

    Seq(fileObjs)
        .parEach(function (fileObj) {
            var cb = this;

            process.stdout.write('.');

            fs.readFile(fileObj.name, function(err, src){
                if (err) {
                    throw err
                };

                var img = new Image;
                img.src = src;
                ctx.drawImage(img, x - left, y - top, img.width, img.height);
                cb();
            });
        })
        .seq(function () {
            var cb = this;
            process.stdout.write('\n');
            fs.writeFile('map.png', canvas.toBuffer(), function () {
                console.log('map.png ('+ (right - left) + 'x'+ (bottom - top) +') written');
                cb();
            });
        });
});

