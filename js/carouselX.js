/* @require "/Scripts/javascript/jquery.js" */
(function ($) {
    jQuery.fn.carouselX = function (settings) {
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
        loadSettings = function (x) {
            // Animation duration, in milliseconds.
            x = x || {};
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

        // Private members
        var
            select = {
                child: {
                    panels: '>.viewport>.panellist>.panel',
                    tabs: '>.tabwindow>.tablist>.tab',
                },
                containerFor: {
                    panels: '>.viewport>.panellist',
                    tabs: '>.tabwindow>.tablist'
                },
                all: {
                    panels: '.panel',
                    tabs: '.tab'
                }
            },
            actions;

        // API
        this.actions = {
            refresh: function (carousel, settings) {
                var
                    height = 0,
                    width = 0,
                    panels = carousel.find(select.child.panels),
                    tabs = carousel.find(select.child.tabs);

                panels.each(function (i) {
                    var outerHeight = $(this).children().first().outerHeight();
                    if (height < outerHeight) {
                        height = outerHeight;
                    }
                    width += $(tabs[i]).children().first().outerWidth();
                });

                carousel.find('>.viewport').height(height);
                carousel.find(select.containerFor.tabs).width(width * 2);

                // Rebind handlers
                carousel.find('*').andSelf().unbind('click');
                init(carousel, settings);

                if ($.cookie != null && $.cookie(carousel + '-current-panel') != null) {
                    $(select.all.tabs + '[href=' + $.cookie(carousel + '-current-panel') + ']').triggerHandler('click');
                } else {
                    carousel.find(select.child.tabs).first().triggerHandler('click');
                }
            },

            resize: function (carousel) {
                var
                    panels = carousel.find(select.child.tabs),
                    tabs = carousel.find(select.child.tabs),
                    $containerFor = {
                        panels: $(carousel.find(select.containerFor.panels)),
                        tabs: $(carousel.find(select.containerFor.tabs))
                    };
                // Adjust width of panel/tab list so that it is always wider than
                // the sum of the widths of its children
                panels.each(function (index) {
                    $containerFor.panels.width($containerFor.panels.width() + ($(this).outerWidth() * 2));
                    $containerFor.tabs.width($containerFor.tabs.width() + ($(tabs[index]).outerWidth() * 2));
                });
            },

            next: function (carousel) {
                // Advance one slide.
                var
                    next = 0,
                    tabs = carousel.find(select.child.tabs);
                tabs.each(function (index) {
                    if ($(this).is('.current')) {
                        next = index + 1;
                        return false;
                    }
                });
                next = next % tabs.length;
                $(tabs[next]).triggerHandler('click');
            },

            previous: function (carousel) {
                // Retreat one slide.
                var
                    prev = 0,
                    tabs = carousel.find(select.child.tabs);
                tabs.each(function (index) {
                    if ($(this).is('.current')) {
                        prev = index - 1;
                        return false;
                    }
                });
                while (prev < 0) {
                    prev += tabs.length;
                }
                prev = prev % tabs.length;
                $(tabs[prev]).triggerHandler('click');
            },

            jump: function (carousel, index) {
                var tabs = carousel.find(select.child.tabs);
                while (index < 0) {
                    index += tabs.length;
                }
                index = index % tabs.length;
                $(tabs[index]).triggerHandler('click');
            },

            remove: function (carousel, index) {
                var
                    tabs = carousel.find(select.child.tabs),
                    panels = carousel.find(select.child.panels);
                while (index < 0) {
                    index += tabs.length;
                }
                index = index % tabs.length;
                $(tabs[index]).remove();
                $(panels[index]).remove();
            },

            append: function (carousel, panel, tab, wrap) {
                if (wrap == null) {
                    wrap = true;
                }

                var $tabs = $(carousel.find(select.containerFor.tabs)),
                    $panels = $(carousel.find(select.containerFor.panels)),
                    _tab = document.createElement('a'),
                    _panel = document.createElement('div');

                if (wrap) {
                    _tab.className = 'tab';
                    _tab.appendChild(tab)
                    _panel.className = 'panel';
                    _panel.appendChild(panel);

                    _tab.attributes.href = '#' + ($(select.all.tabs).length + 1) + '-appended-panel';
                    _panel.id = ($(select.all.tabs) + 1) + '-appended-panel';
                } else {
                    _tab = tab;
                    _panel = panel;
                }

                $tabs.append(_tab)
                $panels.append(_panel);
            }
        };

        // Make actions accessible within this function.
        actions = this.actions;

        var init = function (carousel, settings) {
            var
                $panels = carousel.find(select.child.panels),
                $tabs = carousel.find(select.child.tabs),
                $panellist = carousel.find(select.containerFor.panels).first(),
                $tablist = carousel.find(select.containerFor.tabs).first(),
                $panelwindow = $panellist.parent(),
                $tabwindow = $tablist.parent();

            settings = loadSettings(settings);

            // Set up click events for tabs
            $tabs.on('click', function (event) {
                // Clear out the current item
                $panels.removeClass('current');
                $tabs.removeClass('current');

                // Make this tab and its panel current.
                $(this).addClass('current');
                $panellist.find($(this).attr('href')).addClass('current');

                // Go ahead and resize to account for animated current tabs, etc..
                actions.resize(carousel);

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

                // Get the offset of each panel and tab
                // prior to the current one
                $panels.each(function (index) {
                    if (!$(this).is('.current')) {
                        panel.offset += $(this).outerWidth(true);
                        tab.offset += $($tabs[index]).outerWidth(true);
                    } else {
                        return false;
                    }
                });

                // Slide the panels & tabs
                $panellist.clearQueue();
                $panellist.animate({
                    left: (0 - panel.offset) + 'px'
                }, settings.animationDuration, settings.easing);

                if (settings.tabMode != 'fixed') {
                    // Slide the tabs such that the current tab is centered
                    $tablist.clearQueue();
                    $tablist.animate({
                        left: (
                            ($tabwindow.outerWidth(true) / 2)
                            - (tab.offset)
                            - (current.tab.outerWidth(true) / 2)
                        ) + 'px'
                    }, settings.animationDuration, settings.easing);
                }

                // Adjust new viewport height
                $panelwindow.height(current.panel.outerHeight());

                // Set panel cookie and prevent default behavior
                if ($.cookie != null) {
                    $.cookie(carousel + '-current-panel', current.tab.attr('href'));
                }
                return false;
            });
        };

        // The actual meat & potatoes
        return this.each(function (carousel) {
            var $this = $(this);
            // Load settings
            if ($this.attr('data-settings') != null) {
                $this.settings = loadSettings(eval('(' + $this.attr('data-settings') + ')'));
            } else {
                $this.settings = loadSettings(settings);
            }

            if (settings.action == 'refresh') {
                actions.refresh($(this), $this.settings);
                return;
            } else if (settings.action != null && actions[settings.action] != null) {
                actions[settings.action]($(this));
                return;
            } else if (settings.action != null) {
                throw 'carouselX: Unknown action \'' + settings.action + '\', aborting.';
            }

            var
                $panels = $($this.find('>div.panel,' + select.child.panels)),
                $tabs = $($this.find('>a.tab,' + select.child.tabs)),
                $panelwindow = $('<div>'),
                $tabwindow = $('<div>'),
                $panellist = $('<div>'),
                $tablist = $('<div>');

            $panelwindow.addClass('viewport');
            $tabwindow.addClass('tabwindow');
            $tablist.addClass('tablist');
            $panellist.addClass('panellist');

            $panels.each(function (index) {
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

            // Go ahead and refresh the damn thing.
            actions.resize($this);
            actions.refresh($this);

            // If there's a callback, respect it
            if ($this.settings.callback != null) {
                $this.settings.callback();
            }
        });
    };
})(jQuery);