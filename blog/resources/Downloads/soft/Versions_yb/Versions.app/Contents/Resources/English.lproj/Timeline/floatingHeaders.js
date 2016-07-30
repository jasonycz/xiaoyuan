// Floating headers

$(document).ready(function() { 
	var currentFloatingDay = null;
	var logDiv = document.getElementById("log");

	function findCurrentDay() {
		var currentScroll = $(document).scrollTop();

		if (currentFloatingDay && currentFloatingDay.parentNode != logDiv) {
			console.log("Header was removed, resetting")
			currentFloatingDay = null;
		}

		// Try to see if the current day is still the correct day.
		if (    currentFloatingDay
			 && $(currentFloatingDay).offset().top <= currentScroll /* The current header is still somewhere above */
			 && (!currentFloatingDay.nextSibling || $(currentFloatingDay.nextSibling).offset().top > currentScroll) /* Either there is next day, or the next day is somewhere below the page */
			)
				return currentFloatingDay;

		console.log("Doing it the long way");
		var lastDay = null;
		$(".day").each(function(i, el) {
			if ($(el).offset().top > currentScroll)
				return false;
			lastDay = el;
		})
		return lastDay;
	}

	function setClassForDay(day, c) {
		var header = $(".header", day);
		if (c == "normal")
			header.removeClass("floating scrolling").addClass("normal");
		else if (c == "floating")
			header.removeClass("normal scrolling").addClass("floating");
		else if (c == "scrolling")
			header.removeClass("normal floating").addClass("scrolling");
	}

	$(document).scroll(function() {
		var currentDay = findCurrentDay();
		// Restore the old div if we're going to show a new one
		if (currentFloatingDay != currentDay)
			setClassForDay($(currentFloatingDay), "normal");

		currentFloatingDay = currentDay;

		// Calculate whether we want to stick the header to the top,
		// or make it scroll away.
		var dayEnd = $(currentDay).offset().top + $(currentDay).outerHeight();
		var partStickingOut = dayEnd - $(document).scrollTop();

		// If the header is collapsed, we don't want it to have any special styl.
		// We use <= 1 here because we call this function in the animation callback
		// of jQuery. At that point, the height is still 1 (because of a margin somewhere?)
		// And thus would get the 'scrolling' class, which would then render wrong if the
		// header would expand right after that (because of a double-click on the header).
		if ($(currentDay).height() <= 1)
			setClassForDay(currentDay, "normal")
		else if (partStickingOut <= $(".header", currentDay).outerHeight())
			setClassForDay(currentDay, "scrolling");
		else
			setClassForDay(currentDay, "floating")
	});
});