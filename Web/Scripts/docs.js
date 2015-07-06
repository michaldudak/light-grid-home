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

		$interpolateProvider.startSymbol("{{{");
		$interpolateProvider.endSymbol("}}}");

	}]);

}(window, window.angular));
