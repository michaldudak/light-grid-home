(function (window, ng) {
	"use strict";

	var app = ng.module("lightGridSamples", ["light-grid", "ngRoute"]);
	window.app = app;

	app.config(function ($routeProvider) {
		$routeProvider
			.when("/simplest", {
				templateUrl: "Demos/simplest"
			})
			.when("/local-data", {
				templateUrl: "Demos/localData"
			})
			.when("/expanded-row", {
				templateUrl: "Demos/expandedRow"
			})
			.when("/local-editable-row", {
				templateUrl: "Demos/localEditableRow"
			})
			.when("/sortable-columns", {
				templateUrl: "Demos/sortableColumns"
			})
			.when("/client-side-search", {
				templateUrl: "Demos/clientSideSearch"
			})
			.otherwise({
				redirectTo: "/simplest"
			});
	});

}(window, window.angular));