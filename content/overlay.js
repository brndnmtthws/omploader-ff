/*
 * $Id$
 *
 * Copyright 2007 David Shakaryan <omp@gentoo.org>
 * Copyright 2007 Brenden Matthews <brenden@rty.ca>
 * Copyright 2007 Jeff Glover <jeff.web@sigmatheory.com>
 *
 * Distributed under the terms of the GNU General Public License v3
 *
 */

var omploader = {
	onLoad: function() {
		// initialization code
		this.postVars = new Array();
		this.postVars['url'] = "url1";
		this.postVars['file'] = "file1";

// 		this.ompHost = "http://test.peemail.org";  // for testing
		this.ompHost = "http://omploader.org";

		this.ompURL = this.ompHost + "/upload";
		
		this.ompFileURL = this.ompHost + "/file";

		this.Cc = Components.classes;
		this.Ci = Components.interfaces;
		this.ioService =
			this.Cc['@mozilla.org/network/io-service;1'].getService(this.Ci.nsIIOService);

		this.initialized = true;
		this.strings = document.getElementById("omploader-strings");
		
		// set to false to support the file:// protocol
		// this doesn't work, only use if for development
		this.noSupportFile = true;

		this.multipart_boundary = "-----------------------------" + new Date().getTime();

		this.contextMenu = document.getElementById("contentAreaContextMenu");
		this.contextMenu.addEventListener("popupshowing", this.showContextMenu, false);
	},

	showContextMenu: function(event) {
	// show or hide the menuitem based on what the context menu is on
	// see http://kb.mozillazine.org/Adding_items_to_menus
		var menuMain = document.getElementById("context-omploader");
		var menuImage = document.getElementById("omploader-image-menuitem");
		var menuBGImage = document.getElementById("omploader-bgimage-menuitem");
		var menuLink = document.getElementById("omploader-link-menuitem");
		var menuPage = document.getElementById("omploader-page-menuitem");

		var numVisibleMenuItems = 0;
	
		if(gContextMenu.onImage && omploader.checkSupported(gContextMenu.target.currentURI.scheme)) {
			numVisibleMenuItems++;
			menuImage.hidden = false;
			menuImage.setAttribute("tooltiptext", gContextMenu.target.currentURI.spec);
			menuImage.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.target.currentURI)");
		}
		else
			menuImage.hidden = true;
	
		if(gContextMenu.hasBGImage) {
			var uri = omploader.URLtoURI(gContextMenu.bgImageURL);
			if (omploader.checkSupported(uri.scheme))
				menuBGImage.hidden = true;
			else {
				numVisibleMenuItems++;
				menuBGImage.hidden = false;
				menuBGImage.setAttribute("tooltiptext", gContextMenu.bgImageURL);
				menuBGImage.setAttribute("oncommand", "omploader.onMenuItemURLCommand(gContextMenu.bgImageURL)");
			}
		}
		else
			menuBGImage.hidden = true;
	
		if(gContextMenu.onLink && omploader.checkSupported(gContextMenu.linkURI.scheme)) {
			numVisibleMenuItems++;
			menuLink.hidden = false;
			menuLink.setAttribute("tooltiptext", gContextMenu.linkURI.spec);
			menuLink.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.linkURI)");
		}
		else
			menuLink.hidden = true;
	
		var pageuri = omploader.URLtoURI(content.document.location.href);
		if(omploader.checkSupported(pageuri.scheme)) {
			numVisibleMenuItems++;
			menuPage.hidden = false;
			menuPage.setAttribute("tooltiptext", pageuri.spec);
		}
		else
			menuPage.hidden = true;

		if (numVisibleMenuItems > 0) {
			menuMain.setAttribute("tooltiptext", omploader.strings.getString("omploaderLabel"));
			menuMain.setAttribute("disabled", "false");
		}
		else {
			menuMain.setAttribute("tooltiptext", omploader.strings.getString("disableFile"));
			menuMain.setAttribute("disabled", "true");
		}
	},

	checkSupported: function(string) {
		if (string == "file" && this.noSupportFile)
			return false;
		else
			return true;
	},

	onContextMenuItemCommand: function(uri) {
		//alert( uri.spec );
		this.ompLoadURI(uri);
	},

	onMenuItemURLCommand: function(url) {
		this.ompLoadURI(this.URLtoURI(url));
	},

	onMenuItemCommand: function(e) {
		var uri;

		uri = this.URLtoURI(content.document.location.href);

		if(omploader.checkSupported(uri.scheme)) {
			this.ompLoadURI(uri);
		}
	},

	onToolbarButtonCommand: function(e) {
		this.onMenuItemCommand(e);
	},

	URLtoURI: function(url) {
		return this.ioService.newURI(url, null, null);
	},

	updateToolsPopup: function(e) {
		var menuTools = document.getElementById("omploader-tools");
		var pageuri = this.URLtoURI(content.document.location.href);

		if (this.checkSupported(pageuri.scheme)) {
			menuTools.setAttribute("tooltiptext", pageuri.spec);
			menuTools.setAttribute("disabled", "false");
		}
		else {
			menuTools.setAttribute("tooltiptext", this.strings.getString("disableFile"));
			menuTools.setAttribute("disabled", "true");
		}
	},

	ompLoadURI: function(uri) {
		if(uri.scheme == "file" && !this.checkSupported(uri.scheme)) {
			alert("Ompload does not yet support omploading local files.\n\nUser contributions are welcome. If you are interested in helping omploader, http://developer.mozilla.org/en/docs/XMLHttpRequest may be a good start to omplement this feature. In addition the ImageBot extension (http://pimpsofpain.com/imagebot.html) also uses similar functionality.");
		}

		else if(uri.scheme == "file" && this.checkSupported(uri.scheme)) {
			this.ompLoadFile(uri);
		}

		else {
			var dataString = this.postVars['url'] + "=\"" + uri.spec + "\"";
		
			// POST method requests must wrap the encoded text in a MIME
			// stream
			var stringStream = this.Cc["@mozilla.org/io/string-input-stream;1"].
				createInstance(this.Ci.nsIStringInputStream);
			if ("data" in stringStream) // Gecko 1.9 or newer
				stringStream.data = dataString;
			else // 1.8 or older
				stringStream.setData(dataString, dataString.length);
		
			var postData = this.Cc["@mozilla.org/network/mime-input-stream;1"].
				createInstance(this.Ci.nsIMIMEInputStream);
			postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
			postData.addContentLength = true;
			postData.setData(stringStream);
		
			gBrowser.addTab(this.ompURL, uri, null, postData);
		}
	},
	
	ompLoadFile: function(uri) {
		// first create the file for use with the input stream
		var nsIFile_file = this.Cc["@mozilla.org/file/local;1"].createInstance(this.Ci.nsILocalFile);
		nsIFile_file.initWithPath(uri.path);
		
		// this opens the file
		var nsIFileInputStream = this.Cc["@mozilla.org/network/file-input-stream;1"].createInstance(this.Ci.nsIFileInputStream);
		
// 		nsIFileInputStream.init(nsIFile_file, 1, 1,
// 			this.Ci.nsIFileInputStream.CLOSE_ON_EOF);
			
		nsIFileInputStream.init(nsIFile_file, 0x01, 00004, null); // i don't know what's allowed for these flags
		
		// this buffers that input
		var nsIBufferedInputStream = this.Cc["@mozilla.org/network/buffered-input-stream;1"].createInstance(this.Ci.nsIBufferedInputStream);
		nsIBufferedInputStream.init(nsIFileInputStream, 1024);
		
		// sets up the file meta data, not the actual file contents
		var nsIStringInputStream_start = this.Cc["@mozilla.org/io/string-input-stream;1"].createInstance(this.Ci.nsIStringInputStream);
		nsIStringInputStream_start.setData(this.getStreamData(nsIFile_file), -1);
		
		// end of data
		var nsIStringInputStream_end = this.Cc["@mozilla.org/io/string-input-stream;1"].createInstance(this.Ci.nsIStringInputStream);
		nsIStringInputStream_end.setData("\n" + this.multipart_boundary + "--\n", -1);

		var nsIMultiplexInputStream = this.Cc["@mozilla.org/io/multiplex-input-stream;1"].createInstance(this.Ci.nsIMultiplexInputStream);
		
		// multiplex everything together
		nsIMultiplexInputStream.appendStream(nsIStringInputStream_start);
		nsIMultiplexInputStream.appendStream(nsIBufferedInputStream);
		nsIMultiplexInputStream.appendStream(nsIStringInputStream_end);
		
		// encase all the data so content lengh will be calculated
		var postData = this.Cc["@mozilla.org/network/mime-input-stream;1"].
			createInstance(this.Ci.nsIMIMEInputStream);
		postData.addHeader("Content-Type", "multipart/form-data; boundary=" + this.multipart_boundary);
		postData.addContentLength = true;
		postData.setData(nsIMultiplexInputStream);
		
// 		var xmlr = new XMLHttpRequest();
// 		xmlr.open("POST", this.ompURL, false);
// 		xmlr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + this.multipart_boundary);
// 		xmlr.setRequestHeader("Content-Length", nsIMultiplexInputStream.available() - 2 );
// 		xmlr.setRequestHeader("Content-Length", nsIMultiplexInputStream.available());
		
// 		xmlr.send(postData);
		
// 		if ( xmlr.status != "200" )
// 			alert("Error: " + xmlr.status + "\nMessage: " + xmlr.responseText);
// 		else
// 			alert(xmlr.responseText);
		
// 		this.alertInputStream(postData);

		var refuri = this.ioService.newURI(this.ompFileURL, null, null);

		gBrowser.addTab(this.ompURL, refuri, null, postData);
	},
	
	getStreamData: function(nsIFile_file) {
		var file_name = nsIFile_file.leafName;
		
		var mimeType = "application/octet-stream";
		
		try {
			var mimeService = this.Cc["@mozilla.org/uriloader/external-helper-app-service;1"].getService(this.Ci.nsIMIMEService);
			
			mimeType = mimeService.getTypeFromFile(nsIFile_file);
		} catch (e) {
			mimeType = "application/octet-stream";
		}

		// not sure if \r\n or \n is proper... gay
	
// 		var result = this.multipart_boundary +
// 			"\r\nContent-Disposition: form-data; name=\"action\"\r\n\r\nupload\r\n" +
// 			this.multipart_boundary +
// 			"\r\nContent-Disposition: form-data; name=\"" + 
// 			this.postVars['file'] +
// 			"\"; filename=\"" + file_name + "\"\r\n" +
// 			"Content-Type: " + mimeType + "\r\n\r\n";

		var result = this.multipart_boundary +
// 			"\nContent-Disposition: form-data; name=\"action\"\n\nupload\n" +
// 			this.multipart_boundary +
			"\nContent-Disposition: form-data; name=\"" + 
			this.postVars['file'] +
			"\"; filename=\"" + file_name + "\"\n" +
			"Content-Type: " + mimeType + "\n\n";
		
// 		alert(result);
		
		return result;
	},
	
	// display a stream in an alert. use for debugging
	alertInputStream: function (nsiInputStream) {
		var charset = /* Need to find out what the character encoding is. Using UTF-8 for this example: */ "UTF-8";
		const replacementChar = this.Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
		var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
			.createInstance(Components.interfaces.nsIConverterInputStream);
		
		is.init(nsiInputStream, charset, 1024, 0xFFFD);
		
		
		var streamEnd = "";
		var streamBegin = "";
		var count = 0;
		
		if (is instanceof Components.interfaces.nsIUnicharLineInputStream) {
			var line = {};
			var cont;
			do {
				cont = is.readLine(line);

				// Now you can do something with line.value
				streamEnd = line.value;
				if (count < 9)
					streamBegin += line.value + "\n";
					
				count++;
				
			} while (cont);
		}
		
		is.close();
		
		alert(streamBegin);
// 		alert(streamEnd);
	}

};

window.addEventListener("load", function(e) { omploader.onLoad(e); }, false);

