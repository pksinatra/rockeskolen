<?php
$root = $_GET['root'] ?? 'C';
$type = $_GET['type'] ?? 'major';
?>

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Guitar Scale</title>
  <link rel="stylesheet" href="guitar-scale.css">
</head>
<body>

<div id="guitar"></div>

<script>
const ROOT = "<?= $root ?>";
const TYPE = "<?= $type ?>";
</script>

<script src="guitar-scale.js"></script>
</body>
</html>
