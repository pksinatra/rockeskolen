<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!$user) {
    echo json_encode([]);
    exit;
}

$userId = $user['id'];

if (!isset($_GET['id'])) { echo json_encode(["error" => "Mangler ID"]); exit; }
$songId = intval($_GET['id']);
try {
$stmt = $pdo->prepare("
SELECT *
FROM chordapp_songs
WHERE id = ? AND user_id = ?
");
  $stmt->execute([$songId, $userId]);
  $song = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$song) {
    http_response_code(404);
    echo json_encode(["error" => "Fant ikke låten"]);
    exit;
  }

  $stmt = $pdo->prepare("SELECT * FROM chordapp_chords WHERE song_id = ?");
  $stmt->execute([$songId]);
  $chords = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(["song" => $song, "chords" => $chords]);
} catch (Exception $e) {
  echo json_encode(["error" => $e->getMessage()]);
}
?>
