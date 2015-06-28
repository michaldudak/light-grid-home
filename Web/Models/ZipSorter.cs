using System.Collections.Generic;
using System.Linq;

namespace Web.Models
{
	public static class ZipSorter
	{
		public static IEnumerable<Zip> OrderByProperty(this IEnumerable<Zip> source, string propertyName)
		{
			switch (propertyName)
			{
				case "city":
					return source.OrderBy(z => z.City);

				case "loc[0]":
					return source.OrderBy(z => z.Loc[0]);

				case "loc[1]":
					return source.OrderBy(z => z.Loc[1]);

				case "pop":
					return source.OrderBy(z => z.Pop);

				case "state":
					return source.OrderBy(z => z.State);

				case "_id":
					return source.OrderBy(z => z.Id);

				default:
					return source;
			}
		}
	}
}