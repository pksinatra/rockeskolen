<?php
// /members/paypal_complete.php
require __DIR__ . '/config.php';
require_login();

header('Content-Type: application/json; charset=utf-8');

$user = current_user();
$userId = $user['id'] ?? null;

if (!$userId) {
    echo json_encode(['ok' => false, 'error' => 'No user']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$orderID = $data['orderID'] ?? null;
if (!$orderID) {
    $orderID = 'paypal-' . time() . '-' . $userId;
}

$amountCents = 0;
$currency = 'NOK';

if (!empty($data['details']['purchase_units'][0]['amount']['value'])) {
    $amountStr = $data['details']['purchase_units'][0]['amount']['value']; // e.g. "29.00"
    $amountCents = (int) round(floatval($amountStr) * 100);
}
if (!empty($data['details']['purchase_units'][0]['amount']['currency_code'])) {
    $currency = $data['details']['purchase_units'][0]['amount']['currency_code'];
}

try {
    // Avoid duplicates
    $check = $pdo->prepare("SELECT id FROM " . PAYMENT_TABLE . " WHERE provider = 'paypal' AND provider_ref = ?");
    $check->execute([$orderID]);

    if (!$check->fetch()) {
        $ins = $pdo->prepare("
            INSERT INTO " . PAYMENT_TABLE . " (user_id, provider, provider_ref, amount_cents, currency, status, created_at, confirmed_at)
            VALUES (?, 'paypal', ?, ?, ?, 'succeeded', NOW(), NOW())
        ");
        $ins->execute([$userId, $orderID, $amountCents, $currency]);
    }

    // Upgrade user to Pro
    $upd = $pdo->prepare("UPDATE " . USER_TABLE . " SET role = 'pro' WHERE id = ?");
    $upd->execute([$userId]);

    // Refresh session
    $sel = $pdo->prepare("SELECT id, email, role FROM " . USER_TABLE . " WHERE id = ?");
    $sel->execute([$userId]);
    if ($row = $sel->fetch(PDO::FETCH_ASSOC)) {
        set_current_user($row);
    }

    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    error_log("PayPal complete error: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => 'Server error']);
}
