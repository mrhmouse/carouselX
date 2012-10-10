(function($) {
jQuery.fn.carouselX = function(settings) {
	//
	//  Expects:
	//	  <div class='whatever'>
	//		  <div class='panel'>
	//			  content
	//		  </div>
	//		  <a class='tab'>
	//			  content
	//		  </a>
	//	  </div>
	// Default options
	settings = settings || {};
	loadSettings = function(x) {
		// Animation duration, in milliseconds.
		if (x.animationDuration == null) {
			x.animationDuration = 500;
		}

		// jQuery easing name.
		x.easing = x.easing || 'swing';

		// Tablist behavior. Accepted parameters also listed.
		x.tabMode = x.tabMode || 'centered' || 'fixed';
		if (x.hideWhenSingle == null) {
			x.hideWhenSingle = true;
		}
		
		return x;
	};
	
	// API
	var actions = {
		refresh: function(cookie, carousel) {
			var
			height = 0,
				width = 0;
			carousel.find('>.viewport>.panellist>.panel').each(function() {
				var outerHeight = $(this).children().first().outerHeight();
				if (height < outerHeight) {
					height = outerHeight;
				}
			});
			carousel.find('>.viewport').height(height);
			carousel.find('>.tabwindow>.tablist>.tab').each(function() {
				width += outerWidth = $(this).children().first().outerWidth();
			});
			carousel.find('>.tablist').width(width * 2);
			if (cookie != null && $.cookie != null && $.cookie(cookie) != null) {
				$('>.tabwindow>.tablist>.tab[href=' + $.cookie(cookie) + ']').triggerHandler('click');
			} else {
				carousel.find('>.tabwindow>.tablist>.tab').first().triggerHandler('click');
			}
		},
		next: function(carousel) {
			// Advance one slide.
			var next = 0;
			carousel.find('>.tabwindow>.tablist>.tab').each(function(index) {
				if ($(this).is('.current')) {
					next = index + 1;
					return false;
				}
			});
			next = next % carousel.find('>.tabwindow>.tablist>.tab').length;
			$(carousel.find('>.tabwindow>.tablist>.tab')[next]).triggerHandler('click');
		},
		previous: function(carousel) {
			// Retreat one slide.
			var prev = 0;
			carousel.find('>.tabwindow>.tablist>.tab').each(function(index) {
				if ($(this).is('.current')) {
					prev = index - 1;
					return false;
				}
			});
			while (prev < 0) {
				prev += carousel.find('>.tabwindow>.tablist>.tab').length;
			}
			prev = prev % carousel.find('>.tabwindow>.tablist>.tab').length;
			$(carousel.find('>.tabwindow>.tablist>.tab')[prev]).triggerHandler('click');
		},
		jump: function(carousel, index) {
			while (index < 0) {
				index += carousel.find('>.tabwindow>.tablist>.tab').length;
			}
			index = index % carousel.find('>.tabwindow>.tablist>.tab').length;
			$(carousel.find('>.tabwindow>.tablist>.tab')[index]).triggerHandler('click');
		}
	};

	return this.each(function(carousel) {
		if (settings.action == 'refresh') {
			actions.refresh(carousel + '-current-panel', $(this));
			return;
		} else if (settings.action == 'jump') {
			actions.jump($(carousel), settings['index'] || 0);
			return;
		} else if (settings.action != null && actions[settings.action] != null) {
			actions[settings.action]($(this));
			return;
		} else if (settings.action != null) {
			throw 'carouselX: Unknown action \'' + settings.action + '\', aborting.';
		}

		var
		$this = $(this),
			$panels = $($this.find('>div.panel')),
			$tabs = $($this.find('>a.tab')),
			$panelwindow = $('<div>'),
			$tabwindow = $('<div>'),
			$panellist = $('<div>'),
			$tablist = $('<div>'),

			resize = function() {
				// Adjust width of panel/tab list so that it is always wider than
				// the sum of the widths of its children
				$panels.each(function(index) {
					$panellist.width($panellist.width() + ($(this).outerWidth() * 2));
					$tablist.width($tablist.width() + ($($tabs[index]).outerWidth() * 2));
				});
			};
		
		// Load settings
		if ($this.attr('data-settings') != null)
		{
			$this.settings = loadSettings(eval('(' + $this.attr('data-settings') + ')'));
		} else {
			$this.settings = loadSettings(settings);
		}

		$panelwindow.addClass('viewport');
		$tabwindow.addClass('tabwindow');
		$tablist.addClass('tablist');
		$panellist.addClass('panellist');

		$panels.each(function(index) {
			// Apply unique IDs to each panel and set up tabs to link to them
			var id = $(this).attr('id') || 'slider-' + carousel + '-panel-' + index;
			$(this).attr('id', id);
			if ($tabs[index]) {
				$($tabs[index]).attr('href', '#' + id);
			}

			// Drop each panel into the list
			$(this).detach();
			$panellist.append($(this));

			// Drop the corresponding tab into its list
			if ($tabs[index]) {
				$($tabs[index]).detach();
				$tablist.append($($tabs[index]));
			}
		});


		// Build the structure.
		// Items go into lists go into windows
		$this.append($panelwindow);
		$this.append($tabwindow);
		$panelwindow.append($panellist);
		$tabwindow.append($tablist);


		// Hide the tabwindow if needed
		if ($panels.length <= 1 && $this.settings.hideWhenSingle) {
			$tabwindow.css('display', 'none');
		}

		resize();

		// Set up slide events for each tab
		$tabs.on('click', function(event) {
			// Clear out the current item
			$panels.removeClass('current');
			$tabs.removeClass('current');

			// Make this tab and its panel current.
			$(this).addClass('current');
			$panellist.find($(this).attr('href')).addClass('current');

			resize();

			var
			current = {
				panel: $($panellist.find('>.current.panel')),
				tab: $(this)
			},
				panel = {
					offset: 0
				},
				tab = {
					offset: 0
				};

			$panels.each(function(index) {
				// Get the offset of each panel and tab
				// prior to the current one
				if (!$(this).is('.current')) {
					panel.offset += $(this).outerWidth(true);
					tab.offset += $($tabs[index]).outerWidth(true);
				} else {
					return false;
				}
			});

			// Slide the panels
			$panellist.clearQueue();
			$panellist.animate({
				left: (0 - panel.offset) + 'px'
			}, $this.settings.animationDuration, $this.settings.easing);

			if ($this.settings.tabMode != 'fixed') {
				// Do nothing to the 
				// Slide the tabs such that the current tab is centered
				$tablist.clearQueue();
				$tablist.animate({
					left: (
						($tabwindow.outerWidth(true) / 2)
						- (tab.offset)
						- (current.tab.outerWidth(true) / 2)
					) + 'px'
				}, $this.settings.animationDuration, $this.settings.easing);
			}

			// Adjust new viewport height
			$panelwindow.height(current.panel.outerHeight());

			// Set panel cookie and prevent default behavior
			if ($.cookie != null) {
				$.cookie(carousel + '-current-panel', current.tab.attr('href'));
			}
			return false;
		});

		// Go ahead and refresh the damn thing.
		actions.refresh(null, $this);

		// If there's a callback, respect it
		if ($this.settings.callback != null) {
			$this.settings.callback();
		}
	});
};
})(jQuery);
