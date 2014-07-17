const gulp = require('gulp');
const path = require('path');
const gp = require('gulp-load-plugins')({
  config: path.join(__dirname, 'package.json')
});
const spritesmith = require('gulp.spritesmith');
const es = require('event-stream');
const assert = require('assert');

module.exports = function(options) {
  const spritesSearchFsRoot = options.spritesSearchFsRoot; // where in FS to look for sprites
  const spritesWebRoot = options.spritesWebRoot; // CSS-path from CSS to a sprite
  const spritesFsDir = options.spritesFsDir; // where to write sprites
  const styleFsDir = options.styleFsDir; // where to write style

  assert(spritesSearchFsRoot);
  assert(spritesWebRoot);
  assert(spritesFsDir);
  assert(styleFsDir);

  return function() {

    return gulp.src(path.join(spritesSearchFsRoot, '**/*.sprite'))
      .pipe(es.map(function(dir, callback) {
        var spriteName = path.basename(dir.path).replace('.sprite', '');

        var imgName = spriteName + '.png';
        var imgCssPath = spritesWebRoot + '/' + imgName;

        var logged = false;

        var spriteData = gulp.src(path.join(dir.path, '*.{png,jpg,gif}'))
          // only make sprite if no newer file exist
          .pipe(gp.newer(path.join(spritesFsDir, imgName)))
          .pipe(es.through(function (image) {
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
            cssVarMap: function(sprite) {
              sprite.name = spriteName + '-' + sprite.name;
              return sprite;
            },
            cssOpts:     {
              time: Date.now()
            }
          }));

        spriteData.img.pipe(gulp.dest(spritesFsDir))
          .on('end', function() {
            spriteData.css.pipe(gp.util.buffer(function(err, files) {
              if (err) return callback(err);
              var styl = files[0]; // always single file comes from css
              if (!styl.contents.length) { // if no sprite is made (newer exists) then file is empty
                // so we skip it
                return callback();
              }
              // otherwise pass it down the stream
              callback(null, styl); // only one css-file
            }));
          });
      }))
      // mixin.styl will be always copied if no sprite is made, but that's a small file, perf penalty is small
      .pipe(gp.addSrc(path.join(__dirname, 'mixin.styl')))
      .pipe(gulp.dest(styleFsDir))
  };
};
