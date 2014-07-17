var path = require("path");

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-gitbook');
    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-http-server');

    grunt.initConfig({
        'gitbook': {
            development: {
                input: "./",
                title: "德语每天学习一点点",
                description: "沪江小猪《德语每天学习一点点》栏目",
                github: "Frederick-S/Learn-German-Everyday"
            }
        },
        'gh-pages': {
            options: {
                base: '_book'
            },
            src: ['**']
        },
        'clean': {
            files: '_book'
        },
        'http-server': {
            'dev': {
                // the server root directory
                root: '_book',

                port: 4000,
                host: "127.0.0.1",

                showDir : true,
                autoIndex: true,
                defaultExt: "html",

                //wait or not for the process to finish
                runInBackground: false
            }
        }
    });

    grunt.registerTask('test', [
        'gitbook',
        'http-server'
    ]);
    grunt.registerTask('publish', [
        'gitbook',
        'gh-pages',
        'clean'
    ]);
    grunt.registerTask('default', 'gitbook');
};
