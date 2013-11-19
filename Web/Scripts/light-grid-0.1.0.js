(function (window, angular, $, undefined) {

/* global angular */

if (typeof ($) === "undefined") {
	throw new Error("Light Grid requires jQuery.");
}
	
if (angular.element !== $) {
	throw new Error("jQuery must be included before Angular.");
}

var grid = { // jshint unused:false
	module: angular.module("light-grid", [])
};

;/* global angular, grid */

/**
 * Represents a cell in a table.
 * Does not expose any API.
 *
 * @function cellDirective
 * @module lightGrid
 */
grid.module.directive("lgCell", ["$compile", function cellDirective($compile) {
	"use strict";
	
	function countProperties(obj) {
		if (typeof Object.keys === "function") {
			return Object.keys(obj).length;
		}
		
		var count = 0;
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				++count;
			}
		}

		return count;
	}

	return {
		restrict: "EA",
		require: "^lightGrid",
		link: function(scope, element, attrs, gridController) {
			var views = scope.columnDefinition.views;

			var transclusionScope = gridController.getScope().$parent.$new();

			transclusionScope.rowData = scope.rowData;
			transclusionScope.gridController = scope.gridController;
			transclusionScope.rowController = scope.rowController;

			scope.$watch("view", function() {
				transclusionScope.view = scope.view;
			});

			scope.$watch("viewData", function () {
				transclusionScope.viewData = scope.viewData;
			});
			
			element.attr("class", scope.columnDefinition.attributes.class);

			if (countProperties(views) === 1 && typeof(views["*"]) !== "undefined") {
				// optimization: if there is just default view defined, we don't need ngSwitch

				views["*"](transclusionScope, function (clone) {
					element.append(clone);
				});

				return;
			}

			var switchRoot = angular.element("<div ng-switch='view' />");
			
			function cloneLinkerHandlerBuilder(switchElem) {
				return function(clone) {
					switchElem.append(clone);
				};
			}

			for (var view in views) {
				if (views.hasOwnProperty(view) && view !== "*") {
					var viewLinker = views[view];
					var switchElement = angular.element("<div ng-switch-when='" + view + "' />");
					viewLinker(transclusionScope, cloneLinkerHandlerBuilder(switchElement));
					switchRoot.append(switchElement);
				}
			}

			if (views["*"]) {
				var defaultElement = angular.element("<div ng-switch-default />");
				views["*"](transclusionScope, function (clone) {
					defaultElement.append(clone);
				});

				switchRoot.append(defaultElement);
			}

			element.append(switchRoot);
			$compile(switchRoot)(transclusionScope);
		}
	};
}]);

;/* global angular, grid */

