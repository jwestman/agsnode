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
    }
  });
  // end task config

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task
  grunt.registerTask('default', ['shell:bowerInstall', 'jshint']);

};