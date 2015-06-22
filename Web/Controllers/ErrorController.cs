using System.Web.Mvc;

namespace Web.Controllers
{
	public class ErrorController : Controller
	{
		public ActionResult NotFound()
		{
			return View();
		}
	}
}