grid.module.directive("lightGrid", ["lgGridService", function gridDirective(gridService) {
	"use strict";

	var gridController = ["$scope", "$element", "$q", function GridController($scope, $element, $q) {
		
		// empty fallback data provider
		var dataProviderController = {
			getData: function() {
				return $q.when({ data: $scope.data });
			},
			sort: function() {},
			changePage: function () {},
			filter: function() {},
			persistData: function () {},
			addRecord: function () {},
			removeRecord: function () {}
		};
		
		$scope.columnDefinitions = [];
		
		this.getData = function getData() {
			return $scope.data;
		};

		this.getViewData = function getViewData() {
			if (angular.isArray($scope.data)) {
				return $scope.data.map(function(elem) {
					return elem._viewData;
				});
			} else {
				var gridViewData = {};

				for (var prop in $scope.data) {
					if ($scope.data.hasOwnProperty(prop)) {
						gridViewData[prop] = $scope.data[prop]._viewData;
					}
				}

				return gridViewData;
			}
		};

		this.setData = function setData(newData) {
			$scope.data = newData;
		};

		this.defineColumn = function(column) {
			$scope.columnDefinitions.push(column);
		};

		this.registerDataProvider = function(dataProvider) {
			dataProviderController = dataProvider;
		};

		this.getDataProvider = function() {
			return dataProviderController;
		};

		this.switchView = function(viewName) {
			$scope.$broadcast("lightGrid.row.switchView", viewName);
		};

		this.acceptViewModel = function() {
			$scope.$broadcast("lightGrid.row.acceptViewModel");
		};

		this.getDomElement = function() {
			return $element;
		};

		this.getScope = function() {
			return $scope;
		};
	}];

	var defaultTemplate =
		"<table class='angular-grid'>" +
			"<thead><tr lg-header-row></tr></thead>" +
			"<tbody><tr lg-row default-view='read' initial-view='{{ initialView || \"read\" }}' ng-repeat='rowData in data'></tr></tbody>" +
		"</table>";
	
	return {
		scope: {
			data: "=?",
			id: "@",
			initialView: "@"
		},
		template: defaultTemplate,
		replace: true,
		restrict: "EA",
		transclude: true,
		compile: function(tElement, tAttrs, transclude) {
			return function postLink(scope, elem) {
				if (typeof (scope.id) === "undefined" || scope.id === "") {
					throw new Error("The grid must have an id attribute.");
				}

				// directives such as dataProvider require access to the parent of the grid scope,
				// so they can't be linked with the grid scope (as it's isolated).
				var transclusionScope = scope.$parent.$new();
				transclude(transclusionScope, function(clone) {
					elem.append(clone);
				});

				scope.gridController.getDataProvider().getData().then(function(response) {
					scope.data = response.data;
				});

				gridService.registerGrid(scope.id, scope.gridController);

				scope.$on("$destroy", function() {
					gridService.unregisterGrid(scope.id);
				});
			};
		},
		controller: gridController,
		controllerAs: "gridController"
	};
}]);

;/* global grid */

/**
 * Represents a cell in a header of a table.
 * Does not expose any API.
 */
grid.module.directive("lgHeaderCell", function headerCellDirective() {
	"use strict";

	return {
		template: "{{columnDefinition.title}}",
		replace: false,
		restrict: "A"
	};
});

;/* global grid */

grid.module.directive("lgHeaderRow", [function headerRowDirective() {
	"use strict";

	return {
		restrict: "A",
		template: "<th lg-header-cell ng-repeat='columnDefinition in columnDefinitions'></th>",
	};
}]);

;/* global angular, grid */

grid.module.directive("lgRow", ["$compile", function rowDirective($compile) {
	"use strict";

	var expandingRowMarkup = "<tr ng-if='expandedTemplate'><td colspan='{{columnDefinitions.length}}' ng-include='expandedTemplate'></td></tr>";
	
	function defineViewDataProperty(obj) {
		try {
			Object.defineProperty(obj, "_viewData", {
				configurable: true,
				writable: true
			});
		} catch(err) {
			// IE < 9 does not support properties
			// falling back to plain field

			obj._viewData = null;
		}
	}

	return {
		restrict: "A",
		template: "<td lg-cell ng-repeat='columnDefinition in columnDefinitions'></td>",
		replace: false,
		controller: ["$scope", "$element", function rowController($scope, $element) {
			var self = this;
			
			$scope.expandedTemplate = null;

			this.openDetails = function (detailsTemplate) {
				$scope.expandedTemplate = detailsTemplate;
				console.log("Opening details on row " + $scope.$index);
			};

			this.closeDetails = function () {
				$scope.expandedTemplate = null;
				console.log("Closing details on row " + $scope.$index);
			};

			this.toggleDetails = function (detailsTemplate) {
				if ($scope.expandedTemplate === null) {
					self.openDetails(detailsTemplate);
				} else {
					self.closeDetails();
				}
			};

			this.switchView = function(viewName) {
				if ($scope.view === viewName) {
					return;
				}
				
				$scope.view = viewName;
				self.resetViewModel();
				console.log("Switching view on the row " + $scope.$index + " to " + viewName);
			};

			this.acceptViewModel = function() {
				$.extend($scope.rowData, $scope.viewData);
				defineViewDataProperty($scope.rowData);
				$scope.rowData._viewData = $scope.viewData;
			};

			this.resetViewModel = function() {
				delete $scope.rowData._viewData;
				$scope.viewData = angular.copy($scope.rowData);
				defineViewDataProperty($scope.rowData);
				$scope.rowData._viewData = $scope.viewData;
			};
			
			this.getDomElement = function () {
				return $element;
			};

			$scope.$on("lightGrid.row.switchView", function(event, viewName) {
				self.switchView(viewName);
			});
			
			$scope.$on("lightGrid.row.acceptViewModel", function () {
				self.acceptViewModel();
			});
		}],
		controllerAs: "rowController",
		link: function(scope, element) {

			if (element[0].nodeName !== "TR") {
				throw new Error("Row directive must be placed on a tr element.");
			}

			scope.$watch("rowData", function() {
				scope.rowController.resetViewModel();
			});

			// angular templates can't have several top-level elements (and TR can't be a template root),
			// so we need to insert another row here during linking
			var expandingRow = $(expandingRowMarkup);
			expandingRow.data(element.data());
			$compile(expandingRow)(scope);

			element.after(expandingRow);
		}
	};
}]);

