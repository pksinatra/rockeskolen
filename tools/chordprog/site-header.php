<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/app-header.php';
function chordlink_app_header_styles(): void {
    echo '<link rel="stylesheet" href="/includes/app-header.css?v=1">';
}
function chordlink_app_header(string $title): void { rs_render_app_header('tools'); }
function chordlink_share_meta(array $meta): void {}
