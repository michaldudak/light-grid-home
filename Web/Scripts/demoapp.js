(function (window, ng) {
	"use strict";

	var app = ng.module("lightGridSamples", ["lightGrid", "lightGridTemplates", "lightGridDataProviders", "lightGridControls", "ngRoute", "ngResource"]);
	window.app = app;

	app.config(function ($routeProvider, $controllerProvider, $compileProvider) {

		$controllerProvider.allowGlobals();
		$compileProvider.debugInfoEnabled(false);

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
			.when("/client-side-paging", {
				templateUrl: "Demos/clientSidePaging"
			})
			.when("/hidden-columns", {
				templateUrl: "Demos/hiddenColumns"
			})
			.when("/fully-featured-local", {
				templateUrl: "Demos/fullyFeaturedLocal"
			})
			.when("/server-side-processing", {
				templateUrl: "Demos/serverSideProcessing"
			})
			.otherwise({
				redirectTo: "/simplest"
			});
	});

	app.constant("sampleModel", [
		{
			make: "Honda",
			model: "CBF 1000F",
			engine: "998cm R4"
		}, {
			make: "BMW",
			model: "F800 GT",
			engine: "800ccm R2"
		}, {
			make: "Suzuki",
			model: "V-Strom 1000",
			engine: "1000ccm V2"
		}, {
			make: "KTM",
			model: "690 Duke",
			engine: "690ccm single"
		}, {
			make: "Kawasaki",
			model: "H2R",
			engine: "998ccm R4 supercharged"
		}
	]);

}(window, window.angular));