;/* global grid */

grid.module.service("lgGridService", [function gridService() {
	"use strict";

	var grids = {};

	this.registerGrid = function registerGrid(id, controller) {
		grids[id] = controller;
	};

	this.unregisterGrid = function unregisterGrid(id) {
		delete grids[id];
	};

	this.getGridController = function getGridController(id) {
		return grids[id];
	};
}]);

;/* global grid */

grid.module.directive("persistData", ["$q", "$rootScope", function ($q, $rootScope) {
	"use strict";
	
	return {
		priority: 10,
		link: function (scope, elem) {
			elem.on("click", function () {

				$q.when(scope.gridController.getDataProvider().updateRecords(scope.viewData))
					.then(function () {
						scope.rowController.acceptViewModel();
						scope.rowController.switchView("read");

						if (!scope.$$phase && !$rootScope.$$phase) {
							scope.$apply();
						}
					});
			});
		}
	};
}]);

;/* global grid */

grid.module.directive("switchView", function () {
	"use strict";
	
	return {
		priority: 20,
		require: "^?lgRow",
		link: function (scope, elem, attrs, rowController) {
			var viewName = attrs.switchView;

			elem.on("click", function () {
				rowController.switchView(viewName);
				
				if (!scope.$$phase) {
					scope.$apply();
				}
			});
		}
	};
});

;/* global grid */

grid.module.directive("toggleDetails", function () {
	"use strict";
	
	return {
		require: "^?lgRow",
		link: function(scope, elem, attrs, rowController) {
			var detailsTemplate = attrs.toggleDetails || attrs.detailsTemplate;

			elem.on("click", function () {
				rowController.toggleDetails(detailsTemplate);
				
				if (!scope.$$phase) {
					scope.$apply();
				}
			});
		}
	};
});

;/* global grid */

grid.module.directive("lgBoundColumn", function () {
	"use strict";
	
	var template = "<lg-column>{{rowData.[property]}}</lg-column>";

	return {
		restrict: "EA",
		template: function(elem, attrs) {
			return template.replace("[property]", attrs.property);
		},
		replace: true
	};
});

;/* global grid */

grid.module.directive("lgColumn", function () {
	"use strict";
	
	return {
		scope: {
			title: "="
		},
		restrict: "EA",
		require: "^lightGrid",
		transclude: true,
		controller: ["$scope", function($scope) {
			var templateColumnController = {};

			$scope.views = {};
			$scope.viewCount = 0;

			templateColumnController.registerView = function(name, viewLinker) {
				name = name || "*";
				var separatedNames = name.split(",");

				for (var i = 0; i < separatedNames.length; ++i) {
					var separatedName = separatedNames[i].trim();
					if (separatedName === "") {
						continue;
					}

					$scope.views[separatedName] = viewLinker;
					$scope.viewCount += 1;
				}
			};

			return templateColumnController;
		}],
		controllerAs: "templateColumnController",
		compile: function (tElem, tAttr, linker) {
			return function(scope, instanceElement, instanceAttrs, gridController) {
				
				linker(scope, function(clone) {
					instanceElement.append(clone);
				});
				
				if (scope.viewCount === 0) {
					scope.templateColumnController.registerView("*", linker);
				}

				gridController.defineColumn({
					title: scope.title,
					views: scope.views,
					attributes: instanceAttrs
				});
				
				instanceElement.remove();
			};
		}
	};
});

