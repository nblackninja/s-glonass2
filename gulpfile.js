// Подключение модулей
const {
  series,
  parallel,
  src,
  dest
} = require("gulp");

// Папка с исходниками
const SOURCE = "./source/";

// Папка для вывода сборки
const BUILD = "./build/";

// Папка для вывода сборки
const PROD = "./prod/";

// Дополнительный модуль. Он запирает все ошибки в себя, не останавливая работу скрипта
const plumber = require("gulp-plumber");

// POSTCSS делает автопрефиксы
// const postcss = require('gulp-postcss');
// const autoprefixer = require('autoprefixer');

// Минификация CSS
const minify = require("gulp-csso");

// Критический CSS
const critical = require("critical");

// Группировка медиа селекторов
const gcmq = require("gulp-group-css-media-queries");

// Удаляет неиспользуемый CSS
const purgecss = require("gulp-purgecss");

// Минификация селекторов и классов
//const rcs = require("rename-css-selectors");
//const rcs = require("gulp-rcs");

// Минификация HTML
const htmlmin = require("gulp-htmlmin");

const postHTML = require("gulp-posthtml");
const postHTMLLazyLoad = require("posthtml-lazyload");

// Оптимизируем изображения
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminOptipng = require("imagemin-optipng");
const webp = require("gulp-webp");

// Вставка тега picture для webp картинок
//const responsive = require("gulp-responsive");
const webpHTML = require("gulp-webp-html");

// Оптимизация javascript
const uglify = require("gulp-uglify");

// Объединение файлов js
//var concat = require("gulp-concat");

// Переименование
const rename = require("gulp-rename");

// Удаление папок
const del = require("delete");

// Удаляет файл
const cleanfile = require("gulp-clean");

// Замена строки в файле
const replace = require("gulp-replace");

// Копирование файлов
//const copy = require("copy");

// Создание фавикона
const realFavicon = require("gulp-real-favicon");
const fs = require("fs");
const FAVICON_DATA_FILE = "faviconData.json";

// Создание sitemap файла
const sitemap = require("gulp-sitemap");

// Создание zip-архива
//const zip = require("gulp-zip");

// Проверка на изменения
//const changed = require("gulp-changed");

// Деплой файлов на хостинг
//const deployftp = require("gulp-deploy-ftp");
const vinylftp = require("vinyl-ftp");

function cleanbuild(cb) {
  del(BUILD + "*", cb);
}

function cleanprod(cb) {
  del([PROD + "*"], cb);
}

function copyinbuild() {
  return src(
    [
      SOURCE + "css/style.css",
      SOURCE + "js/*.js",
      SOURCE + "img/**/*",
      SOURCE + "*.html",
      SOURCE + "robots.txt",
      SOURCE + ".htaccess",
      SOURCE + "*.php"
    ], {
      base: SOURCE
    }
  ).pipe(dest(BUILD));
}

function copyinprod() {
  return src(
    [
      BUILD + "css/**/*",
      BUILD + "js/**/*",
      BUILD + "*.html",
      BUILD + "*.php",
      BUILD + "robots.txt",
      BUILD + ".htaccess"
    ], {
      base: BUILD
    }
  ).pipe(dest(PROD));
}

function minhtml() {
  return src(BUILD + "**/*.html")
    .pipe(plumber())
    .pipe(
      htmlmin({
        minifyCSS: true,
        minifyJS: true,
        minifyURLs: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true
      })
    )
    .pipe(postHTML(config))
    .pipe(dest(BUILD));
}

const config = () => ({
  plugins: [
    postHTMLLazyLoad({
      loading: "lazy",
      class: "lazy"
    })
  ]
});

function mincss() {
  return src(BUILD + "css/style.css")
    .pipe(plumber())
    .pipe(dest(BUILD + "css/")) // Кидаем исходник в style.css
    .pipe(gcmq())
    .pipe(minify()) // минифицируем style.css
    .pipe(cleanfile())
    .pipe(rename("style.min.css")) // вызываем переименование
    .pipe(dest(BUILD + "css/"));
}

function uncss() {
  return src(BUILD + "css/style.css")
    .pipe(plumber())
    .pipe(replace('@charset "UTF-8";', ""))
    .pipe(
      purgecss({
        content: [BUILD + "*.html", BUILD + "js/*.js"],
        css: [BUILD + "css/style.css"],
        whitelist: ["tns-item", "tns-horizontal", "tns-subpixel"]
      })
    )
    .pipe(dest(BUILD + "css/"));
}

