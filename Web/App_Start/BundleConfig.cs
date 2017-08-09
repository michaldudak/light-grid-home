using System.Web.Optimization;

namespace Web
{
	public class BundleConfig
	{
		public static void RegisterBundles(BundleCollection bundles)
		{
			var scripts =
				new ScriptBundle("~/bundles/libraries")
					.Include("~/Scripts/angular.js")
					.Include("~/Scripts/angular-route.js")
					.Include("~/Scripts/jquery.js")
					.Include("~/Scritps/bootstrap.js");

			scripts.Transforms.Add(new JsMinify());
			bundles.Add(scripts);

			var samplesScripts =
				new ScriptBundle("~/bundles/samples")
					.Include("~/Scripts/light-grid.js")
					.Include("~/Scripts/highlight.pack.js")
					.Include("~/Scripts/demoApp.js")
					.Include("~/Scripts/utils.js");

			bundles.Add(samplesScripts);

			var styles = new StyleBundle("~/Content/css").Include("~/Content/bootstrap.css", "~/Content/site.css");
			styles.Transforms.Add(new CssMinify());
			bundles.Add(styles);
		}
	}
}
