const gulp = require('gulp');
const gp = require('gulp-load-plugins')({ lazy: false });
const spritesmith = require('gulp.spritesmith');
const path = require('path');
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
        var spriteData = gulp.src(path.join(dir.path, '*.{png,jpg,gif}'))
          .pipe(spritesmith({
            engine:      'pngsmith',
            imgName:     spriteName + '.png',
            imgPath:     spritesWebRoot + '/' + spriteName + '.png',
            cssName:     'sprite.styl',
            cssFormat:   'stylus',
            cssTemplate: './stylus.template.mustache',
            cssVarMap:   function(sprite) {
              sprite.name = 'sprite-' + sprite.name;
            },
            cssOpts : {
              time : Date.now()
            }
          }));

        spriteData.img.pipe(gulp.dest(spritesFsDir))
          .on('end', function() {
            spriteData.css.pipe(gp.util.buffer(callback));
          });
      }))
    .pipe(gp.addSrc('./mixin.styl'))
    .pipe(gp.concat('sprite.styl'))
    .pipe(gulp.dest(styleFsDir));
  };
};