function critcss(cb) {
  critical.generate({
      inline: true,
      minify: true,
      base: BUILD,
      src: "index.html",
      css: [BUILD + "css/style.css"],
      dest: "index.html",
      height: 1920,
      width: 1200,
      timeout: 30000,
      ignore: {
        atrule: ["*::selection"]
      }
    },
    cb
  );
}

function minjs() {
  return src(BUILD + "js/**/*.js")
    .pipe(plumber())
    .pipe(
      uglify({
        toplevel: true
      })
    )
    .pipe(dest(BUILD + "js/"));
}

function minimages() {
  return src(BUILD + "img/**/*")
    .pipe(plumber())
    .pipe(
      imagemin([
        imageminMozjpeg({
          quality: 85,
          progressive: true
        }),
        imageminOptipng({
          optimizationLevel: 2
        }),
        imagemin.gifsicle({
          interlaced: true
        }),
        imagemin.svgo({
          plugins: [{
              removeViewBox: false
            },
            {
              cleanupIDs: false
            }
          ]
        })
      ])
    )
    .pipe(dest(PROD + "img/"));
}

function minicons() {
  return src(PROD + "img/icons/*")
    .pipe(plumber())
    .pipe(
      imagemin([
        imageminOptipng({
          optimizationLevel: 5
        }),
        imagemin.svgo({
          plugins: [{
              removeViewBox: false
            },
            {
              cleanupIDs: false
            }
          ]
        })
      ])
    )
    .pipe(dest(PROD + "img/icons/"));
}

function convertwebp() {
  return src(PROD + "img/*.{jpg,png}")
    .pipe(plumber())
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(PROD + "img/"));
}

function webpinhtml() {
  return src(PROD + "*.html")
    .pipe(plumber())
    .pipe(webpHTML())
    .pipe(dest(PROD));
}

function generatefavicon(cb) {
  realFavicon.generateFavicon({
      masterPicture: PROD + "img/icons/favicon.png",
      dest: PROD + "img/icons",
      iconsPath: "img/icons",
      design: {
        ios: {
          pictureAspect: "noChange",
          assets: {
            ios6AndPriorIcons: true,
            ios7AndLaterIcons: true,
            precomposedIcons: true,
            declareOnlyDefaultIcon: true
          }
        },
        desktopBrowser: {},
        windows: {
          pictureAspect: "noChange",
          backgroundColor: "#da532c",
          onConflict: "override",
          assets: {
            windows80Ie10Tile: true,
            windows10Ie11EdgeTiles: {
              small: true,
              medium: true,
              big: true,
              rectangle: true
            }
          }
        },
        androidChrome: {
          pictureAspect: "noChange",
          themeColor: "#ffffff",
          manifest: {
            display: "standalone",
            orientation: "notSet",
            onConflict: "override",
            declared: true
          },
          assets: {
            legacyIcon: true,
            lowResolutionIcons: false
          }
        },
        safariPinnedTab: {
          pictureAspect: "blackAndWhite",
          threshold: 26.25,
          themeColor: "#5bbad5"
        }
      },
      settings: {
        compression: 5,
        scalingAlgorithm: "Mitchell",
        errorOnImageTooSmall: false,
        readmeFile: false,
        htmlCodeFile: false,
        usePathAsIs: false
      },
      markupFile: FAVICON_DATA_FILE
    },
    cb
  );
}

function injectfaviconmarkups() {
  return src([PROD + "*.html"])
    .pipe(plumber())
    .pipe(
      realFavicon.injectFaviconMarkups(
        JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code
      )
    )
    .pipe(dest(PROD));
}

function generatesitemap() {
  return src(PROD + "**/*.html", {
      read: false
    })
    .pipe(plumber())
    .pipe(
      sitemap({
        siteUrl: "https://glonassn1.ru",
        changefreq: "daily",
        images: true
      })
    )
    .pipe(dest(PROD));
}

function getFtpConnection() {
  return vinylftp.create({
    host: "ruvip29.hostiman.ru",
    port: 21,
    user: "progame1",
    password: "9ken1Pw7Y4",
    parallel: 10
  });
}

function deployftp() {
  var conn = getFtpConnection();
  return src([PROD + "/**/*"], {
      base: PROD,
      buffer: false
    })
    .pipe(conn.newer("www/glonassn1.ru/2"))
    .pipe(conn.dest("www/glonassn1.ru/2"));
}

exports.build = series(
  cleanbuild,
  copyinbuild,
  uncss,
  critcss,
  parallel(minhtml, mincss, minjs),
);

exports.prod = series(
  cleanprod,
  parallel(copyinprod, minimages),
  parallel(convertwebp, webpinhtml),
);

exports.deploy = series(deployftp);