;/* global grid */

grid.module.directive("lgView", function () {
	"use strict";
	
	return {
		scope: {
			view: "@"
		},
		restrict: "EA",
		require: "^lgColumn",
		transclude: true,
		compile: function (templateElement, templateAttrs, linker) {
			return function (scope, instanceElement, instanceAttrs, templateColumnController) {
				instanceElement.remove();
				templateColumnController.registerView(scope.view, linker);
			};
		}
	};
});

;/* global grid */

grid.module.directive("lgCustomDataProvider", [function () {
	"use strict";

	var customDataProviderController = ["$scope", "$q", function CustomDataProviderController($scope, $q) {
		var displayedDataProperties = {
			sortProperty: null,
			sortDirectionDescending: false,
			pageNumber: null,
			pageSize: null,
			filter: null
		};

		var self = this;

		this.getData = function(options) {
			return $q.when($scope.getMethod({ options: options }));
		};

		this.sort = function(sortProperty, descending) {
			var properties = $.extend(displayedDataProperties, { sortProperty: sortProperty, sortDirectionDescending: descending });
			return self.getData(properties);
		};

		this.changePage = function(pageNumber, pageSize) {
			var properties = $.extend(displayedDataProperties, { pageNumber: pageNumber, pageSize: pageSize });
			return self.getData(properties);
		};

		this.filter = function(filter) {
			var properties = $.extend(displayedDataProperties, { filter: filter });
			return self.getData(properties);
		};

		this.updateRecords = function(records) {
			return $q.when($scope.updateMethod({ records: records }));
		};

		this.addRecord = function(record) {
			return $q.when($scope.addMethod({ record: record }));
		};

		this.deleteRecord = function(record) {
			return $q.when($scope.deleteMethod({ record: record }));
		};
	}];

	return {
		scope: {
			getMethod: "&",
			addMethod: "&",
			updateMethod: "&",
			deleteMethod: "&"
		},
		restrict: "EA",
		require: "^lightGrid",
		controllerAs: "controller",
		controller: customDataProviderController,
		link: function (scope, elem, attrs, gridController) {
			elem.remove();
			gridController.registerDataProvider(scope.controller);
		},
	};
}]);

;/* global grid */

grid.module.directive("lgLocalDataProvider", [function () {
	"use strict";

	var localDataProviderController = ["$scope", "$q", function LocalDataProviderController($scope, $q) {
		this.getData = function() {
			return $q.when(function() {
				return { data: $scope.model };
			});
		};

		this.sort = function(/*sortProperty, descending*/) {
			throw new Error("Not implemented");
		};

		this.changePage = function(/*pageNumber, pageSize*/) {
			throw new Error("Not implemented");
		};

		this.filter = function(/*filter*/) {
			throw new Error("Not implemented");
		};

		this.updateRecords = function(/*records*/) {
			throw new Error("Not implemented");
		};

		this.addRecord = function(/*record*/) {
			throw new Error("Not implemented");
		};

		this.deleteRecord = function(/*removeRecord*/) {
			throw new Error("Not implemented");
		};
	}];
	
	return {
		scope: {
			model: "="
		},
		restrict: "EA",
		require: "^lightGrid",
		controllerAs: "controller",
		controller: localDataProviderController,
		link: function (scope, elem, attrs, gridController) {
			gridController.registerDataProvider(scope.controller);
			
			scope.$watch("model", function (model) {
				gridController.setData(model);
			});
			
			elem.remove();
		},
	};
}]);

}(window, window.angular, window.jQuery));