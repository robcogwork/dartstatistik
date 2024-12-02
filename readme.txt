=== Dartstatistik Plugin by CogWork ===
Contributors: Robert Wägar / Cogwork AB
Tags: Dart.se, dartstatistik, Cogwork
Requires at least: 5.0
Tested up to: 6.7
Stable tag: trunk
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

The Dartstatistik Plugin helps you display dart tournament information directly on your WordPress site. Perfect for local leagues, event organizers, or anyone showcasing dart competitions, it offers responsive layouts, filtering options, and easy-to-use shortcodes for seamless integration.

== Description ==

Key Features:
- **Dynamic Tournament Grid**: Responsive grids showcasing tournaments with details like name, date, and district.
- **Interactive Calendar**: Integrate a calendar powered by FullCalendar for visualizing tournament schedules.
- **Custom Filters**: Allow users to filter tournaments by district or category (e.g., Senior, Junior).
- **Shortcode Support**: Use flexible shortcodes like `[dartstatistik]` to customize the display.
- **Modal Popups**: View detailed invitations and event info without leaving the page.
- **Mobile-Friendly**: Fully responsive design ensures great usability on all devices.

== Installation ==

1. Upload the plugin folder to the `/wp-content/plugins/` directory or install it through the WordPress plugins screen.
2. Activate the plugin via the "Plugins" menu in WordPress.
3. Add the provided shortcodes to any page or post where you want to display dart tournament data.


== Frequently Asked Questions ==

= How do I display all tournaments? =
Use the shortcode `[dartstatistik]` to list all events from every district.

= Can I filter tournaments by district? =
Yes, use `[dartstatistik district="GDF"]`, replacing "GDF" with the desired district code.

= How do I limit the number of tournaments displayed? =
Add the `limit` parameter, e.g., `[dartstatistik limit="5"]`.

== Examples of Shortcodes ==
[dartstatistik] - List of all events/tournaments from every district.
[dartstatistik district="GDF"] - Filters tournaments by the specified district.
[dartstatistik calendar] - Displays an interactive calendar alongside the tournament grid.
[dartstatistik limit="5"] - Limits the number of tournaments displayed.
[dartstatistik showdistrict] - Displays category filter tabs for Swedish dart districts.
[dartstatistik type="juniorU25"] - Specifies the category type of tournaments (default: Senior).


== Screenshots ==
1. List view of dart tournaments.
2. Detailed Parameter and Flag Descriptions