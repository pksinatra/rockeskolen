<?php
// Arbeidsmappe for sikkerhetskopier og nedlastede noder – utenfor repoet. Kan overstyres med miljøvariabelen RS_WORK.
$WORK = getenv('RS_WORK') ?: sys_get_temp_dir().'/rockeskolen-publisering';
if (!is_dir("$WORK/nodes")) mkdir("$WORK/nodes", 0700, true);
