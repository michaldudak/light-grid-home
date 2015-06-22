using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Web.Controllers;

namespace Web
{
	public class MvcApplication : HttpApplication
	{
		protected void Application_Start()
		{
			AreaRegistration.RegisterAllAreas();
			FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
			RouteConfig.RegisterRoutes(RouteTable.Routes);
			BundleConfig.RegisterBundles(BundleTable.Bundles);
		}

		protected void Application_EndRequest()
		{
			if (Context.Response.StatusCode == 404)
			{
				Response.Clear();

				var rd = new RouteData();
				rd.Values["controller"] = "Error";
				rd.Values["action"] = "NotFound";

				IController c = new ErrorController();
				c.Execute(new RequestContext(new HttpContextWrapper(Context), rd));
			}
		}
	}
}
