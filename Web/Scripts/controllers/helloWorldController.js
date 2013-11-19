(function (app, ng) {

	app.controller("helloWorldDemoController", function($scope) {
		$scope.model = [
			{ make: "Honda", model: "VFR800" },
			{ make: "BMW", model: "R 1200 GS" },
			{ make: "Kawasaki", model: "Z1000 SX" }
		];
	});

}(window.demoApp, window.angular));