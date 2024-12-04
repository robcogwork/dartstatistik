<?php
/**
 * Plugin Name: Dartstatistik Plugin
 * Description: Displays dart events and optionally a calendar. Supports parameters for districts, limits, types, and layout toggles.
 * Version: 1.0.5
 * Requires at least: 5.0
 * Requires PHP: 7.2
 * Author: Cogwork AB
 * Author URI: https://minaaktiviteter.se/cogwork
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: dartstatistik
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueue Scripts and Styles
 */
function dartstatistik_enqueue_assets() {
    // Enqueue FullCalendar CSS and JS
    wp_enqueue_script(
        'fullcalendar-js',
        'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.js',
        array('jquery'),
        '5.11.0',
        true
    );
    wp_enqueue_style(
        'fullcalendar-css',
        'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.css',
        array(),
        '5.11.0'
    );

    // Enqueue plugin scripts and styles
    wp_enqueue_script(
        'dartstatistik-js',
        plugin_dir_url(__FILE__) . 'js/script.js',
        array('jquery', 'fullcalendar-js'),
        '1.4.0',
        true
    );

    wp_localize_script('dartstatistik-js', 'dartPluginData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'siteUrl' => get_site_url(),
    ));

    wp_enqueue_style(
        'dartstatistik-css',
        plugin_dir_url(__FILE__) . 'css/style.css',
        array('fullcalendar-css'),
        '1.4.0'
    );
}
add_action('wp_enqueue_scripts', 'dartstatistik_enqueue_assets');

/**
 * Handle AJAX Requests
 */
function dartstatistik_fetch_data() {
    // Retrieve and sanitize parameters
    $district = isset($_GET['district']) ? sanitize_text_field($_GET['district']) : '';
    $type = isset($_GET['type']) ? sanitize_text_field($_GET['type']) : 'senior';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 0;

    // Construct the API URL
    $url = "https://dartstatistik.se/tournInfo.php";
    $query_params = array();

    if ($district !== '') {
        $query_params['sdf'] = $district;
    }

    if (!empty($type)) {
        $query_params['type'] = ($type === 'junior') ? 'juniorU25' : $type;
    }

    if (!empty($query_params)) {
        $url = add_query_arg($query_params, $url);
    }

    // Fetch data from the API
    $response = wp_remote_get($url);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Failed to fetch data']);
    }

    $data = wp_remote_retrieve_body($response);

    if (json_decode($data) === null) {
        wp_send_json_error(['message' => 'Invalid JSON format']);
    }

    $decoded_data = json_decode($data, true);

    // Apply limit if specified
    if ($limit > 0 && isset($decoded_data['DR'][$type]['tourn'])) {
        $decoded_data['DR'][$type]['tourn'] = array_slice($decoded_data['DR'][$type]['tourn'], 0, $limit);
    }

    wp_send_json_success($decoded_data);
}
add_action('wp_ajax_dartstatistik_fetch', 'dartstatistik_fetch_data');
add_action('wp_ajax_nopriv_dartstatistik_fetch', 'dartstatistik_fetch_data');

/**
 * Shortcode to Display Events
 */
function dartstatistik_shortcode($atts) {
    $atts = shortcode_atts(
        array(
            'type' => 'senior', // Default to 'senior'
            'district' => '',
            'limit' => 0,
            'calendar' => '', // Presence of 'calendar' determines visibility
            'showdistrict' => 'false', // Default to 'false' if not specified
        ),
        $atts,
        'dartstatistik'
    );

    $type = esc_attr($atts['type']);
    $district = esc_attr($atts['district']);
    $limit = intval($atts['limit']);
    $showCalendar = isset($atts['calendar']) && filter_var($atts['calendar'], FILTER_VALIDATE_BOOLEAN);
    $showDistrict = isset($atts['showdistrict']) && filter_var($atts['showdistrict'], FILTER_VALIDATE_BOOLEAN);
    $containerClass = $showCalendar ? 'with-calendar' : 'no-calendar';

    ob_start();
    ?>
    <div class="dartstatistik-container <?php echo esc_attr($containerClass); ?>" 
        data-type="<?php echo esc_attr($type); ?>"
        data-district="<?php echo esc_attr($district); ?>" 
        data-limit="<?php echo esc_attr($limit); ?>" 
        data-show-calendar="<?php echo $showCalendar ? 'true' : 'false'; ?>"
        data-show-district="<?php echo $showDistrict ? 'true' : 'false'; ?>">
        <?php
        if ($showDistrict) {
            echo dartstatistik_generate_tabs($showDistrict);
        }
        ?>
        <div class="dartstatistik-inner-container">          
            <div class="tournament-grid"></div>
            <?php if ($showCalendar) : ?>
                <div class="event-calendar"></div>
            <?php endif; ?>
        </div>

        <!-- Modals -->
        <div class="image-modal">
            <div class="modal-content">
                <iframe src="" frameborder="0"></iframe>
                <button class="close-modal" onclick="closeModal()">X</button>
            </div>
        </div>

        <div class="calendar-modal">
            <div class="calendar-modal-content">
                <button class="close-calendar-modal" onclick="closeCalendarModal()">X</button>
                <div class="calendar-modal-event-content"></div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('dartstatistik', 'dartstatistik_shortcode');

/**
 * Generate Tabs
 */
function dartstatistik_generate_tabs($showDistrict) {
    ob_start();
    ?>
    <div class="tabs-container">
        <?php if ($showDistrict): ?>
            <div class="district-tabs">
                <button class="tab district-tab active" data-district="">Alla Distrikt</button>
                <?php
                $districts = ["GDF", "NDF", "SkDF", "StDF", "SveDF", "UDF", "VDF"];
                foreach ($districts as $dist) : ?>
                    <button class="tab district-tab" data-district="<?php echo esc_attr($dist); ?>"><?php echo esc_html($dist); ?></button>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
