module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['*.js', '!bower-components', '!node-modules'],
      options: {
        globals: {
          jQuery: false
        }
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Dependency Management Tasks
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    shell: {
      bowerInstall: {
        command: 'bower install -p'
      },
      bowerInstallBuild: {
        command: 'bower install'
      }
    },

    sync: {
      arcgis: {
        cwd: '.',
        src: [
          'arcgis.js'
        ],
        expand: true,
        dest: 'node_modules/arcgis-rest-client/lib',
        verbose: true
      }
    }
  });
  // end task config

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task
  grunt.registerTask('default', ['shell:bowerInstall', 'sync:arcgis', 'jshint']);

};