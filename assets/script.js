var clicked = false;
var current_index = 10;
var timer = null;

const cards = [
	'#card_project_mgmt',
	'#card_track_time',
	'#card_forecast',
	'#card_financials',
	'#card_pipeline'
];

const cores = [
	'#core_1',
	'#core_2',
	'#core_3',
	'#core_4',
	'#core_5',
	'#core_6'
];

const hotspots = [
	'#hotspots_project_mgmt',
	'#hotspots_track_time',
	'#hotspots_forecast',
	'#hotspots_financials',
	'#hotspots_pipeline'
];

// functions for enabling / disabling scrolling
// source: https://stackoverflow.com/questions/4770025/how-to-disable-scrolling-temporarily
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

// prevent mouse scroll events
function preventDefault(e) {
 	e.preventDefault();
}

// prevent keystroke scroll events
function preventDefaultForScrollKeys(e) {
	if (keys[e.keyCode]) {
		preventDefault(e);
		return false;
	}
}

// detect browser support
var supportsPassive = false;
try {
	window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
		get: function () { supportsPassive = true; } 
	}));
} catch(e) {}

// Chrome desktop and modern mobile browsers require { passive: false }
var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

function disableScroll() {
	window.addEventListener('DOMMouseScroll', preventDefault, false);
	window.addEventListener(wheelEvent, preventDefault, wheelOpt);
	// window.addEventListener('touchmove', preventDefault, wheelOpt);
	window.addEventListener('keydown', preventDefaultForScrollKeys, false);
	clicked = true;
}

function enableScroll() {
	window.removeEventListener('DOMMouseScroll', preventDefault, false);
	window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
	// window.removeEventListener('touchmove', preventDefault, wheelOpt);
	window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
	clicked = false;
}

// snap scroll to element
function scrollTo(id, zoom) {
	// return if we clicked the currently selected element
	if ($(id).hasClass('zoom')) { return; }
	// return if we're still in intro animation
	if (zoom && $(id).hasClass('intro')) { return; }

	// hide hotspots
	hotspots.forEach(function(hotspot) {
		$(hotspot).hide();
	});
	$('.popup-container').hide();

	// disable scrolling and scroll-snapping while executing
	disableScroll();

	// shift element to center of screen
	var card_top = $(id).offset().top;
	var scale_adjust = $(id).height()*0.2;
	card_top = current_index > cards.indexOf(id) ? card_top + scale_adjust : card_top - scale_adjust;
	var scrolltop_adjust = card_top - ($(window).height()/2 - $(id).height()/2);
	$('#infographic-container').animate({scrollTop: $('#infographic-container').scrollTop() + scrolltop_adjust}, 1200, function() {
		enableScroll();
		$("#infographic-container").css("scroll-snap-type", "y mandatory");
	});

	// zoom to card layer
	if (zoom) {
		zoomToCard(id);
	}
}

// zoom to selected card and separate adjacent layers
function zoomToCard(id) {
	cards.forEach(function(card) {
		if (card == (id)) {
			var index = cards.indexOf(card);
			current_index = index;

			// show hotpots after zoom animation is complete and remove extraneous highlighting
			$(card).addClass("zoom");
			setTimeout(function() {
				$(hotspots[index]).show();
				$('.card').removeClass('hovered');
			}, 1000);

			// get cores above and below to widen spacing
			var core_above = "#core_"+(index+1);
			var core_below = "#core_"+(index+2);

			// separate layers
			cores.forEach(function(core) {
				if (core == core_above || core == core_below) {
					$(core).addClass('core-separated');
				} else {
					$(core).removeClass('core-separated');
				}
			});
		} else {
			$(card).removeClass("zoom").removeClass("hovered");
		}
	});
}

// make sure there is enough space to center top card in screen
function checkBuffer() {
	var scroll_top = $('#infographic-container').scrollTop();
	var top = $('#card_project_mgmt').offset().top;
	var distance = scroll_top + top - $(".buffer").height();
	var height = $(window).height()/2 - $('#card_project_mgmt').height()/2;
	if (height > distance) {
		$(".buffer").animate({ height: height - distance }, 100);
	} else {
		$(".buffer").animate({ height: 0 }, 100);
	}
}

