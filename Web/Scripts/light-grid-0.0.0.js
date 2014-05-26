// THIS IS SOOOO IN PROGRESS...

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
			if (typeof (Object.keys) === "function") {
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
			require: "^lgRow",
			link: function (scope, element, attrs, rowController) {
				var views = scope.columnDefinition.views;

				var transclusionScope = rowController.getCellScope();

				// CSS class defined on column template is copied to the rendered TD element...
				element.addClass(scope.columnDefinition.attributes.class);

				// ...and so is the width attribute
				if (scope.columnDefinition.attributes.width) {
					element.css("width", scope.columnDefinition.attributes.width);
				}

				if (countProperties(views) === 1 && typeof (views["*"]) !== "undefined") {
					// optimization: if there is just default view defined, we don't need ngSwitch

					var onlyView = views["*"];

					if (typeof (onlyView) === "function") {
						onlyView(transclusionScope, function (transcludedClone) {
							element.append(transcludedClone);
						});
					} else {
						var onlyViewNode = angular.element("<div>" + onlyView + "</div>");
						$compile(onlyViewNode)(transclusionScope);
						element.append(onlyViewNode);
					}

					return;
				}

				var switchRoot = angular.element("<div ng-switch='view' />");
				var cases = [];

				for (var view in views) {
					if (views.hasOwnProperty(view) && view !== "*") {
						// processing all the views except the default one:
						// each view gets linked with the cell scope and wrapped in a ng-switch-when container
						// that shows it only when scope's view property matches the view name
						var viewDefinition = views[view];
						var switchElement = angular.element("<div ng-switch-when='" + view + "' />");

						// view content is added to the container with a ng-switch attribute
						switchRoot.append(switchElement);

						cases.push({ node: switchElement, content: viewDefinition });
					}
				}

				// The '*' view is a special case - it defines the 'fallback' view used if no other view matches
				if (views["*"]) {
					var defaultElement = angular.element("<div ng-switch-default />");
					switchRoot.append(defaultElement);
					cases.push({ node: defaultElement, content: views["*"] });
				}

				for (var i = 0; i < cases.length; ++i) {
					if (typeof (cases[i].content) === "function") {
						var linker = cases[i].content;
						linker(transclusionScope, function (c) {
							cases[i].node.append(c);
						});
					} else {
						var clone = cases[i].content;
						cases[i].node.append(clone);
					}
				}

				element.append(switchRoot);

				// the whole container needs to be compiled to enable the ng-switch directive
				$compile(switchRoot)(transclusionScope);
			}
		};
	}]);

	;/* global grid */

	/**
	 * Defines a column template.
	 * Attributes:
	 *  - title - {String} (interpolated) title of the column (used to render a header if header template is not specified)
	 *  - visible - {Boolean} specifies if a column should be rendered
	 */
	grid.module.directive("lgColumn", function () {
		"use strict";

		return {
			scope: {
				title: "=",
				visible: "=?"
			},
			restrict: "EA",
			require: "^lightGrid",
			transclude: true,
			controller: ["$scope", function ($scope) {
				$scope.views = {};
				$scope.viewCount = 0;
				$scope.headerTemplate = null;
				$scope.footerTemplate = null;

				/**
				 * Registers a view in a column.
				 * @param  {String} name - Name of the view (optional, defaults to '*')
				 * @param  {Function} viewLinker - Precompiled view template (as a linking function)
				 */
				this.registerView = function (name, viewLinker) {
					name = name || "*";

					// name argument may contain a comma-separated list of view names
					// we need to register the linking function in all of them
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

				/**
				 * Registers a header template in a column.
				 * @param  {Function} viewLinker - Precompiled view template (as a linking function)
				 */
				this.registerHeaderTemplate = function (viewLinker) {
					$scope.headerTemplate = viewLinker;
				};

				/**
				 * Registers a footer template in a column.
				 * @param  {Function} viewLinker - Precompiled view template (as a linking function)
				 */
				this.registerFooterTemplate = function (viewLinker) {
					$scope.footerTemplate = viewLinker;
				};
			}],
			controllerAs: "templateColumnController",
			link: function (scope, instanceElement, instanceAttrs, gridController, linker) {

				if (!instanceAttrs.visible) {
					scope.visible = true;
				}

				scope.$watch("visible", function (newValue, oldValue) {
					if (newValue !== oldValue) {
						gridController.updateColumn(scope.$id, {
							visible: !!scope.visible
						});
					}
				});

				linker(scope, function (clone) {
					// transcluded content is added to the element so that lgColumnController can be 
					// required by lgView directives
					instanceElement.append(clone);
				});

				if (scope.viewCount === 0) {
					// simple mode - if no views are defined, the content of the directive is treated
					// as the default view
					scope.templateColumnController.registerView("*", linker);
				}

				gridController.defineColumn(scope.$id, {
					title: scope.title,
					views: scope.views,
					headerTemplate: scope.headerTemplate,
					footerTemplate: scope.footerTemplate,
					attributes: instanceAttrs,
					visible: !!scope.visible
				});

				// this element should not be rendered
				instanceElement.remove();
			}
		};
	});

	;/* global grid */

	/**
	 * Dummy directive to be placed on a row containing column templates
	 * (when writing HTML-compliant markup)
	 * 
	 * Example:
	 *   <table data-light-grid id="sampleGrid" data-data="people">
	 *     <tr data-column-templates>
	 *       <td data-lg-column title="'First name'">{{rowData.firstName}}</td>
	 *       <td data-lg-column title="'Last name'">{{rowData.lastName}}</td>
	 *     </tr>
	 *   </table>
	 */
	grid.module.directive("lgColumnTemplates", function () {
		"use strict";

		return function (scope, element) {
			element.remove();
		};
	});

	;/* global angular, grid */

	/**
	 * The root grid directive.
	 * Parameters:
	 *  - id - {String} ID of the grid. This attribute must be present and unique.
	 *  - data - {Array} (interpolated) data model displayed on the grid (optional).
	 *  - initial-view - {String} Name of the initial view mode of all rows in the grid.
	 */
	grid.module.directive("lightGrid", ["lgGridService", function gridDirective(gridService) {
		"use strict";

		var gridController = ["$scope", "$element", function GridController($scope, $element) {

			var columnDefinitions = {};
			$scope.visibleColumns = [];

			/**
			 * Gets the model displayed on the grid.
			 * @return {Array} Model displayed on the grid.
			 */
			this.getData = function getData() {
				return $scope.data;
			};

			/**
			 * Gets the current view model displayed on the grid.
			 * @return {Array} Current state of the grid's view model 
			 */
			this.getViewData = function getViewData() {
				if (angular.isArray($scope.data)) {
					return $scope.data.map(function (elem) {
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

			/**
			 * Sets the model of the grid.
			 * @param {[type]} newData [description]
			 */
			this.setData = function setData(newData) {
				$scope.data = newData;
			};

			function updateVisibleColumns() {
				$scope.visibleColumns.length = 0;

				for (var id in columnDefinitions) {
					if (columnDefinitions.hasOwnProperty(id) && columnDefinitions[id].definition.visible) {
						$scope.visibleColumns.push(columnDefinitions[id].definition);
					}
				}
			}

			/**
			 * Registers a column template.
			 * @param  {Object} columnDefinition Column definition object
			 */
			this.defineColumn = function (id, columnDefinition) {
				columnDefinitions[id] = { definition: columnDefinition };

				updateVisibleColumns();
			};

			/**
			 * Updates a registered column template.
			 * @param  {Object} columnDefinition Column definition object
			 */
			this.updateColumn = function (id, columnDefinition) {
				if (!columnDefinitions.hasOwnProperty(id)) {
					throw new Error("Column " + id + " was not registered.");
				}

				angular.extend(columnDefinitions[id].definition, columnDefinition);
				updateVisibleColumns();
			};

			/**
			 * Changes a view in all visible rows of the grid.
			 * This method is asynchronous.
			 * 
			 * @param  {String} viewName Name of the new view.
			 * @async
			 */
			this.switchView = function (viewName) {
				$scope.$broadcast("lightGrid.row.switchView", viewName);
			};

			/**
			 * Copies values from the view model to the data model.
			 * This method is asynchronous.
			 * 
			 * @async
			 */
			this.acceptViewModel = function () {
				$scope.$broadcast("lightGrid.row.acceptViewModel");
			};

			/**
			 * Gets a jQuery wrapper over the root DOM element of the grid.
			 * @return {jQuery} jQuery object representing the root node of the grid.
			 */
			this.getDomElement = function () {
				return $element;
			};

			/**
			 * Gets the scope of the grid directive. 
			 * @return {Scope} Scope of the grid directive.
			 */
			this.getScope = function () {
				return $scope;
			};

			/**
			 * Creates a new scope for transcluded elements. The new scope inherits from the grid's parent scope.
			 * @returns {Scope} The new scope.
			 */
			this.createTransclusionScope = function () {
				return $scope.$parent.$new();
			};

			/**
			 * Gets the ID property of the grid.
			 * @return {String} Grid's ID
			 */
			this.getId = function () {
				return $scope.id;
			};
		}];

		// TODO: footer support
		var defaultTemplate =
			"<table class='light-grid'>" +
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
			link: function postLink(scope, elem, attrs, controller, transclude) {
				if (typeof (scope.id) === "undefined" || scope.id === "") {
					throw new Error("The grid must have an id attribute.");
				}

				// directives such as dataProvider require access to the parent of the grid scope,
				// so they can't be linked with the grid scope (as it's isolated).
				var transclusionScope = scope.$parent.$new();
				transclude(transclusionScope, function (clone) {
					elem.append(clone);
				});

				gridService.registerGrid(scope.id, scope.gridController);

				scope.$on("$destroy", function () {
					gridService.unregisterGrid(scope.id);
				});
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
			restrict: "A",
			require: "^lightGrid",
			link: function (scope, element, attrs, gridController) {
				// CSS class defined on column template is copied to the rendered TH element
				element.addClass(scope.columnDefinition.attributes.class);

				if (!scope.columnDefinition.headerTemplate) {
					return;
				}

				// same as in the lgCell directive
				var transclusionScope = gridController.createTransclusionScope();
				transclusionScope.data = scope.data;
				transclusionScope.gridController = scope.gridController;
				transclusionScope.title = scope.columnDefinition.title;

				if (scope.columnDefinition.attributes.width) {
					element.css("width", scope.columnDefinition.attributes.width);
				}

				element.empty();

				// link the header template with the correct scope...
				scope.columnDefinition.headerTemplate(transclusionScope, function (clone) {
					// ...and insert the linked template inside the directive root element
					element.append(clone);
				});
			}
		};
	});

	;/* global grid */

	/**
	 * Represents a row inside grid's header.
	 * Does not expose any API.
	 */
	grid.module.directive("lgHeaderRow", function headerRowDirective() {
		"use strict";

		return {
			template: "<th lg-header-cell ng-repeat='columnDefinition in visibleColumns'></th>"
		};
	});

	;/* global grid */

	/**
	 * Template for the header (defined in the lgColumn)
	 * Does not expose any API.
	 */
	grid.module.directive("lgHeaderView", function () {
		"use strict";

		return {
			restrict: "EA",
			require: "^?lgColumn",
			transclude: true,
			link: function (scope, instanceElement, instanceAttrs, templateColumnController, linker) {
				instanceElement.remove();
				templateColumnController.registerHeaderTemplate(linker);
			}
		};
	});

	;/* global angular, grid */

	grid.module.directive("lgRow", ["$compile", function rowDirective($compile) {
		"use strict";

		var expandingRowMarkup = "<tr ng-if='expandedTemplate'><td colspan='{{visibleColumns.length}}' ng-include='expandedTemplate'></td></tr>";

		function defineViewDataProperty(obj) {
			try {
				Object.defineProperty(obj, "_viewData", {
					configurable: true,
					writable: true
				});
			} catch (err) {
				// IE < 9 does not support properties
				// falling back to plain field

				obj._viewData = null;
			}
		}

		return {
			template: "<td lg-cell ng-repeat='columnDefinition in visibleColumns'></td>",
			controller: ["$scope", "$element", function rowController($scope, $element) {
				var self = this;

				// The scope of the cell content inherits from grid's parent (so creating column templates in markup is intuitive)
				// This scope is augmented with several properties from the row scope (so it's possible to reference e.g. row
				// data in the column template).
				var cellsScope = $scope.gridController.createTransclusionScope();

				// these properties won't ever be overwritten, so it's safe to use simple assignment here
				cellsScope.rowData = $scope.rowData;
				cellsScope.data = $scope.data;
				cellsScope.gridController = $scope.gridController;
				cellsScope.rowController = this;

				// the next two properties may be overwritten in a row scope, so it's necessary to update the cell's scope
				// when this happens
				$scope.$watch("view", function () {
					cellsScope.view = $scope.view;
				});

				$scope.$watch("viewData", function () {
					cellsScope.viewData = $scope.viewData;
				});

				$scope.expandedTemplate = null;

				/**
				 * Gets the scope which the cells should be linked to.
				 */
				this.getCellScope = function () {
					return cellsScope;
				};

				/**
				 * Shows the expanded row below the original one, containing the provided template.
				 * The expanded row has only one cell (spanning across the entire grid width).
				 * @param {String} detailsTemplate - name of the template to load
				 */
				this.openDetails = function (detailsTemplate) {
					$scope.expandedTemplate = detailsTemplate;
					console.log("Opening details on row " + $scope.$index);
				};

				/**
				 * Collapses the expanded row.
				 */
				this.closeDetails = function () {
					$scope.expandedTemplate = null;
					console.log("Closing details on row " + $scope.$index);
				};

				/**
				 * If the row is expanded, collapses it. Otherwise expands it with a given template.
				 * @param {String} detailsTemplate - name of the template to load
				 */
				this.toggleDetails = function (detailsTemplate) {
					if ($scope.expandedTemplate === null) {
						self.openDetails(detailsTemplate);
					} else {
						self.closeDetails();
					}
				};

				/**
				* Changes the view mode of the row.
				* @param {String} viewName - name of the new view
				*/
				this.switchView = function (viewName) {
					if ($scope.view === viewName) {
						return;
					}

					$scope.view = viewName;
					self.resetViewModel();
				};

				/**
				 * Copies values from the row's view model to the data model.
				 */
				this.acceptViewModel = function () {
					angular.extend($scope.rowData, $scope.viewData);
					defineViewDataProperty($scope.rowData);
					$scope.rowData._viewData = $scope.viewData;
				};

				/**
				 * Discards the row's view model.
				 */
				this.resetViewModel = function () {
					delete $scope.rowData._viewData;
					$scope.viewData = angular.copy($scope.rowData);
					defineViewDataProperty($scope.rowData);
					$scope.rowData._viewData = $scope.viewData;
				};

				/**
				 * Gets a jQuery wrapper over the DOM element of the row (TR).
				 * @return {jQuery} jQuery object representing the TR row node.
				 */
				this.getDomElement = function () {
					return $element;
				};

				/**
				 * Adds the specified CSS class to the row node.
				 * @param {String} className - class to add
				 */
				this.addCssClass = function (className) {
					$element.addClass(className);
				};

				/**
				 * Removes the specified CSS class from the row node.
				 * @param {String} className - class to remove
				 */
				this.removeCssClass = function (className) {
					$element.removeClass(className);
				};

				// listening to grid's events
				$scope.$on("lightGrid.row.switchView", function (event, viewName) {
					self.switchView(viewName);
				});

				$scope.$on("lightGrid.row.acceptViewModel", function () {
					self.acceptViewModel();
				});
			}],
			controllerAs: "rowController",
			compile: function (tElement) {
				if (tElement[0].nodeName !== "TR") {
					throw new Error("Row directive must be placed on a tr element.");
				}

				var expandingRowLinker = $compile(expandingRowMarkup);

				return function (scope, element, attrs, controller) {
					scope.$watch("rowData", function () {
						controller.resetViewModel();
					});

					scope.view = attrs.initialView;

					// angular templates can't have several top-level elements (also TR can't be a template root),
					// so we need to insert another row here during linking
					expandingRowLinker(scope, function (clone) {
						element.after(clone);
					});
				};
			}
		};
	}]);

	;/* global grid */

	/**
	 * Defines a view in the column template
	 */
	grid.module.directive("lgView", function () {
		"use strict";

		return {
			restrict: "EA",
			require: "^lgColumn",
			compile: function (tElement, tAttrs) {
				var innerHtml = tElement.html();

				// we don't want to compile the contents of the view at this point
				// it'll be done later, in cell directive
				tElement.empty();

				return function (scope, element, attrs, templateColumnController) {
					var view = tAttrs.lgView || tAttrs.view;
					templateColumnController.registerView(view, innerHtml);
					element.remove();
				};
			}
		};
	});

	;/* global grid */

	/**
	 * Provides methods exposing grid controllers to other elements on a page.
	 */
	grid.module.service("lgGridService", [function gridService() {
		"use strict";

		var grids = {};
		var dataProviders = {};

		/**
		 * Gets the controller of the grid with a given ID.
		 *
		 * @param {String} id - ID of the grid.
		 * @returns {Object} Grid controller
		 */
		this.getGridController = function getGridController(id) {
			return grids[id];
		};

		/**
		 * Gets the data provider of the grid with a given ID.
		 * @param {String} id - ID of the grid.
		 * @returns {Object} Data provider of the grid.
		 */
		this.getDataProvider = function getDataProvider(id) {
			return dataProviders[id];
		};

		/**
		 * Registers the grid in the service.
		 * This method is not intended for public use.
		 *
		 * @param {String} id - ID of the grid
		 * @param {Object} controller - Controller to register.
		 * @private
		 */
		this.registerGrid = function registerGrid(id, controller) {
			grids[id] = controller;
		};

		/**
		 * Unregisters the grid from the service.
		 * This method is not intended for public use.
		 *
		 * @param {String} id - ID of the grid
		 * @private
		 */
		this.unregisterGrid = function unregisterGrid(id) {
			delete grids[id];
		};

		/**
		 * Registers the data provider in the service.
		 * This method is not intended for public use.
		 *
		 * @param {String} id - ID of the grid
		 * @param {Object} controller - Data provider controller to register.
		 * @private
		 */
		this.registerDataProvider = function registerDataProvider(id, controller) {
			dataProviders[id] = controller;
		};

		/**
		 * Unregisters the data provider of a grid with a given ID from the service.
		 * This method is not intended for public use.
		 *
		 * @param {String} id - ID of the grid
		 * @private
		 */
		this.unregisterGrid = function unregisterGrid(id) {
			delete dataProviders[id];
		};
	}]);

	;/* global grid */

	/**
	 * Directive persisting data from the viewModel of the row.
	 */
	grid.module.directive("persistData", ["$q", "$rootScope", "lgGridService", function ($q, $rootScope, lgGridService) {
		"use strict";

		return {
			link: function (scope, elem) {
				elem.on("click", function () {

					var gridId = scope.gridController.getId();
					var dataProvider = lgGridService.getDataProvider(gridId);

					$q.when(dataProvider.updateRecords(scope.viewData))
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

	/**
	 * Enables sorting data by a column specified by the sort-property attribute
	 * This directive is meant to be used in header template.
	 */
	grid.module.directive("lgSorter", ["lgGridService", "$rootScope", function (lgGridService, $rootScope) {
		"use strict";

		return {
			template: "<span class='sorter {{ cssClass() }}'><span ng-transclude class='columnTitle'></span></span>",
			transclude: true,
			replace: true,
			link: function (scope, elem, attrs) {
				var gridId = scope.gridController.getId();
				var sortProperty = attrs.sortProperty || attrs.lgSorter;

				scope.isSorted = false;
				scope.sortDirectionDescending = true;

				elem.on("click", function () {
					var dataProvider = lgGridService.getDataProvider(gridId);
					dataProvider.sort(sortProperty, !scope.sortDirectionDescending);
				});

				scope.$on("lightGrid.dataUpdated", function (event, sortedGridId, gridProperties) {
					if (gridId !== sortedGridId) {
						return;
					}

					var sortOptions = gridProperties.viewOptions;

					if (sortOptions.sortProperty !== sortProperty) {
						scope.isSorted = false;
						scope.sortDirectionDescending = true;
					} else {
						scope.isSorted = true;
						scope.sortDirectionDescending = sortOptions.sortDirectionDescending;
					}

					if (!scope.$$phase && !$rootScope.$$phase) {
						scope.$digest();
					}
				});

				scope.cssClass = function () {
					if (!scope.isSorted) {
						return "";
					}

					return scope.sortDirectionDescending ? "sorter-desc" : "sorter-asc";
				};
			}
		};
	}]);

	;/* global grid */

	/**
	 * Allows to change a view mode of the row.
	 * Can only be used as an attribute. Its value specifies name of the target view mode.
	 */
	grid.module.directive("switchView", function () {
		"use strict";

		return {
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

	/**
	 * Opens or closes the expanded view of the row.
	 * This can be only used as an attribute . It's value specifies the name of the template
	 * used as an expanded row content.
	 */
	grid.module.directive("lgToggleExpandedRow", function () {
		"use strict";

		return {
			require: "^?lgRow",
			link: function (scope, elem, attrs, rowController) {
				var detailsTemplate = attrs.lgToggleExpandedRow || attrs.detailsTemplate;

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

	/**
	 * Simple read-only column bound to a model's property
	 */
	grid.module.directive("lgBoundColumn", function () {
		"use strict";

		var template = "<lg-column>{{rowData['{property}']}}</lg-column>";

		return {
			restrict: "EA",
			template: function (elem, attrs) {
				return template.replace("{property}", attrs.property);
			},
			replace: true
		};
	});

	;/* global grid */

	/**
	 * Simple editable column. Renders either a property value or a text input bound to a property,
	 * depending on a view mode ("edit" for edit mode, any other for read-only mode)
	 */
	grid.module.directive("lgEditableColumn", function () {
		"use strict";

		var template = "<lg-column><lg-view>{{rowData[\"{property}\"]}}</lg-view><lg-view view='edit'>" +
			"<input type='text' ng-model='viewData[\"{property}\"]' class='form-control input-sm' /></lg-view></lg-column>";

		return {
			restrict: "EA",
			template: function (elem, attrs) {
				return template.replace(/\{property\}/g, attrs.property);
			},
			replace: true
		};
	});

	;/* global grid */

	/**
	 * Simple sortable column bound to a model's property
	 */
	grid.module.directive("lgSortableColumn", function () {
		"use strict";

		var template = "<lg-column><lg-header-view><span lg-sorter sort-property='{property}'>{{ {title} }}</span></lg-header-view><lg-view>{{rowData['{property}']}}</lg-view></lg-column>";

		return {
			restrict: "EA",
			template: function (elem, attrs) {
				return template.replace(/\{property\}/g, attrs.property).replace(/\{title\}/g, attrs.title);
			},
			replace: true
		};
	});

	;/* global grid, angular */

	/**
	 * Customizable data provider.
	 * Attributes:
	 *  - get-method (function(options)) - method called when the provider need new data. The options parameter contain the view options (filter, paging ans sorting)
	 *  - add-method (function(record)) - method called when the provider wants to save a new resource
	 *  - update-method (function(records)) - method called when the provider wants to update existing resources
	 *  - delete-method(function(record)) - method called when the provider wants to delete an existing resource
	 *  - initial-options (interpolated, optional) - an object containing the initial view options (search, sorting, paging)
	 */
	grid.module.directive("lgCustomDataProvider", ["lgGridService", "$q", "$rootScope", "$timeout", function (lgGridService, $q, $rootScope, $timeout) {
		"use strict";

		var defaultOptions = {
			sortProperty: null,
			sortDirectionDescending: false,
			pageNumber: null,
			pageSize: null,
			filter: null
		};

		function updateGridModel(modelPromise, scope) {
			// modelPromise may be either a promise or an actual object, so we have to wrap it in
			// $q.when() to make sure it's a promise.
			$q.when(modelPromise).then(function (model) {
				var gridController = lgGridService.getGridController(scope.gridId);

				if (model && model.data) {
					gridController.setData(model.data);
				} else {
					gridController.setData({ data: [] });
				}

				if (!scope.$$phase && !$rootScope.$$phase) {
					scope.$apply();
				}
			});
		}

		var customDataProviderController = ["$scope", function CustomDataProviderController($scope) {
			this.sort = function (sortProperty, descending) {
				var properties = angular.extend($scope.displayedDataProperties, { sortProperty: sortProperty, sortDirectionDescending: descending });
				updateGridModel($scope.getMethod({ options: properties }, $scope));
			};

			this.changePage = function (pageNumber, pageSize) {
				var properties = angular.extend($scope.displayedDataProperties, { pageNumber: pageNumber, pageSize: pageSize });
				updateGridModel($scope.getMethod({ options: properties }, $scope));
			};

			this.filter = function (filter) {
				var properties = angular.extend($scope.displayedDataProperties, { filter: filter, pageNumber: 1 });
				updateGridModel($scope.getMethod({ options: properties }, $scope));
			};

			this.updateRecords = function (records) {
				return $q.when($scope.updateMethod({ records: records }));
			};

			this.addRecord = function (record) {
				return $q.when($scope.addMethod({ record: record }));
			};

			this.deleteRecord = function (record) {
				return $q.when($scope.deleteMethod({ record: record }));
			};
		}];

		return {
			scope: {
				getMethod: "&",
				addMethod: "&",
				updateMethod: "&",
				deleteMethod: "&",
				initialOptions: "=?"
			},
			restrict: "EA",
			require: "^?lightGrid",
			controllerAs: "controller",
			controller: customDataProviderController,
			link: function (scope, elem, attrs, gridController) {
				// TODO: this looks quite error-prone
				if (!gridController && !attrs.gridId) {
					throw Error("lgCustomDataProvider has no associated grid.");
				}

				scope.gridId = gridController ? gridController.getId() : attrs.gridId;

				lgGridService.registerDataProvider(scope.gridId, scope.controller);
				scope.displayedDataProperties = angular.extend({}, defaultOptions, scope.initialOptions);

				elem.remove();

				$timeout(function () {
					var modelPromise = scope.getMethod({ options: scope.displayedDataProperties });
					updateGridModel(modelPromise, scope);
				});
			}
		};
	}]);

	;/* global grid, angular */

	/**
	 * Data provider to be used with a local array as a model.
	 * Attributes:
	 *  - model (interpolated) - an array with a data model to display
	 *  - initial-options (interpolated, optional) - an object containing the initial view options (search, sorting, paging)
	 */
	grid.module.directive("lgLocalDataProvider", ["lgGridService", "$filter", "$rootScope", function (lgGridService, $filter, $rootScope) {
		"use strict";

		var defaultOptions = {
			sortProperty: null,
			sortDirectionDescending: false,
			pageNumber: 1,
			pageSize: null,
			filter: null
		};

		/**
		 * Filters the input array according to specified criteria.
		 * @param {Array} model - model to filter
		 * @param {object} options - filtering criteria
		 * @returns {{model: Array, recordCount: Number}}
		 */
		function applyFilters(model, options) {
			var viewModel = model;

			if (options.filter) {
				var filter = $filter("filter");
				viewModel = filter(viewModel, options.filter);
			}

			// recordCount stores the number of results after filtering but before paging
			var recordCount = viewModel.length;

			if (options.sortProperty) {
				var orderBy = $filter("orderBy");
				viewModel = orderBy(viewModel, options.sortProperty, options.sortDirectionDescending);
			}

			if (options.pageNumber && options.pageSize) {
				var startIndex = (options.pageNumber - 1) * options.pageSize;
				var endIndex = startIndex + options.pageSize;

				viewModel = viewModel.slice(startIndex, endIndex);
			}

			return {
				model: viewModel,
				recordCount: recordCount
			};
		}

		function updateGridModel(scope) {
			var gridController = lgGridService.getGridController(scope.gridId);
			var modelInfo = applyFilters(scope.model, scope.displayedDataProperties);
			scope.viewModel = modelInfo.model;

			gridController.setData(scope.viewModel);

			// notifying other components that the displayed data may have changed
			$rootScope.$broadcast("lightGrid.dataUpdated", scope.gridId, {
				model: scope.model,
				recordCount: modelInfo.recordCount,
				viewOptions: scope.displayedDataProperties
			});

			if (!scope.$$phase && !$rootScope.$$phase) {
				scope.$apply();
			}
		}

		var localDataProviderController = ["$scope", "$q", function ($scope, $q) {
			this.getViewProperties = function () {
				return $scope.displayedDataProperties;
			};

			this.sort = function (sortProperty, descending) {
				angular.extend($scope.displayedDataProperties, { sortProperty: sortProperty, sortDirectionDescending: descending });
				updateGridModel($scope);
			};

			this.changePage = function (pageNumber, pageSize) {
				angular.extend($scope.displayedDataProperties, { pageNumber: pageNumber, pageSize: pageSize });
				updateGridModel($scope);
			};

			this.filter = function (filter) {
				angular.extend($scope.displayedDataProperties, { filter: filter, pageNumber: 1 });
				updateGridModel($scope);
			};

			this.updateRecords = function () {
				// local model is updated immediately, so nothing to do here
			};

			this.addRecord = function (record) {
				var deferred = $q.defer();

				$scope.model.push(record);

				deferred.resolve();
				return deferred.promise;
			};

			this.deleteRecord = function (record) {
				var deferred = $q.defer();
				var deleteIndex = null;

				for (var i = 0; i < $scope.model.length; ++i) {
					if ($scope.model[i] === record) {
						deleteIndex = i;
						break;
					}
				}

				if (deleteIndex !== null) {
					$scope.model.splice(deleteIndex, 1);
					deferred.resolve();
				} else {
					deferred.reject();
				}

				return deferred.promise;
			};
		}];

		return {
			scope: {
				model: "=",
				initialOptions: "=?"
			},
			restrict: "EA",
			require: "^?lightGrid",
			controllerAs: "controller",
			controller: localDataProviderController,
			link: function (scope, elem, attrs, gridController) {
				if (!gridController && !attrs.gridId) {
					throw Error("lgLocalDataProvider has no associated grid.");
				}

				scope.gridId = gridController ? gridController.getId() : attrs.gridId;

				scope.displayedDataProperties = angular.extend({}, defaultOptions, scope.initialOptions);

				scope.$watch("model", function () {
					updateGridModel(scope);
				});

				scope.$watchCollection("model", function () {
					updateGridModel(scope);
				});

				lgGridService.registerDataProvider(scope.gridId, scope.controller);
				elem.remove();
			}
		};
	}]);

}(window, window.angular, window.jQuery));