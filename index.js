#!/usr/bin/env node

var Canvas = require('canvas'),
    Image = Canvas.Image,
    fs = require('fs'),
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
    files = options._,
    top = Infinity,
    bottom = 0,
    left = Infinity,
    right = 0,
    canvas,
    ctx;

if (options.h) {
    optimist.showHelp();
    process.exit(1);
}

files.forEach(function (fileName) {
    matches = fileName.match(/(\d+)_(\d+)/),
        x = Number(matches[1]);
        y = Number(matches[2]);

    top = Math.min(top, y);
    bottom = Math.max(bottom, y + options.height);
    left = Math.min(left, x);
    right = Math.max(right, x + options.width);
})

canvas = new Canvas(right - left, bottom - top),
ctx = canvas.getContext('2d');

Seq(files)
    .parEach(function (fileName) {
        var cb = this;

        fs.readFile(__dirname + '/' + fileName, function(err, src){
            if (err) {
                throw err
            };
            var matches = fileName.match(/(\d+)_(\d+)/),
                x = Number(matches[1]),
                y = Number(matches[2]);

            process.stdout.write('.');

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
