using System.Web.Mvc;
using System.Web.Routing;

namespace Web
{
	public class RouteConfig
	{
		public static void RegisterRoutes(RouteCollection routes)
		{
			routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

			routes.MapRoute("Demos", "Demos/{viewName}", new { controller = "Demos", action = "Partial" });
			routes.MapRoute("Default", "{action}", new { controller = "Home", action = "Index" });
		}
	}
}
