(function (window, ng) {
	"use strict";

	var app = ng.module("lightGridDocs", ["ngRoute"]);
	window.app = app;

	app.config(function ($routeProvider, $compileProvider) {

		$compileProvider.debugInfoEnabled(false);

		$routeProvider
			.when("/:topic/:page", {
				templateUrl: function(params) {
					return "Docs/" + params.topic + "/" + params.page;
				}
			});
	});

}(window, window.angular));
