using System.Web.Mvc;

namespace Web.Controllers
{
	public class DocsController : Controller
	{
		public ActionResult Partial(string viewName)
		{
			return PartialView(viewName);
		}
	}
}