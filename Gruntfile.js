module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      deploy: {
        src: [
          'css/**',
          'frag/**',
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
    watch: {
      testapp: {
        files: [ 'frag/**/*.html' ],
        tasks: [ 'preload' ],
        options: {
          spawn: false,
        }
      }
    }
  });

  grunt.loadTasks('./grunt');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', [ 'copy' ]);
  grunt.registerTask('preload', [ 'fragment_preload' ]);
};