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
		'tests/index.js',
	], jsLib );

	grunt.initConfig({
		pkg:    grunt.file.readJSON( 'package.json' ),
		uglify: {
			options: {
				output: {
					comments: 'some',
				},
			},
			dist: {
				options: {
					sourceMap: false,
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
				presets:   [[ 'env', {
					modules: false,
					targets: {
						browsers: '>= 1%',
					},
				}]],
			},
			dist: {
				options: {
					plugins: [
						[ '@comandeer/babel-plugin-banner', {
							banner: `/**
* @file <%= pkg.name %>
* 
* <%= pkg.description %>
* Built on <%= grunt.template.today("yyyy-mm-dd hh:MM:ss") %>
*
* @license <%= pkg.license %>
* @version <%= pkg.version %>
* @author <%= pkg.author %>
*/`,
						}],
					],
				},
				files: [{
					expand: true,
					cwd:    'dist',
					src:    jsLibCwd,
					dest:   'dist/',
					ext:    '.js',
				}],
			},
			test: {
				options: {
					sourceMap: false,
				},
				files: [{
					expand: true,
					cwd:    'test',
					src:    [ 'index.js' ],
					dest:   'test/browser',
					ext:    '-es5.js',
				}],
			},
		},
		browserify: {
			dist: {
				src:     [ 'lib/sequential-event.js' ],
				dest:    'dist/sequential-event.js',
				options: {
					browserifyOptions: {
						standalone: 'SequentialEvent',
					},
				},
			},
			test: {
				src:     [ 'test/browser/index-es5.js' ],
				dest:    'test/browser/index.js',
				options: {
					exclude: [ './selenium.js', 'expect.js', '../index' ],
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

	grunt.registerTask( 'documentate', [
		'jsdoc:main',
	]);
	grunt.registerTask( 'dist', [
		'eslint:strict',
		'browserify:dist',
		'babel:dist',
		'uglify:dist',
	]);
	grunt.registerTask( 'refreshTests', [
		'babel:test',
		'browserify:test',
	]);
};
