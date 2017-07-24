'use strict';

/* global module: false */

//const fs = require( 'fs' );
const _ = require( 'lodash' );
const path = require( 'path' );
//const textReplace = require('grunt-text-replace/lib/grunt-text-replace');

module.exports = function gruntInit( grunt ) {
	// Project configuration.

	const baseDocPath = 'docs';
	const jsLib = [
		'lib/**.js',
	];
	const jsLibCwd = jsLib.map( v => path.relative( 'lib', v ));
	const jsAssets = _.concat([
		'Gruntfile.js',
	], jsLib );

	grunt.initConfig({
		pkg:    grunt.file.readJSON( 'package.json' ),
		uglify: {
			options: {
				preserveComments: 'some',
			},
			dist: {
				options: {
					banner:    '/*! <%= pkg.name %> build on <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %> for v<%= pkg.version %> */',
					sourceMap: false,
					footer:    '/**/',
				},
				files: [
					{
						expand: true,
						src:    [
							'dist/**/*.js',
							'!**/*.min.js',
						],
						cwd:    '.',
						rename: ( dst, src ) => src.replace( /.js$/, '.min.js' ),
					},
				],
			},
		},
		eslint: {
			options: {
				format: 'stylish', //'node_modules/eslint-tap',
				fix:    true,
			},
			strict: {
				options: {
					configFile: 'eslint-es6.json',
				},
				src: jsAssets,
			},
		},
		jsdoc: {
			main: {
				src:     jsLib,
				options: {
					private:     true,
					destination: `${ baseDocPath }`,
					config:	     'jsdoc.json',
					template:    './node_modules/ink-docstrap/template',
					readme:      'README.md',
				},
			},
		},
		babel: {
			options: {
				sourceMap: true,
				presets:   [ 'es2015' ],
			},
			dist: {
				files: [{
					expand: true,
					cwd:    'dist',
					src:    jsLibCwd,
					dest:   'dist/',
					ext:    '.js',
				}],
			},
		},
		browserify: {
			dist: {
				files: {
					'dist/trigger.js': [ 'lib/trigger.js' ],
				},
			},
		},
	});

	// Load the plugin that provides the 'uglify' task.
	grunt.loadNpmTasks( 'grunt-jsdoc' );
	grunt.loadNpmTasks( 'grunt-babel' );
	grunt.loadNpmTasks( 'gruntify-eslint' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-browserify' );

	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask(
		'documentate',
		[
			'jsdoc:main',
		]
	);
	grunt.registerTask(
		'dist',
		[
			'eslint:strict',
			'browserify:dist',
			'babel:dist',
			'uglify:dist',
		]
	);
};
