using System.Web.Optimization;

namespace Web
{
	public class BundleConfig
	{
		// For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
		public static void RegisterBundles(BundleCollection bundles)
		{
			var scripts =
				new ScriptBundle("~/bundles/libraries")
					.Include("~/Scripts/jquery-{version}.js")
					.Include("~/Scritps/bootstrap.js")
					.Include("~/Scripts/angular.js");

			scripts.Transforms.Add(new JsMinify());
			bundles.Add(scripts);

			var styles = new StyleBundle("~/Content/css").Include("~/Content/bootstrap.css", "~/Content/site.css");
			styles.Transforms.Add(new CssMinify());
			bundles.Add(styles);
		}
	}
}
