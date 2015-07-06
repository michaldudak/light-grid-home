(function (window, ng) {
	"use strict";

	var app = ng.module("lightGridDocs", ["ngRoute", "lightGridHomeUtils"]);
	window.app = app;

	app.config(["$routeProvider", "$compileProvider", "$interpolateProvider", function ($routeProvider, $compileProvider, $interpolateProvider) {

		$compileProvider.debugInfoEnabled(false);

		$routeProvider
			.when("/:topic/:page", {
				templateUrl: function(params) {
					return "Docs/" + params.topic + "/" + params.page;
				}
			});

		// This is to prevent sample code from being interpreted as angular expressions.
		$interpolateProvider.startSymbol("{{{");
		$interpolateProvider.endSymbol("}}}");
	}]);

	app.run(function($rootScope, $anchorScroll) {
		$rootScope.$on("$routeChangeSuccess", function() {
			$anchorScroll("#view");
		});
	});

}(window, window.angular));
