;(function() {

	/** HELPER FUNCTIONS **/
	var URL_REGEX = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:\'".,<>?«»“”‘’]))/i;
	var TICKET_REGEX = /([bB][uU][gG][zZ][iI][dD]:|#)(\d+|[A-Z]{2,8}-\d+)/;

	var config = {
		updateTimeout: 40, // milliseconds
		linkTickets: true,
		showFiles: true,
		showCompareAll: false
	}

	var commitQueue = [];
	var last_day = null;
	var last_day_div = null;

	// Replaces text in element that matches 'regex' with a dom-node returned by replaceFunction
	function linkify(element, regex, replaceFunction) {

		// Helper method that returns an array of DOM-elements for the given text node, with the
		// helper function called for every match.
		function replaceTextNode(textNode) {
			var newElements = [];
			var remainingText = textNode.nodeValue;
			while (remainingText && remainingText != "") {
				var match = remainingText.match(regex);
				if (!match) {
					newElements.push(document.createTextNode(remainingText));
					remainingText = null;
				} else {
					newElements.push(document.createTextNode(remainingText.substring(0, match.index)));
					newElements.push(replaceFunction(match))
					remainingText = remainingText.substring(match.index + match[0].length);
				}
			}
			return newElements;
		}

		// Loop over all text node elements. contents() returns all dom children.
		// nodeType 3 indicates a text node
		$(element).contents().each(function(i,node){
			if (node.nodeType !== document.TEXT_NODE)
				return;

			var linkedElements = replaceTextNode(node);

			// We can't replace a textnode with multiple elements at once.
			// Therefore, we wrap them in a span first, and then unwrap it later.
			var tempSpan = $("<span />").append(linkedElements);
			$(node).replaceWith(tempSpan)
			$(tempSpan.contents()).unwrap();
		})
	}

	function prettify(element) {
		linkify(element, URL_REGEX, function(match) { 
			// Add "http://" if it doesn't start with a protocol, ex. www.cnn.com or bit.ly/something
			var url = match[0];

			// Special case: If these are svn properties, don't highlight them. Just return a
			// text node with the contents of the URL.
			if (url.match(/^svn:[a-zA-Z_-]+$/))
				return document.createTextNode(url);

			// Special case: don't linkify BugzID URLs, they will be handled by the ticket linkifier
			if (url.match(/^bugzid:/i))
				return document.createTextNode(url);


			if (!url.match(/^[a-z0-9\+]+:/))
				url = "http://" + url;

			return $("<a />").addClass("url").attr("href", url).text(match[0])[0]
		});

		if (config.linkTickets) {
			linkify(element, TICKET_REGEX, function(match) { 
				var ticketLink = $("<span />").addClass("ticket").text(match[0]);
				ticketLink.click(function() {
					openTicketURLThroughVersions(match[2]);
				})
				return ticketLink[0];
			});
		}
	}

	function startOfDate(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	// Extend jQuery template system to add a plural tag
	$.extend($.tmpl.tag, {
		"plural": {
			_default: {  $2: "s" },
			open: "if(($notnull_1) && $1a && $1a != 1) {_.push($.encode(\"$2\"))}",
		}
	})

	// Versions interaction

	function openFileInVersions(path, revision, status) {
		if (typeof versions == "undefined") {
			console.log("clicked on file with path: " + path + " status: " + status + " revision: " + revision);
			return;
		}
		if (status == "modified")
			versions.showChangesForPathnameAndRevision(path, revision);
		else if (status == "deleted")
			versions.openPathnameFromRevision(path, revision - 1);
		else if (status == "added")
			versions.openPathnameFromRevision(path, revision );
		else
			console.log("Could not open file: " + path + "Because the status: '" + status + "' is unknown.");
	}

	function openTicketURLThroughVersions(ticket) {
		if (typeof versions == "undefined") {
			console.log("Would open ticket with id: " + ticket);
			return;
		}
		versions.openTicket(ticket);
	}

	/** event handlers **/
	function ondayclick(event) {
		// If the alt-key is pressed, we're going to open or close everything, instead of just this element.
		if (event.altKey) {
			var clickedElement = event.currentTarget;
			var isClosed = $(clickedElement).children(".disclosure").hasClass("closed");
			
			// This one is closed, open everything
			// Don't animate, there's too much
			if ($(".day").length > 10) {
				// This one is closed, open everything
				if (isClosed) {
					$(".collapse").show();
					$(".disclosure").removeClass("closed");
				} else {
					$(".collapse").hide();
					$(".disclosure").addClass("closed");
				}
			} else {
				if (isClosed) {
					$(".collapse").slideDown(250, function() { $(document).scroll(); });
					$(".disclosure").removeClass("closed");
				} else {
					$(".collapse").slideUp(250, function() { $(document).scroll(); });
					$(".disclosure").addClass("closed");
				}
			}
			return;
		}
		if ($(this).hasClass("scrolling") || $(this).hasClass("floating") && $(document).scrollTop() != $(this).parent().offset().top) {
			$(this).next(".collapse").toggle();
			$(document).scrollTop($(this).parent().offset().top);
		} else {
			$(this).next(".collapse").slideToggle(250, function() { $(document).scroll(); });
		}
		$(this).children(".disclosure").toggleClass("closed");
	}

	function oncommitclick() {
		// If the alt-key is pressed, we're going to open or closing all file lists, instead of just for this commit.
		if (event.altKey) {
			var isClosed = $(this).hasClass("hidden");
			var tooManyFiles = $(".item_list").length > 25 || $(".item_list .item").length > 100;
			
			// This one is closed, open everything
			if (isClosed) {
				tooManyFiles ? $(".item_list").show() : $(".item_list").slideDown(250);
				$(".file_list_control").removeClass("hidden");
			} else {
				tooManyFiles ? $(".item_list").hide() : $(".item_list").slideUp(250);
				$(".file_list_control").addClass("hidden");
			}
			return;
		}
		
		var baseDiv = $(this).parent().parent();
		if ($(".item_list .item", baseDiv).length > 50) {
			baseDiv.find(".item_list").toggle();
		} else {
			baseDiv.find(".item_list").slideToggle(250);
		}

		$(this).toggleClass("hidden");
	}

	function onloadmoreclick() {
		// Return early if we're not allowed to load now
		if (!$("#more").hasClass("load"))
			return;

		if (typeof versions == "undefined") {
			console.log("Would load more revisions now");
			return;
		}

		versions.showMoreChanges();
	}
	/** HTML Generation Functions **/

	// Templates we use for strings, which don't require a whole script block in the HTML file
	$.template("day-status-string", "${commits} Commit{{plural commits}}, ${files} Item{{plural files}}");
	$.template("commit-template", $("#commit_template"));
	$.template("file-template", $("#file_template"));

	var day_hash = {};

	function createDayDiv(date, dateString) {
		var dayDiv = $.tmpl($("#day_template"), { day:dateString || date.toString() });
		day_hash[date.getTime()] = { 
			commits: 0,
			files: 0,
			summary_div: dayDiv.find(".summary")
		}
		return dayDiv;
	}

	function updateDayInfo(date, files) {
		// Get the old info, and add the data
		var day_info = day_hash[date.getTime()];
		day_info.commits +=1;
		day_info.files += files;

		// Update the HTML string
		var statusString = $.tmpl("day-status-string", day_info);
		day_info.summary_div.html(statusString);
	}

	function generateFileDiv(status, path, path_end, isDirectory, clickfn) {
		var text = '<div class="item">\
			<span class="status ' + status + '">' + status + '&nbsp;</span>'
		
		if (isDirectory)
			text += '<span class=dir>'
		else
			text += '<a>'

		text += path;
		if (path_end)
			text += '<span class=file>' + path_end + '</span>';
		if (isDirectory)
			text += '</span>'
		else
			text += "</a>";
		text += '</div>';

		var div = $(text);

		if (!isDirectory) {
			var link = div.find("a");
			link.click(clickfn);
		}
		return div;
	}

	var more_is_hidden = true;

	function _addCommit(info, files, parent_day) {
		info = $.extend({}, info);
		info.filecount = files.length;

		var revision = info.revision;
		var commitDiv = $.tmpl("commit-template", info)
		var itemList = $(commitDiv).children(".item_list");

		// Add the files: generate the template for each file,
		// add the onclick handler, and then add it to the itemList
		var f = []
		$(files).each(function commit_files_each(i, file) {
			var path = file.path;
			var path_end;

			// See if we can highlight the last path component
			var match = path.match(/^(.*\/)([^/]+$)/);
			if (match) {
				path = match[1];
				path_end = match[2];
			}
			var clickfn;
			if (!file.isDirectory)
				clickfn = function() { openFileInVersions(file.path, revision, file.status); };

			var file_div = generateFileDiv(file.status, path, path_end, file.isDirectory, clickfn);
			f.push(file_div);
		})

		if (!config.showFiles) {
			$(".file_list_control", commitDiv).addClass("hidden");
			$(".item_list", commitDiv).hide();
		}

		if (!config.showCompareAll) {
			$(".compare_control", commitDiv).hide();
		} else if (files.length == 1) {
			$(".compare_control", commitDiv).text("Compare")
		}

		$(".compare_control", commitDiv).click(function() {
			versions.compareAllChangesInRevision(revision);
		});

		$(f).appendTo(itemList);
		prettify(commitDiv.find(".message p"));

		// Actually add it to the DOM
		commitDiv.appendTo($(parent_day).children(".collapse"));
		if (more_is_hidden) {
			$("#more").show();
			more_is_hidden = false;
		}
	}

	function _clearCommits() {
		$("#log").empty();
		$("#more").hide();
		more_is_hidden = true;
		scrollTo(0,0);
		last_day_div = null;
		last_day = null;
	}

	/*  */
	function addScheduledCommit(date, data, files) {
		var this_day = startOfDate(date);
		if (!last_day || last_day.getTime() != this_day.getTime()) {
			last_day = this_day;
			last_day_div = createDayDiv(this_day, data.dateString);
			last_day_div.appendTo($("#log"));
		}
		if (!data.time)
			data.time = "T" + date.getHours() + ":" + date.getMinutes();
		_addCommit(data, files, last_day_div);
		updateDayInfo(this_day, files.length);
	}

	var timelineTimer = null;

	function timelineRunLoop() {
		var numCommitsAdded = 0;
		while (commitQueue.length > 0 && numCommitsAdded < 10) {
			var runloopData = commitQueue.shift();
			
			if (typeof runloopData === "function") {
				runloopData();
				continue;
			} else if ( runloopData.type === "commit") {
				addScheduledCommit(runloopData.data[0], runloopData.data[1], runloopData.data[2])
				numCommitsAdded++;
			} else if (runloopData.type == "clear") {
				// Only clear if the clear has been scheduled for at least 100ms, or we have commits following this.
				var t = new Date().getTime() - runloopData.queueDate;
				if (commitQueue.length > 0 || t > 100) {
					_clearCommits();
				} else { // Reschedule for next run
					commitQueue.push(runloopData);
					break;
				}
			}
		}
		if (commitQueue.length > 0)
			timelineTimer = setTimeout(timelineRunLoop, config.updateTimeout);
		else
			timelineTimer = null;
	}

	var addToQueue = function(obj) {
		if (!timelineTimer)
			timelineTimer = setTimeout(timelineRunLoop, config.updateTimeout);

		commitQueue.push(obj);
	};

	var clearQueue = function(obj) {
		if (timelineTimer) {
			clearTimeout(timelineTimer);
			timelineTimer = null;
		}
		commitQueue = [];
	}

	var overlay_animation = null;
	var overlay_resize_event = function resize() { $("#overlay_progress").css("left", (window.innerWidth / 2) + "px"); };
	var overlay_show_timer = null;


	/** Public API **/
	$.timeline = {
		queue: function() { return commitQueue; },
		queueFunction: function(fn) { addToQueue(fn); },
		addCommit: function public_addCommit(date, data, files) { addToQueue({ type:"commit", data:[date, data, files]}); },

		setConfig: function public_setConfig(option, value) { config[option] = value; },
		logSomething: function(message) { console.log("Message from Obj-C: " + message); },

		clearCommits: function public_clearCommits() {
			// Instead of clearing the commits right now, we push an action on the commit queue.
			// We do this so that if you load new commits immediately afterwards, the screen
			// won't flicker. This times out after 100ms, at which point the commits are cleared
			// anyway.
			clearQueue();
			addToQueue({type:"clear", queueDate:new Date().getTime()});
		},

		displayError: function public_displayError(messageID, errorMessage) {
			console.log("Showing " + messageID + " with the message: " + errorMessage);
			$(".message").hide();
			var messageDiv = $("#" + messageID);
			if (messageDiv.length == 0) {
				console.log("Couldn't find div to display message!")
				return;
			}

			messageDiv.show();
			messageDiv.find(".explanation").html(errorMessage);
		},

		setProgressState: function(state) {
			var allElements = [ "#messages", "#timeline", "#more.progress", "#more.end", "#more.load", "#more.disabled"];
			var displayedElements = [];
			var showLoadMoreProgressSpinner = false;
			
			var isRetina = function(){
			    var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
			                      (min--moz-device-pixel-ratio: 1.5),\
			                      (-o-min-device-pixel-ratio: 3/2),\
			                      (min-resolution: 1.5dppx)";
				var root = (typeof exports == 'undefined' ? window : exports);

			    if (root.devicePixelRatio > 1)
			      return true;

			    if (root.matchMedia && root.matchMedia(mediaQuery).matches)
			      return true;

			    return false;
		  	};

			var isScreenRetina = isRetina();

			switch(state) {
				case "LOADING":
					displayedElements = ["#timeline", "#more.disabled"]
				break;
				case "ERROR":
					displayedElements = ["#messages"];
				break;
				case "IDLE":
					displayedElements = ["#timeline", "#more.load"]
				break;
				case "LOADING_MORE":
					displayedElements = ["#timeline", "#more.progress"]
					var showLoadMoreProgressSpinner = true;
				break;
				case "INITIAL":
					displayedElements = [];
				break;
				case "FINISHED":
					displayedElements = ["#timeline", "#more.end"];
				break;
				case "EMPTY":
					$.timeline.displayError("history", "");
					displayedElements = ["#messages"];
				break;
			}

			$(allElements).each(function(i, element) {
				var shouldBeDisplayed = displayedElements.indexOf(element) > -1

				var m = element.match(/^(.+)\.(.+)$/);
				if (m) {
					if (shouldBeDisplayed)
						$(m[1]).addClass(m[2])
					else
						$(m[1]).removeClass(m[2])
				} else {
					if (shouldBeDisplayed)
						$(element).show();
					else 
						$(element).hide();
				}
			});
			
			if (showLoadMoreProgressSpinner) {
				var filename = isScreenRetina ? "progress_small_grey@2x.png" : "progress_small_grey.png";
				$("#more_progress").animatePNG(filename, 15, 15, 11, {fps: 20, horizontal: false});
			} else {
				$("#more_progress").stopAnimatePNG();
				$("#more_progress .animation").remove();
			}
		}
		
	};

	/* Preparing the document */
	$(document).ready(function() { 
		$("#more").click(onloadmoreclick);

		// Add event handlers for clicking on days / file show.
		// These are added as 'live' events, which means they'll
		// also work for new days / commits added to the DOM
		$(".file_list_control")
			.live("mousedown", function () { return false; })
			.live("click", oncommitclick);

		$(".path a").live("mousedown", function () { return false; });
		$(".day .header")
			.live("mousedown", function() { return false; })
			.live("click", ondayclick);

		if (typeof versions != "undefined")
			versions.setJavascriptObject($.timeline);
	});
})();

// Functions accessible from Objective-C

function __addCommit(date, formattedDate, formattedTime, revision, username, commitmessage, files) {
	var data = { revision: revision, username: username, commitmessage: commitmessage, dateString:formattedDate, time:formattedTime };
	var real_files = [];

	var i = 0;
	for (i; i < files.length; ++i) {
		statusses = { M: "modified", A: "added", D: "deleted", R: "replaced"};
		var y = files[i]
		real_files[i] = { path: y[0], status: statusses[y[1]], isDirectory: y[2] }
	}
	var d = new Date(date);
                                                                         
	$.timeline.addCommit(new Date(date), data, real_files);
}

function __makeInactive() {
	$("body").addClass("inactive")
}

function __makeActive() {
	$("body").removeClass("inactive")
}

function __setConfig(option, value) {
	$.timeline.setConfig(option, value);
}

function runBenchmark() {
	console.profile();
	var start;
	$.timeline.queueFunction(function() { start = Date.now(); })
	var i= 0;
	var date = new Date();
	for (i= 0; i < 150; ++i) {
		if (Math.random() > 0.8)
			date = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
		$.timeline.addCommit(date, { revision: 12344, username: "Pieter", commitmessage: "Hey, het werkt" }, [{status: "replaced", path: "Some/Very/Long/File/Path/to/nothing"}, {status: "added", path: "Some/Very/Long/File/Path/to/nothing"}, {status: "added", path: "Some/Very/Long/File/Path/to/nothing"}, {status: "added", path: "Some/Very/Long/File/Path/to/nothing"}, { status: "modified", path: "somewhere/else/a/file"}]);
	}
	$.timeline.addCommit(new Date(), { revision: 12343, username: "Pieter", time: "12:34", commitmessage: "Hey, het werkt" }, [{status: "added", path: "Some/Very/Long/File/Path/to/nothing"}, { status: "modified", path: "somewhere/else/a/file"}]);
	$.timeline.addCommit(new Date(2010, 9, 3, 20, 15), { revision: 12342, username: "Pieter", time: "12:34", commitmessage: "Hey, het werkt#123. Now go checkout http://we.are.sometihng! or radr://23423#432." }, [{status: "added", path: "Some/Very/Long/File/Path/to/nothing"}, { status: "modified", path: "somewhere/else/a/file"}]);
	$.timeline.addCommit(new Date(2010, 9, 3, 18, 30), { revision: 12300, username: "Pieter", time: "12:34", commitmessage: "Hey, het werkt" }, [{status: "added", path: "this/is/a/directory", isDirectory:true}, { status: "modified", path: "somewhere/else/a/file"}]);
	$.timeline.addCommit(new Date(2010, 9, 3, 8, 22), { revision: 12299, username: "Pieter", time: "12:34", commitmessage: "Hey, het werkt" }, [{status: "deleted", path: "something/else/here"}]);
	$.timeline.addCommit(new Date(2010, 9, 2, 8, 22), { revision: 12299, username: "Pieter", time: "12:34", commitmessage: "Hey, het werkt. I read it on www.cnn.com, so bit.ly/4234eo it must be true!" }, [{status: "deleted", path: "this/is/a/directory", isDirectory:true}]);
	$.timeline.queueFunction(function() { console.log("Duration: " + (Date.now() - start) / 1000.0  + "seconds"); console.profileEnd();});
	
}

function bench(f) {
	var start = Date.now();
	f();
	console.log("Total duration: " + (Date.now() - start)/1000.0 + " seconds.");
}

// Things to do when not running in Versions
if (typeof versions == "undefined") {
	$(document).ready(function() {
		$("#remote").css("display", "");

		runBenchmark();

	});
}