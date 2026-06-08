<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();

if (!$user) {
    echo json_encode([]);
    exit;
}

$userId = $user['id'];

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!isset($_GET['id'])) { echo json_encode(["error" => "Missing ID"]); exit; }
$songId = intval($_GET['id']);
try {
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$stmt = $pdo->prepare("
SELECT *
FROM chordapp_songs
WHERE id = ? AND user_id = ?
");
  $stmt->execute([$songId, $userId]);
  $song = $stmt->fetch(PDO::FETCH_ASSOC);
  $stmt = $pdo->prepare("SELECT * FROM chordapp_chords WHERE song_id = ?");
  $stmt->execute([$songId]);
  $chords = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(["song" => $song, "chords" => $chords]);
} catch (Exception $e) {
  echo json_encode(["error" => $e->getMessage()]);
}
?>
