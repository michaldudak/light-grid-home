using Newtonsoft.Json;

namespace Web.Models
{
	public class Zip
	{
		[JsonProperty("city")]
		public string City { get; set; }

		[JsonProperty("loc")]
		public double[] Loc { get; set; }

		[JsonProperty("pop")]
		public int Pop { get; set; }

		[JsonProperty("state")]
		public string State { get; set; }

		[JsonProperty("_id")]
		public string Id { get; set; }
	}
}