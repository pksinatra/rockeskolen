<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();
header('Content-Type: application/json');

if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Logg inn først."]);
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

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT id FROM chordapp_songs WHERE id=? AND user_id=? LIMIT 1");
    $stmt->execute([$id, $userId]);

    if (!$stmt->fetchColumn()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "Fant ikke låten"]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM chordapp_chords WHERE song_id = ?");
    $stmt->execute([$id]);

    $stmt = $pdo->prepare("DELETE FROM chordapp_songs WHERE id=? AND user_id=?");
    $stmt->execute([$id, $userId]);

    $pdo->commit();

    echo json_encode(["success" => true]);

} catch (Exception $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
