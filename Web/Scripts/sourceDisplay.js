angular.module("lightGridSamples").directive("sourceDisplay", ["$compile", function($compile) {
	return {
		template: "<div class='source-display'>" +
			"<h3>JS</h3><pre class='js-source lang-javascript'></pre>" +
			"<h3>HTML</h3><pre class='html-source lang-html'></pre>" +
			"</div>",
		link: function($scope, $elem) {
			var parent = $elem.parent();
			var script = parent.find("> script");

			var html = parent.find("> div[ng-controller]");
			html.removeAttr("ng-non-bindable");
			var clonedHtml = html.clone();
			$compile(html)($scope);

			var jsDisplay = $elem.find(".js-source");
			var htmlDisplay = $elem.find(".html-source");

			var formattedJs = script.html()
				.replace(/^\t/gm, '')
				.replace(/^\s/, '');

			jsDisplay.text(formattedJs);

			var formattedHtml = clonedHtml.html()
				.replace(/^\t/gm, '')
				.replace(/^\s/, '')
				.replace(/=""/g, '');

			htmlDisplay.text(formattedHtml);

			hljs.highlightBlock(jsDisplay[0]);
			hljs.highlightBlock(htmlDisplay[0]);
		}
	}
}]);
