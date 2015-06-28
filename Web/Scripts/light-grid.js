/*!
 Light Grid 0.2.0 

 by Micha³ Dudak
 https://github.com/michaldudak/light-grid.git
 license: MIT

 build date: 2015-06-28T17:36:36.902Z
*/

(function (window, angular, $, undefined) {

    if (typeof ($) === "undefined") {
        throw new Error("Light Grid requires jQuery.");
    }

    if (angular.element !== $) {
        throw new Error("jQuery must be included before Angular.");
    }

    angular.module("lightGrid", []);


    /**
     * Represents a cell in a table.
     * Does not expose any API.
     *
     * @function cellDirective
     * @module lightGrid
     */
    angular.module("lightGrid").directive("lgCell", function cellDirective($compile) {
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

                if (countProperties(views) === 1 && typeof views["*"] !== "undefined") {
                    // Optimization: if there is just default view defined, we don't need ngSwitch

                    var onlyView = views["*"];

                    if (typeof onlyView === "function") {
                        onlyView(transclusionScope, function (transcludedClone) {
                            element.append(transcludedClone);
                        });
                    } else {
                        var onlyViewNode = angular.element("<div>" + onlyView + "</div>");
                        element.append(onlyViewNode);
                        $compile(onlyViewNode)(transclusionScope);
                    }

                    return;
                }

                var switchRoot = angular.element("<div ng-switch='view' />");
                var cases = [];

                for (var view in views) {
                    if (views.hasOwnProperty(view) && view !== "*") {
                        // Processing all the views except the default one:
                        // each view gets linked with the cell scope and wrapped in a ng-switch-when container
                        // that shows it only when scope's view property matches the view name
                        var viewDefinition = views[view];
                        var switchElement = angular.element("<div ng-switch-when='" + view + "' />");

                        // View content is added to the container with a ng-switch attribute
                        switchRoot.append(switchElement);

                        cases.push({ node: switchElement, content: viewDefinition });
                    }
                }

                // The '*' view is a special case - it defines the 'fallback' view used if no other view matches.
                if (views["*"]) {
                    var defaultElement = angular.element("<div ng-switch-default />");
                    switchRoot.append(defaultElement);
                    cases.push({ node: defaultElement, content: views["*"] });
                }

                cases.forEach(function (caseElement) {
                    if (typeof (caseElement.content) === "function") {
                        var linker = caseElement.content;
                        linker(transclusionScope, function (c) {
                            caseElement.node.append(c);
                        });
                    } else {
                        var clone = caseElement.content;
                        caseElement.node.append(clone);
                    }
                });

                element.append(switchRoot);

                // The whole container needs to be compiled to enable the ng-switch directive.
                $compile(switchRoot)(transclusionScope);
            }
        };
    });


    /**
     * Defines a column template.
     * Attributes:
     *  - title - {String} (interpolated) title of the column (used to render a header if header template is not specified)
     *  - visible - {Boolean} specifies if a column should be rendered
     */
    angular.module("lightGrid").directive("lgColumn", function () {
        "use strict";

        return {
            scope: {
                title: "=",
                visible: "=?"
            },
            restrict: "EA",
            require: "^lgGrid",
            transclude: true,
            controller: function ($scope) {
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
            },
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
    angular.module("lightGrid").directive("lgColumnTemplates", function () {
        "use strict";

        return {
            restrict: "A",
            link: function (scope, element) {
                var parent = element.parent();
                // browsers may create additional tbody tag surrounding the <td lg-column-templates">. We don't need this.
                if (parent[0].tagName === "TBODY" && parent.children().length === 1) {
                    parent.remove();
                } else {
                    element.remove();
                }
            }
        };

    });


    /**
     * The root grid directive.
     * Parameters:
     *  - id - {String} ID of the grid. This attribute must be present and unique.
     *  - model - {Array} (interpolated) data model displayed on the grid (optional).
     *  - initial-view - {String} Name of the initial view mode of all rows in the grid.
     */
    angular.module("lightGrid").directive("lgGrid", function gridDirective() {
        "use strict";

        var gridController = function GridController($scope, $element) {

            var columnDefinitions = {};
            $scope.visibleColumns = [];

            /**
             * Gets the model displayed on the grid.
             * @return {Array} Model displayed on the grid.
             */
            this.getData = function getData() {
                return $scope.model;
            };

            /**
             * Gets the current view model displayed on the grid.
             * @return {Array} Current state of the grid's view model
             */
            this.getViewData = function getViewData() {
                if (angular.isArray($scope.model)) {
                    return $scope.model.map(function (elem) {
                        return elem.$viewData;
                    });
                } else {
                    var gridViewData = {};

                    for (var prop in $scope.model) {
                        if ($scope.model.hasOwnProperty(prop)) {
                            gridViewData[prop] = $scope.model[prop].$viewData;
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
                $scope.model = newData;
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
        };

        // TODO: footer support
        var defaultTemplate =
            "<table class='light-grid'>" +
                "<thead><tr lg-header-row></tr></thead>" +
                "<tbody><tr lg-row default-view='read' initial-view='{{ initialView || \"read\" }}' ng-repeat='rowData in model'></tr></tbody>" +
            "</table>";

        return {
            scope: {
                model: "=",
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
            },
            controller: gridController,
            controllerAs: "gridController"
        };
    });


    /**
     * Represents a cell in a header of a table.
     * Does not expose any API.
     */
    angular.module("lightGrid").directive("lgHeaderCell", function headerCellDirective() {
        "use strict";

        return {
            template: "{{columnDefinition.title}}",
            replace: false,
            restrict: "A",
            require: "^lgGrid",
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


    /**
     * Represents a row inside grid's header.
     * Does not expose any API.
     */
    angular.module("lightGrid").directive("lgHeaderRow", function headerRowDirective() {
        "use strict";

        return {
            restrict: "A",
            template: "<th lg-header-cell ng-repeat='columnDefinition in visibleColumns'></th>"
        };
    });


    /**
     * Template for the header (defined in the lgColumn)
     * Does not expose any API.
     */
    angular.module("lightGrid").directive("lgHeaderView", function () {
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


    angular.module("lightGrid").directive("lgRow", function rowDirective($compile) {
        "use strict";

        var expandingRowMarkup = "<tr ng-if='expandedTemplate'><td colspan='{{visibleColumns.length}}' ng-include='expandedTemplate'></td></tr>";

        function defineViewDataProperty(obj) {
            try {
                Object.defineProperty(obj, "$viewData", {
                    configurable: true,
                    writable: true
                });
            } catch (err) {
                // IE < 9 does not support properties
                // falling back to plain field

                obj.$viewData = null;
            }
        }

        return {
            restrict: "A",
            template: "<td lg-cell ng-repeat='columnDefinition in visibleColumns'></td>",
            controller: function rowController($scope, $element) {
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
                };

                /**
                 * Collapses the expanded row.
                 */
                this.closeDetails = function () {
                    $scope.expandedTemplate = null;
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
                    $scope.rowData.$viewData = $scope.viewData;
                };

                /**
                 * Discards the row's view model.
                 */
                this.resetViewModel = function () {
                    delete $scope.rowData.$viewData;
                    $scope.viewData = angular.copy($scope.rowData);
                    defineViewDataProperty($scope.rowData);
                    $scope.rowData.$viewData = $scope.viewData;
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
            },
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
    });


    /**
     * Defines a view in the column template
     */
    angular.module("lightGrid").directive("lgView", function () {
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


    angular.module("lightGridTemplates", ["lightGrid"]);


    /**
     * Simple read-only column bound to a model's property
     */
    angular.module("lightGridTemplates").directive("lgBoundColumn", function () {
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


    /**
     * Simple editable column. Renders either a property value or a text input bound to a property,
     * depending on a view mode ("edit" for edit mode, any other for read-only mode)
     */
    angular.module("lightGridTemplates").directive("lgEditableColumn", function () {
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


    /**
     * Simple sortable column bound to a model's property
     */
    angular.module("lightGridTemplates").directive("lgSortableColumn", function () {
        "use strict";

        var template = "<lg-column><lg-header-view><span lg-sorter sort-property='{property}' data-provider='{provider}'>{{ {title} }}</span></lg-header-view><lg-view>{{rowData['{property}']}}</lg-view></lg-column>";

        return {
            restrict: "EA",
            template: function (elem, attrs) {
                return template
                    .replace(/\{property\}/g, attrs.property)
                    .replace(/\{title\}/g, attrs.title)
                    .replace(/\{provider}/g, attrs.provider);
            },
            replace: true
        };
    });


    angular.module("lightGridDataProviders", ["lightGrid"]);


    function LocalDataProvider(model, filterFilter, orderByFilter, limitToFilter, defaultViewSettings) {

        var viewSettings;
        var viewModel;
        var filteredItemCount;
        var originalModel = model;

        function updateFilters() {
            viewModel = originalModel;

            if (viewSettings.filter) {
                viewModel = filterFilter(viewModel, viewSettings.filter.expression, viewSettings.filter.comparator);
            }

            if (viewSettings.orderBy) {
                viewModel = orderByFilter(viewModel, viewSettings.orderBy.expression, viewSettings.orderBy.reverse);
            }

            filteredItemCount = viewModel.length;

            if (viewSettings.limitTo && viewSettings.limitTo.limit !== 0) {
                if (viewSettings.limitTo.begin) {
                    if (viewSettings.limitTo.begin >= filteredItemCount) {
                        viewSettings.limitTo.begin = 0;
                    }

                    viewModel = viewModel.slice(viewSettings.limitTo.begin, viewModel.length);
                }

                viewModel = limitToFilter(viewModel, viewSettings.limitTo.limit);
            }
        }

        this.setModel = function (newModel) {
            originalModel = newModel;
            updateFilters();
        };

        this.getGridModel = function () {
            return viewModel;
        };

        this.getModelItemCount = function () {
            return filteredItemCount;
        };

        this.getCurrentViewSettings = function () {
            return viewSettings;
        };

        this.saveModel = function () {
        };

        this.orderBy = function (expression, reverse) {
            viewSettings.orderBy = {
                expression: expression,
                reverse: reverse
            };

            updateFilters();
        };

        this.limitTo = function (limit, begin) {
            if (limit === undefined || limit === null) {
                viewSettings.limitTo = null;
            } else {
                viewSettings.limitTo = {
                    limit: limit,
                    begin: begin || 0
                };
            }

            updateFilters();
        };

        this.page = function (pageIndex) {
            if (viewSettings.limitTo && viewSettings.limitTo.limit) {
                viewSettings.limitTo.begin = viewSettings.limitTo.limit * pageIndex;
            }

            updateFilters();
        };

        this.filter = function (expression, comparator) {
            viewSettings.filter = {
                expression: expression,
                comparator: comparator
            };

            updateFilters();
        };

        this.reset = function () {
            viewSettings = angular.copy(defaultViewSettings);
            updateFilters();
        };

        this.reset();
    }

    angular.module("lightGridDataProviders").provider("lgLocalDataProviderFactory", function () {

        var self = this;

        this.defaultViewSettings = {
            orderBy: null,
            limitTo: null,
            filter: null
        };

        this.$get = function (filterFilter, orderByFilter, limitToFilter) {
            return {
                create: function (localModel) {
                    return new LocalDataProvider(localModel, filterFilter, orderByFilter, limitToFilter, self.defaultViewSettings);
                }
            };
        };
    });


    function ServerDataProvider(resourceUrl, $http, $timeout, defaultViewSettings, debounceTime) {

        var viewSettings = angular.copy(defaultViewSettings);
        var viewModel = [];
        var filteredItemCount = 0;

        // debounce data
        var pendingRequest = null;
        var pendingRequestSettings = null;
        this.debounceTime = debounceTime;

        var self = this;

        function updateFilters(requestSettings) {
            if (!resourceUrl) {
                return;
            }

            if (!requestSettings) {
                requestSettings = viewSettings;
            } else {
                pendingRequestSettings = angular.extend({}, pendingRequestSettings, requestSettings);
                requestSettings = angular.extend({}, viewSettings, pendingRequestSettings);
            }

            var url = resourceUrl;

            var queryString = [];

            if (requestSettings.limitTo) {
                if (requestSettings.limitTo.limit) {
                    queryString.push("limit=" + requestSettings.limitTo.limit);
                }

                if (requestSettings.limitTo.begin) {
                    queryString.push("begin=" + requestSettings.limitTo.begin);
                }
            }

            if (requestSettings.orderBy && requestSettings.orderBy.expression) {
                queryString.push("orderBy=" + encodeURIComponent(requestSettings.orderBy.expression));

                if (requestSettings.orderBy.reverse) {
                    queryString.push("reverse=true");
                }
            }

            if (requestSettings.filter && requestSettings.filter.expression) {
                queryString.push("search=" + encodeURIComponent(requestSettings.filter.expression));
            }

            if (queryString.length > 0) {
                if (url.indexOf("?") === -1) {
                    url += "?";
                } else {
                    url += "&";
                }

                url += queryString.join("&");
            }

            if (pendingRequest !== null) {
                $timeout.cancel(pendingRequest);
                pendingRequest = null;
            }

            function sendRequest() {
                $http.get(url).success(function (response) {
                    viewModel = response.data;
                    filteredItemCount = response.totalResults;
                    viewSettings = requestSettings;
                });
            }

            if (self.debounceTime) {
                pendingRequest = $timeout(function () {
                    pendingRequest = null;
                    pendingRequestSettings = null;
                    sendRequest();
                }, self.debounceTime);
            } else {
                sendRequest();
            }
        }

        this.getGridModel = function () {
            return viewModel;
        };

        this.getModelItemCount = function () {
            return filteredItemCount;
        };

        this.getCurrentViewSettings = function () {
            return viewSettings;
        };

        this.saveModel = function (model) {
            return $http.post(resourceUrl, model);
        };

        this.orderBy = function (expression, reverse) {
            var requestSettings = {
                orderBy: {
                    expression: expression,
                    reverse: reverse || false
                }
            };

            updateFilters(requestSettings);
        };

        this.limitTo = function (limit, begin) {
            var requestSettings = {};

            if (limit === undefined || limit === null) {
                requestSettings.limitTo = null;
            } else {
                requestSettings.limitTo = {
                    limit: limit,
                    begin: begin || 0
                };
            }

            updateFilters(requestSettings);
        };

        this.filter = function (expression) {
            var requestSettings = {
                filter: {
                    expression: expression
                }
            };

            updateFilters(requestSettings);
        };

        this.setViewSettings = function (requestSettings) {
            updateFilters(requestSettings);
        };

        this.refresh = function () {
            updateFilters();
        };

        this.reset = function () {
            viewSettings = angular.copy(defaultViewSettings);
            updateFilters();
        };
    }

    angular.module("lightGridDataProviders").provider("lgServerDataProviderFactory", function () {

        var self = this;

        this.defaultViewSettings = {
            orderBy: null,
            limitTo: null,
            filter: null
        };

        this.debounceTime = 150;

        this.$get = function ($http, $timeout) {
            return {
                create: function (resourceUrl) {
                    return new ServerDataProvider(resourceUrl, $http, $timeout, self.defaultViewSettings, self.debounceTime);
                }
            };
        };
    });


    angular.module("lightGridControls", ["lightGrid"]);


    angular.module("lightGridControls").directive("lgPager", function () {
        "use strict";

        return {
            scope: {
                provider: "=",
                pageSizeOptions: "@"
            },
            template: "<div class='pager'>" +
                "<button ng-disabled='isFirst' class='first' ng-click='goToFirst()'>Last</button>" +
                "<button ng-disabled='isFirst' class='previous' ng-click='goToPrevious()'>Previous</button>" +
                "<span class='pager-summary'>Page {{currentPage + 1}} of {{pageCount}}</span>" +
                "<button ng-disabled='isLast' class='next' ng-click='goToNext()'>Next</button>" +
                "<button ng-disabled='isLast' class='last' ng-click='goToLast()'>Last</button>" +
                "</div>" +
                "<div class='page-size'><select class='form-control' ng-options='pageSize for pageSize in pageSizes' ng-model='currentPageSize'></select></div>",
            link: function ($scope) {
                var DEFAULT_PAGE_SIZE_OPTIONS = "10,20,50";

                $scope.pageSizeOptions = $scope.pageSizeOptions || DEFAULT_PAGE_SIZE_OPTIONS;
                $scope.pageSizes = $scope.pageSizeOptions
                    .split(",")
                    .map(function (pso) {
                        return parseInt(pso, 10);
                    })
                    .filter(function (pso) {
                        return !isNaN(pso);
                    });

                $scope.currentPageSize = $scope.pageSizes[0];

                function calculateCurrentPage(currentIndex, pageSize) {
                    return Math.floor(currentIndex / pageSize);
                }

                function calculatePageCount(pageSize, totalSize) {
                    return Math.ceil(totalSize / pageSize);
                }

                function update(limitToSettings) {
                    var totalItemCount = $scope.provider.getModelItemCount();

                    if (!limitToSettings) {
                        $scope.currentPage = 0;
                        $scope.pageCount = 1;
                    } else {
                        $scope.currentPage = calculateCurrentPage(limitToSettings.begin, limitToSettings.limit);
                        $scope.pageCount = calculatePageCount(limitToSettings.limit, totalItemCount);
                        $scope.pageSize = limitToSettings.limit;
                    }

                    $scope.isFirst = $scope.currentPage <= 0;
                    $scope.isLast = $scope.currentPage >= $scope.pageCount - 1;
                }

                function goToPage(pageNumber) {
                    var firstIndex = $scope.pageSize * pageNumber;
                    $scope.provider.limitTo($scope.pageSize, firstIndex);
                }

                $scope.$watch("provider.getCurrentViewSettings().limitTo", function (limitToSettings) {
                    update(limitToSettings);
                }, true);

                $scope.$watch("provider.getModelItemCount()", function () {
                    update($scope.provider.getCurrentViewSettings().limitTo);
                });

                $scope.$watch("currentPageSize", function (value) {
                    $scope.provider.limitTo(value, 0);
                });

                $scope.goToFirst = function () {
                    goToPage(0);
                };

                $scope.goToPrevious = function () {
                    goToPage($scope.currentPage - 1);
                };

                $scope.goToNext = function () {
                    goToPage($scope.currentPage + 1);
                };

                $scope.goToLast = function () {
                    goToPage($scope.pageCount - 1);
                };
            }
        };
    });


    /**
     * Directive persisting data from the viewModel of the row.
     */
    angular.module("lightGridControls").directive("lgPersistData", function ($q) {
        "use strict";

        return {
            link: function ($scope, $elem, $params) {
                $elem.on("click", function () {

                    var dataProvider = $scope.$eval($params.provider);

                    $q.when(dataProvider.saveModel($scope.viewData))
                        .then(function () {
                            $scope.rowController.acceptViewModel();
                            $scope.rowController.switchView("read");
                        });
                });
            }
        };
    });


    /**
     * Enables sorting data by a column specified by the sort-property attribute
     * This directive is meant to be used in header template.
     */
    angular.module("lightGridControls").directive("lgSorter", function ($timeout) {
        "use strict";

        return {
            template: "<span class='sorter {{ cssClass }}'><span ng-transclude class='columnTitle'></span></span>",
            transclude: true,
            replace: true,
            scope: true,
            link: function (scope, elem, attrs) {
                var sortProperty = attrs.sortProperty || attrs.lgSorter;
                var dataProvider = scope.$eval(attrs.provider);

                scope.dataProvider = dataProvider;

                function updateCssClass() {
                    if (!scope.isSorted) {
                        scope.cssClass = "";
                    } else {
                        scope.cssClass = scope.sortDirectionDescending ? "sorter-desc" : "sorter-asc";
                    }
                }

                scope.isSorted = false;
                scope.sortDirectionDescending = true;

                elem.on("click", function () {
                    $timeout(function () {
                        dataProvider.orderBy(sortProperty, !scope.sortDirectionDescending);
                    });
                });

                scope.$watch("dataProvider.getCurrentViewSettings().orderBy", function (sortSettings) {
                    if (!sortSettings) {
                        scope.isSorted = false;
                        scope.sortDirectionDescending = true;
                    } else {
                        scope.isSorted = sortProperty === sortSettings.expression;
                        scope.sortDirectionDescending = scope.isSorted ? sortSettings.reverse : true;
                    }

                    updateCssClass();
                });
            }
        };
    });


    /**
     * Allows to change a view mode of the row.
     * Can only be used as an attribute. Its value specifies name of the target view mode.
     */
    angular.module("lightGridControls").directive("lgSwitchView", function () {
        "use strict";

        return {
            require: "^?lgRow",
            link: function (scope, elem, attrs, rowController) {
                var viewName = attrs.lgSwitchView;

                elem.on("click", function () {
                    rowController.switchView(viewName);

                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                });
            }
        };
    });


    /**
     * Opens or closes the expanded view of the row.
     * This can be only used as an attribute . It's value specifies the name of the template
     * used as an expanded row content.
     */
    angular.module("lightGridControls").directive("lgToggleExpandedRow", function () {
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


}(window, window.angular, window.jQuery));