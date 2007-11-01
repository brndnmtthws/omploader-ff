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
	
		if(gContextMenu.onImage) {
			numVisibleMenuItems++;
			menuImage.hidden = false;
			menuImage.setAttribute("tooltiptext", gContextMenu.target.currentURI.spec);
			menuImage.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.target.currentURI)");
		}
		else
			menuImage.hidden = true;
	
		if(gContextMenu.hasBGImage) {
			var uri = omploader.URLtoURI(gContextMenu.bgImageURL);
			numVisibleMenuItems++;
			menuBGImage.hidden = false;
			menuBGImage.setAttribute("tooltiptext", gContextMenu.bgImageURL);
			menuBGImage.setAttribute("oncommand", "omploader.onMenuItemURLCommand(gContextMenu.bgImageURL)");
		}
		else
			menuBGImage.hidden = true;
	
		if(gContextMenu.onLink) {
			numVisibleMenuItems++;
			menuLink.hidden = false;
			menuLink.setAttribute("tooltiptext", gContextMenu.linkURI.spec);
			menuLink.setAttribute("oncommand", "omploader.onContextMenuItemCommand(gContextMenu.linkURI)");
		}
		else
			menuLink.hidden = true;
	
		var pageuri = omploader.URLtoURI(content.document.location.href);

		numVisibleMenuItems++;
		menuPage.hidden = false;
		menuPage.setAttribute("tooltiptext", pageuri.spec);


		if (numVisibleMenuItems > 0) {
			menuMain.setAttribute("tooltiptext", omploader.strings.getString("omploaderLabel"));
			menuMain.setAttribute("disabled", "false");
		}
		else {
			menuMain.setAttribute("tooltiptext", omploader.strings.getString("disableFile"));
			menuMain.setAttribute("disabled", "true");
		}
	},

	onContextMenuItemCommand: function(uri) {
		this.ompLoadURI(uri);
	},

	onMenuItemURLCommand: function(url) {
		this.ompLoadURI(this.URLtoURI(url));
	},

	onMenuItemCommand: function(e) {
		var uri;

		uri = this.URLtoURI(content.document.location.href);

		this.ompLoadURI(uri);
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

		menuTools.setAttribute("tooltiptext", pageuri.spec);
		menuTools.setAttribute("disabled", "false");
	},

	ompLoadURI: function(uri) {
		if(uri.scheme == "file")
			this.ompLoadLocalFile(uri);

		else
			this.ompLoadPostData(uri);
	},
	
	ompLoadLocalFile: function(uri) {
		var newTab = gBrowser.addTab(this.ompFileURL);
		gBrowser.selectedTab = newTab;
		
		window.addEventListener("load", ompLoadEvent = function(e) { omploader.onLoadPageLoad(e, uri); }, true);
		
	},
	
	onLoadPageLoad: function(event, uri) {
		if (event.originalTarget instanceof HTMLDocument) {
			window.removeEventListener("load",  ompLoadEvent, true);
			var doc = event.originalTarget;
			var filebox = doc.getElementsByTagName("input");
			try {
				for (var cnt = 0; cnt < filebox.length; cnt++) {
					if (filebox[cnt].name == "file1")
						filebox[cnt].value = uri.spec;
				}
			} catch(e) {
				// meh
			}
			
		}

	},
	
	ompLoadPostData: function(uri) {
	
		var dataString = this.postVars['url'] + "=" + uri.spec;
		
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

};

window.addEventListener("load", function(e) { omploader.onLoad(e); }, false);

