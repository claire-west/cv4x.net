module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      deploy: {
        src: [
          'css/**',
          'frag/**',
          'font/**',
          'html/**',
          'img/**',
          'js/**',
          'json/**',
          '*.html',
          '*.ico',
          'sitemap.txt'
        ],
        dest: 'deploy/',
        expand: true
      }
    },
    fragment_preload: {
      options: {
        dest: 'js/fragPreload.js'
      },
      files: {
        src: [
          'frag/**/*.html',
          '!frag/blog/*'
        ],
        dest: 'js/',
        expand: true
      }
    },
    uglify: {
      app: {
        expand: true,
        src: [ 'js/**/*.js' ],
        dest: 'build'
      },
      frag: {
        expand: true,
        src: [ 'frag/**/*.js' ],
        dest: 'build'
      }
    },
    js_preload: {
      app: {
        options: {
          dest: 'js/',
          namespace: 'app'
        },
        cwd: 'build',
        src: [ 'js/**/*.js' ],
        expand: true
      },
      frag: {
        options: {
          dest: 'frag/js/',
          namespace: 'frag'
        },
        cwd: 'build',
        src: [ 'frag/**/*.js' ],
        expand: true
      }
    },
    watch: {
      testapp: {
        files: [
          'frag/**/*.html',
          'template/**',
          'js/**/*.js',
          'frag/**/*.js',
          '!frag/blog/*' ],
        tasks: [ 'preload' ],
        options: {
          spawn: false,
        }
      }
    }
  });

  grunt.loadTasks('./grunt');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', [ 'preload', 'copy' ]);
  grunt.registerTask('preload', [ 'fragment_preload', 'uglify:app', 'uglify:frag', 'js_preload:app', 'js_preload:frag' ]);
};