// detect when scrolling is done and select nearest card layer
// source: https://developpaper.com/implementation-of-css-scroll-snap-event-stop-and-element-position-detection/
function scrollListener() {
    clearTimeout(timer);
    // no scroll event detected for 100ms - select snapped-to element
    timer = setTimeout(function () {
    	var windowHeight = $(window).height();
		var cardHeight = $("#card_project_mgmt").height();
		var offset = (windowHeight - cardHeight) / 2;
		var current_card;
    	// find currently snapped element
    	cards.forEach(function(card) {
    		var top = $(card).offset().top;
    		if (current_card == null || Math.abs(offset - top) < Math.abs(offset - $(current_card).offset().top)) {
    			current_card = card;
    		}
    	});
    	// zoom to element if not already selected
    	if (!$(current_card).hasClass('zoom') && !clicked) {
    		scrollTo(current_card, true);
    	}
    }, 100);
}

// end of intro animation
function videoEnd() {
	// fade in infographic
	$("#infographic-container").fadeTo("slow", 1.0, function() {
		// fade out video
		$("#video-container").fadeOut("slow", function() {
			// remove intro classes
			$("#infographic-container").removeClass("intro");
			setTimeout(function(){
    			$(".card").removeClass("intro");
    			$(".core").removeClass("intro");
    			$(".row").removeClass("intro");
				setTimeout(function(){
	    			$(".header").removeClass("intro");
	    			// swap out intro images to make sure click and hover effects are working
	    			cards.forEach(function(card) {
	    				$(card+"_intro").hide();
	    				$(card).show();
	    			});
	    			cores.forEach(function(core) {
	    				$(core+"_intro").hide();
	    				$(core).show();
	    			})
	    			// enable map resizing and check distance buffer
			    	$('map').imageMapResize();
			    	checkBuffer();
				}, 500);
			}, 500);
		});
	});
}

window.onload = function() {

	$(window).on('resize', function(){
		checkBuffer();
	});

	// dismiss popups on screen click
	$(window).click(function(e) {
	    if (e.target.className.indexOf("hotspot") == -1) {
			$('.popup-container').hide();
	    }
	});

	// add click function to cards and core
	$('area').click(function() {
		if (!clicked) {
    		var id = $(this).attr('id').split("map_")[1];
			// temporarily disable scroll snapping for smooth animation
			$("#infographic-container").css("scroll-snap-type", "none");
			scrollTo("#card_"+id, true);
		}
	});
	$(".core").click(function() {
		if (!clicked) {
			var id = $(this).attr('id').split("_")[1];
			if (id < 6) {
				$("#infographic-container").css("scroll-snap-type", "none");
				scrollTo(cards[id-1], true);
			}
		}
	});

	// hotspot click functions
	$(".hotspot").click(function() {
		var id = $(this).attr('id').split("hotspot_")[1];
		// hide clicked hotspot if already visible
		if ($("#popup_"+id).is(":visible")) {
			$("#popup_"+id).hide();
		} else {
			// hide all hotspots
			$('.popup-container').hide();
			// show clicked hotspot
			$("#popup_"+id).show();
		}
	});

	// add image map hover effects
	$(".image-map area").mouseenter(function() {
		var id = $(this).attr('id').split("map_")[1];
		$("#card_"+id).addClass("hovered");
	});
	$(".image-map area").mouseleave(function() {
		var id = $(this).attr('id').split("map_")[1];
		$("#card_"+id).removeClass("hovered");
	});
	$(".core").mouseenter(function() {
		var id = $(this).attr('id').split("_")[1];
		if (id < 6) {
			$(cards[id-1]).addClass("hovered");
		}
	});
	$(".core").mouseleave(function() {
		var id = $(this).attr('id').split("_")[1];
		if (id < 6) {
    		$(cards[id-1]).removeClass("hovered");
    	}
	});

	// add scroll listener
	var container = document.getElementById('infographic-container');
	container.addEventListener('scroll', scrollListener);

	// add buffer if infographic too small for screen
	if ($('#infographic-rows').height() < $(window).height()) {
		$(".buffer").animate({ height: $(window).height()/2 - $('#infographic-rows').height()/2 }, 100);
	}

	// center infographic
	$('#infographic-container').animate({scrollTop: $('#infographic-container').scrollTop() + $("#video").height()*0.2}, 1200, function() {
	});

}