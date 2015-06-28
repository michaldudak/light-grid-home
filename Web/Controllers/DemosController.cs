using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Hosting;
using System.Web.Mvc;
using Newtonsoft.Json;
using Web.Models;

namespace Web.Controllers
{
	public class DemosController : Controller
	{
		private static readonly IEnumerable<Zip> zips;

		static DemosController()
		{
			var filePath = HostingEnvironment.MapPath("~/Data/zips.json");
			var file = new FileInfo(filePath);
			string json;

			using (var reader = file.OpenText())
			{
				json = reader.ReadToEnd();
			}

			zips = JsonConvert.DeserializeObject<Zip[]>(json);
		}

		public ActionResult Partial(string viewName)
		{
			return PartialView(viewName);
		}

		public ActionResult SampleData(int? limit, int? begin, string search, string orderBy, bool? reverse)
		{
			IEnumerable<Zip> results = zips.ToList();

			if (!string.IsNullOrWhiteSpace(search))
			{
				results = results.Where(z => z.City.ToLowerInvariant().Contains(search.ToLowerInvariant()));
			}

			var totalResults = results.Count();

			if (!string.IsNullOrWhiteSpace(orderBy))
			{
				results = results.OrderByProperty(orderBy);
				if (reverse.GetValueOrDefault())
				{
					results = results.Reverse();
				}
				
			}

			if (begin.HasValue)
			{
				results = results.Skip(begin.Value);
			}

			if (limit.HasValue)
			{
				results = results.Take(limit.Value);
			}

			var model = new { data = results.Take(100), totalResults = totalResults };
			var outJson = JsonConvert.SerializeObject(model);

			return Content(outJson, "application/json");
		}

		[HttpPost]
		public ActionResult SampleData(Zip model)
		{
			return new EmptyResult();
		}
	}
}