'use strict';

/* global module: false */

//const fs = require( 'fs' );
const _ = require( 'lodash' );
//const textReplace = require('grunt-text-replace/lib/grunt-text-replace');

module.exports = function gruntInit( grunt ) {
	// Project configuration.

	const baseDocPath = 'docs';
	const jsAssets = [
		'Gruntfile.js',
		'lib/**.js',
	];

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
							'!**/*.min.js'
						],
						cwd:    '.',
						rename: ( dst, src ) => src.replace( /.js$/, '.min.js' ),
					},
				],
			},
		},
		copy: {
			dist: {
				files: [
					{
						expand: true,
						src:    [ '**/*.js' ],
						cwd:    'js/dependencies',
						dest:   'dist/dependencies',
						//rename: ( dst, src ) => dst + '/' + src.replace( /(\.min)?.js$/, '.min.js' ),
					},
				],
			},
		},
		eslint: {
			options: {
				format: 'stylish', //'node_modules/eslint-tap',
				fix:    true,
			},
			info: {
				options: {
					configFile: 'eslint-es6-browser.json',
					silent:     true,
				},
				src: jsAssets,
			},
			strict: {
				options: {
					configFile: 'eslint-es6-browser.json',
				},
				src: jsAssets,
			},
		},
		docco_husky: {
			files: {
				expand: true,
				src:    jsAssets,
			},
			project_name: 'AltCore',
			output_dir:   `${ baseDocPath }/docco`,
		},
		jsdoc: {
			src:     jsAssets,
			options: {
				private:     true,
				destination: `${ baseDocPath }/jsdoc`,
				config:	     'jsdoc.json',
				template:    './node_modules/ink-docstrap/template',
				readme:      'README-jsdoc.md',
			},
		},
		babel: {
			options: {
				sourceMap: true,
				presets:   [ 'es2015' ],
			},
			dist: {
				files: [{
					'expand': true,
					'cwd':    'js/',
					'src':    [
						'**/*.js',
						'!dependencies/**/*.js',
					],
					'dest': 'dist/',
					'ext':  '.js',
				}],
			},
		},
		lesslint: {
			info: _.merge({}, lesslint, {
				options: {
					failOnWarning: false,
				},
			}),
			strict: _.merge({}, lesslint, {
				options: {
					failOnWarning: true,
				},
			}),
		},
		less: {
			dist: {
				files:   lessFiles,
				options: {
					plugins: [
						new ( require( 'less-plugin-autoprefix' ))({
							browsers: 'last 2 versions',
						}), // add vendor prefixes
						new ( require( 'less-plugin-clean-css' ))({
							advanced: true,
						}),
					],
				},
			},
		},
		markdown: {
			index: {
				files: [
					{
						src:  'README.md',
						dest: 'docs/index.html',
						ext:  '.html',
					},
				],
				options: {
					//template: 'myTemplate.jst',
					preCompile: function( src, context ) {
					},
					postCompile: function( src, context ) {
					},
					templateContext:    {},
					contextBinder:      false,
					contextBinderMark:  '@@@',
					autoTemplate:       true,
					autoTemplateFormat: 'jst',
					markdownOptions:    {
						gfm:       true,
						highlight: 'manual',
						codeLines: {
							before: '<span>',
							after:  '</span>',
						},
					},
				},
			},
		},
	});

	// Load the plugin that provides the 'uglify' task.
	grunt.loadNpmTasks( 'grunt-jsdoc' );
	grunt.loadNpmTasks( 'grunt-docco-husky' );
	grunt.loadNpmTasks( 'grunt-markdown' );
	grunt.loadNpmTasks( 'gruntify-eslint' );
	grunt.loadNpmTasks( 'grunt-lesslint' );
	grunt.loadNpmTasks( 'grunt-contrib-less' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );

	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask(
		'documentate',
		[
			'markdown:index',
			'jsdoc',
			'docco_husky',
		]
	);
	grunt.registerTask(
		'refreshStyles',
		[
			'lesslint:info',
			'less:dist',
		]
	);
	grunt.registerTask(
		'refreshScripts',
		[
			'eslint:info',
			'babel:dist',
			'uglify:dist',
			'copy:dist',
		]
	);
	grunt.registerTask(
		'refreshResources',
		[
			'refreshStyles',
			'refreshScripts',
		]
	);
	grunt.registerTask(
		'lint',
		[
			'eslint:info',
			'lesslint:info',
		]
	);
};
