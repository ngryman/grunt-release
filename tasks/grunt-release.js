/*
 * grunt-release
 * https://github.com/geddesign/grunt-release
 *
 * Copyright (c) 2013 Dave Geddes
 * Licensed under the MIT license.
 */

var shell = require('shelljs');
var semver = require('semver');

module.exports = function(grunt) {
	grunt.registerTask('release', 'bump version, git tag, git push, npm publish', function(type) {
		//defaults
		var options = this.options({
			bump: true,
			files: grunt.config('pkg') || 'package.json',
			readme: true,
			add: true,
			commit: true,
			tag: true,
			push: true,
			pushTags: true,
			npm: true,
			jam: false
		});

		var config = setup(options.files, type);

		if (options.bump) bump(config);
		if (options.readme) readme(config);
		if (options.add) add(config);
		if (options.commit) commit(config);
		if (options.tag) tag(config);
		if (options.push) push();
		if (options.pushTags) pushTags(config);
		if (options.npm) npm(config);
		if (options.jam) jam(config);

		function setup(files, type) {
			if (!Array.isArray(files)) files = [files];

			var config = [];
			files.forEach(function(file, i) {
				config[i] = {
					file: file,
					pkg: grunt.file.readJSON(file)
				};
				if (!config.newVersion) {
					config.newVersion = config[i].pkg.version = semver.inc(config[i].pkg.version, type || 'patch');
				}
			});
			return config;
		}

		function bump(config) {
			config.forEach(function(entry) {
				grunt.file.write(entry.file, JSON.stringify(entry.pkg, null, '  ') + '\n');
			});
			grunt.log.ok('Version bumped to ' + config.newVersion);
		}

		function readme(config) {
			var readmeContent = grunt.file.read('README.md');
			readmeContent = readmeContent.replace(/<sup>\d.\d.\d<\/sup>/g, '<sup>' + config.newVersion + '</sup>');
			grunt.file.write('README.md', readmeContent);
		}

		function add(config) {
			config.forEach(function(entry) {
				run('git add ' + entry.file);
			});
			run('git add README.md');
		}

		function commit(config) {
			run('git commit -m "bump version to ' + config.newVersion + '."', 'files committed');
		}

		function tag(config) {
			run('git tag -a "v' + config.newVersion + '" -m "build ' + config.newVersion + '"', 'New git tag created: v' + config.newVersion);
		}

		function push() {
			run('git push', 'pushed to github');
		}

		function pushTags(config) {
			run('git push --tags', 'pushed new tag ' + config.newVersion + ' to github');
		}

		function npm(config) {
			run('npm publish', 'published ' + config.newVersion + ' to npm');
		}

		function jam(config) {
			run('jam publish', 'published ' + config.newVersion + ' to jam');
		}

		function run(cmd, msg) {
			shell.exec(cmd, {silent: true});
			if (msg) grunt.log.ok(msg);
		}

		function push() {
			shell.exec('git push');
			grunt.log.ok('pushed to github');
		}
	});
};