module.exports = function(grunt) {
	require("load-grunt-tasks")(grunt);
	const sass = require("node-sass");

	// grun tasks
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		config: {
			css: "dist/dcal.css",
			js: "dist/dcal.js",
			banner: "/* dcal by hexydec */"
		},
		sass: {
			options: {
				implementation: sass
			},
			build: {
				options: {
					sourceMap: true
				},
				files: {
			    	"<%= config.css %>": "src/dcal.scss"
				}
			}
		},
		postcss: {
      		dev: {
				options: {
					processors: [
				        require("autoprefixer")() // add vendor prefixes
	      			],
	      			map: true
	      		},
      			src: "<%= config.css %>"
      		},
      		live: {
				options: {
					processors: [
				        require("autoprefixer")(), // add vendor prefixes
				        require("cssnano")() // minify the result
	      			]
	      		},
      			src: "<%= config.css %>"
      		}
		},
		rollup: {
			es6: {
				options: {
					format: "es",
					sourcemap: true,
					banner: "<%= config.banner %>"
				},
				src: "src/plugin.js",
				dest: "<%= config.js %>"
			}
		},
		babel: {
			es6: {
				files: {
					"dist/dcal.min.js": "<%= config.js %>"
				},
				options: {
					sourceMap: false,
					presets: [
						["minify", {mangle: {exclude: ["$"], topLevel: true}}]
					],
					comments: false
				}
			}
		},
		watch: {
			css: {
				files: ["src/**/*.scss"],
				tasks: ["sass", "postcss:dev"]
			},
			js: {
				files: ["src/**/*.js"],
				tasks: ["rollup:es6"]
			},
			gruntfile: {
				files: ["gruntfile.js", "package.json"],
				tasks: ["sass", "postcss:dev", "rollup:es6"]
			}
		}
	});

	grunt.registerTask("default", ["sass", "postcss:dev", "rollup", "babel"]);
};
