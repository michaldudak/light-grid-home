using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Hosting;

namespace Web.Services
{
	public class DocumentationFileProvider
	{
		private const string FirstItemTitle = "Overview";

		public DocumentationFileSources GetDocumentationFiles()
		{
			return new DocumentationFileSources
			{
				LightGridDocs = GetFilesInFolder("lightGrid"),
				ControlsDocs = GetFilesInFolder("controls"),
				DataProvidersDocs = GetFilesInFolder("dataProviders"),
				TemplatesDocs = GetFilesInFolder("templates")
			};
		}

		private ICollection<string> GetFilesInFolder(string folderName)
		{
			var viewsFolderPath = HostingEnvironment.MapPath($"~/Views/Docs/{folderName}");
			if (viewsFolderPath == null)
			{
				return new string[0];
			}

			var viewsFolder = new DirectoryInfo(viewsFolderPath);
			if (!viewsFolder.Exists)
			{
				return new string[0];
			}

			return viewsFolder
				.EnumerateFiles("*.cshtml")
				.Select(f => Path.GetFileNameWithoutExtension(f.Name))
				.OrderBy(n => n.ToLower() == FirstItemTitle.ToLower() ? string.Empty : n)
				.ToList();
		}
	}
}
