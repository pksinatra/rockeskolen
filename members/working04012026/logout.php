<?php
require __DIR__ . '/config.php';
unset($_SESSION['user_chordlink']);
header("Location: /members/login.php?logged_out=1");
exit;
