using System.Web.Mvc;
using Web.Services;

namespace Web.Controllers
{
	public class HomeController : Controller
	{
		public ActionResult Index()
		{
			return View();
		}

		public ActionResult Overview()
		{
			return View();
		}

		public ActionResult Api()
		{
			var docProvider = new DocumentationFileProvider();
			return View(docProvider.GetDocumentationFiles());
		}

		public ActionResult Demos()
		{
			return View();
		}
	}
}
