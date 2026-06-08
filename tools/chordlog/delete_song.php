<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();

if (!$user) {
    echo json_encode([]);
    exit;
}

$userId = $user['id'];

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Invalid method"]);
    exit;
}

$id = intval($_POST["id"] ?? 0);

if (!$id) {
    echo json_encode(["success" => false, "error" => "Missing ID"]);
    exit;
}

$pdo->beginTransaction();

try {

    $stmt = $pdo->prepare("DELETE FROM chordapp_chords WHERE song_id = ?");
    $stmt->execute([$id]);

    $stmt = $pdo->prepare("DELETE FROM chordapp_songs WHERE id=? AND user_id=?");
    $stmt->execute([$id, $userId]);

    $pdo->commit();

    echo json_encode(["success" => true]);

} catch (Exception $e) {

    $pdo->rollBack();
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
