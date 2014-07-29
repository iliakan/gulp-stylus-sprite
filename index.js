const gulp = require('gulp');
const path = require('path');
const gp = require('gulp-load-plugins')();
const spritesmith = require('gulp.spritesmith');
const es = require('event-stream');
const assert = require('assert');
const fs = require('fs');
const fse = require('fs-extra');

module.exports = function(options) {
  const spritesSearchFsRoot = options.spritesSearchFsRoot; // where in FS to look for sprites
  const spritesWebRoot = options.spritesWebRoot; // CSS-path from CSS to a sprite
  const spritesFsDir = options.spritesFsDir; // where to write sprites
  const styleFsDir = options.styleFsDir; // where to write style

  assert(spritesSearchFsRoot);
  assert(spritesWebRoot);
  assert(spritesFsDir);
  assert(styleFsDir);

  fse.ensureDirSync(spritesFsDir);
  fse.ensureDirSync(styleFsDir);

  return function() {

    return gulp.src(path.join(spritesSearchFsRoot, '**/*.sprite'))
      .pipe(es.map(function(dir, callback) {
        var spriteName = path.basename(dir.path).replace('.sprite', '');

        var imgName = spriteName + '.png';
        var imgCssPath = spritesWebRoot + '/' + imgName;

        var logged = false;

        // if .styl does not exist, use if for gp.newer (=force sprite regen)
        // otherwise compare with sprite.png
        var newerCompareDst = fs.existsSync(path.join(styleFsDir, spriteName + '.styl')) ?
          path.join(spritesFsDir, imgName) :
          path.join(styleFsDir, spriteName + '.styl');


        var time = Date.now();
        var anySprite;
        var spriteData = gulp.src(path.join(dir.path, '*.{png,jpg,gif}'))
          // only make sprite if no newer file exist
          .pipe(gp.newer(newerCompareDst))
          .pipe(es.through(function(image) {
            if (!logged) {
              gp.util.log("Making " + spriteName);
              logged = true;
            }
            this.emit('data', image)
          }))
          .pipe(spritesmith({
            engine:      'pngsmith',
            imgName:     imgName,
            imgPath:     imgCssPath,
            cssName:     spriteName + '.styl',
            cssFormat:   'stylus',
            cssTemplate: path.join(__dirname, 'stylus.template.mustache'),
            cssVarMap:   function(sprite) {
              sprite.name = spriteName + '-' + sprite.name;
              sprite.image = sprite.image + '?time=' + time;
              anySprite = sprite;
              return sprite;
            }
          }));

        spriteData.img
          .pipe(gp.ignore.exclude(function(file) {
            return file.contents.length == 0;
          }))
          .pipe(gulp.dest(spritesFsDir))
          .on('end', function() {
            spriteData.css
              .pipe(gp.util.buffer(function(err, files) {
              if (err) return callback(err);
              var styl = files[0]; // always single file comes from css

              if (styl.contents.length == 0) {
                return callback();
              }

              // add full-image data
              styl.contents = new Buffer(styl.contents.toString() + "\n$" + spriteName + " = " +
                anySprite.total_width + 'px ' + anySprite.total_height + 'px ' +
                "'" + anySprite.image + "'");

              callback(null, styl); // only one css-file
            }));
          });

      }))
      // mixin.styl will be always copied if no sprite is made, but that's a small file, perf penalty is small
//      .pipe(gp.addSrc(path.join(__dirname, 'mixin.styl')))
      .pipe(gulp.dest(styleFsDir))
  };
};
