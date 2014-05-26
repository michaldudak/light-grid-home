using System.Web.Mvc;

namespace Web.Controllers
{
	public class DemosController : Controller
	{
		public ActionResult Partial(string viewName)
		{
			return PartialView(viewName);
		}
	}
}