// function concatjs() {
//   return src([BUILD + "js/anchor.js", BUILD + "js/menu.js"])
//     .pipe(plumber())
//     .pipe(concat("common.js"))
//     .pipe(dest(BUILD + "js/"))
// }

// const picture = require("gulp-picture");

// const breakpoints = [
//   {
//     width: 200,
//     rename: {
//       suffix: "-small"
//     }
//   },
//   {
//     width: 400,
//     rename: {
//       suffix: "-large"
//     }
//   },
//   {
//     width: 1280,
//     rename: {
//       suffix: "-extralarge"
//     }
//   },
//   {
//     rename: {
//       suffix: "-original"
//     }
//   }
// ];

// function responsivehtml() {
//   return src(BUILD + "*.html")
//     .pipe(
//       picture({
//         breakpoints
//       })
//     )
//     .pipe(dest(BUILD));
// }

// function responsiveimages() {
//   return src(BUILD + "img/*.{jpg, png}")
//     .pipe(plumber())
//     .pipe(
//       responsive(
//         {
//           "*": [
//             {
//               // image-small.jpg is 200 pixels wide
//               width: 200,
//               rename: {
//                 suffix: "-small",
//                 extname: ".jpg"
//               }
//             },
//             {
//               // image-large.jpg is 480 pixels wide
//               width: 480,
//               rename: {
//                 suffix: "-large",
//                 extname: ".jpg"
//               }
//             },
//             {
//               // image-extralarge.jpg is 1280 pixels wide
//               width: 1280,
//               rename: {
//                 suffix: "-extralarge",
//                 extname: ".jpg"
//               }
//             },
//             {
//               // image-small.webp is 200 pixels wide
//               width: 200,
//               rename: {
//                 suffix: "-small",
//                 extname: ".webp"
//               }
//             },
//             {
//               // image-large.webp is 480 pixels wide
//               width: 480,
//               rename: {
//                 suffix: "-large",
//                 extname: ".webp"
//               }
//             },
//             {
//               // image-extralarge.webp is 1280 pixels wide
//               width: 1280,
//               rename: {
//                 suffix: "-extralarge",
//                 extname: ".webp"
//               }
//             }
//           ]
//         },
//         {
//           quality: 70,
//           progressive: true,
//           compressionLevel: 6,
//           withMetadata: false
//         }
//       )
//     )
//     .pipe(dest(BUILD + "img/"));
// }

// function deployftp2() {
//   return src('/build/build.zip')
//     .pipe(deployftp({
//         remotePath: '/www/rssk.tk/test.rssk.tk/',
//         host: 'ruvip29.hostiman.ru',
//         port: 21,
//         user: 'progame1',
//         pass: '9ken1Pw7Y4'
//       })
//       .pipe(dest('/build')));
// }

// function zipFiles() {
//   return src(SOURCE + "*")
//     .pipe(plumber())
//     .pipe(zip("build.zip"))
//     .pipe(dest(BUILD));
// }

// function renameclasses(cb) {
//   rcs.process.auto(
//     [BUILD + "css/*.css", BUILD + "js/*.js", BUILD + "*.html"], {
//       overwrite: true,
//       CWD: BUILD,
//       newPath: ""
//     },
//     cb
//   );
// }

// function renameclasses() {
//   return src([BUILD + "**/*.css", BUILD + "**/*.js", BUILD + "**/*.html"])
//     .pipe(plumber())
//     .pipe(
//       rcs({
//         excludeFile: ["**/tiny-slider.js"],
//         exclude: ["slider__wrapper", "slider__wrapper2"]
//       })
//     )
//     .pipe(dest(BUILD));
// }

/*
очистка build -> изменились файлы ? минификация(html, css, js, images) -> отправка на сервер / создания архива
*/

/* // Описание таска
gulp.task("style", function() {
  gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({browsers: [
        "last 2 versions"
      ]}),
      mqpacker({
        sort: true
      })
    ]))
    .pipe(gulp.dest("build/css"))   //Кидаем исходник в style.css
    .pipe(minify())                 //минифицируем style.css
    .pipe(rename("style.min.css"))  //вызываем переименование
    .pipe(gulp.dest("build/css"))   //еще раз кидаем в style.css
    .pipe(server.stream());         //Команда перезагрузки сервера в браузере
});
*/

// Перед тем как таск serve стартует должен быть запущен style
// gulp.task("serve", function() {
// server.init({
// server: "build/",
// });
// gulp.watch("sass/**/*.scss", ["style"]);
// gulp.watch("*.html", ["html:update"]);
// });

// function copyHTML() {
//   return src('./source/*.html')
//     .pipe(plumber())
//     .pipe(dest('./build/'));
// }
