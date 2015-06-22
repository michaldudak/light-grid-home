(function (window, ng) {
	"use strict";

	var app = ng.module("lightGridDocs", ["ngRoute"]);
	window.app = app;

	app.config(function ($routeProvider, $compileProvider) {

		$compileProvider.debugInfoEnabled(false);

		$routeProvider
			.when("/lightGrid/lightGrid", {
				templateUrl: "Docs/lightGrid/lightGrid"
			})
			.when("/lightGrid/lgColumn", {
				templateUrl: "Docs/lightGrid/lgColumn"
			});
	});

}(window, window.angular));