
- Make sprites from each of `*.sprite` directories under the root
- Each sprite is a separate image
- Stylus mixin and config with sprite positions are also supplied
 
Usage:

```js
gulp.task('sprite', taskSprite({
  spritesSearchFsRoot: 'app',
  spritesWebRoot: '/img',
  spritesFsDir: '/path/to/site/www/img',
  styleFsDir: '/path/to/site/app/stylesheets'
}));
```

- `spritesSearchFsRoot` - the source root, sprites are searched as `spritesSearchFsRoot/**/dir.sprite`.
- `spritesWebRoot`: - path in CSS to sprite image will be `/img/dir.png`
- `spritesWebRoot` - generated sprite images will be stored in this dir here.
- `styleFsDir` - stylus file with sprite mixins and coords will be put here


Thanks to @serheyshmyg for discussions and the draft version.