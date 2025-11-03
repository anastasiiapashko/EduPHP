<?php
// AUTO-GENERATED SECURITY WRAPPERS - EduPHP
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('max_execution_time', 10);
ini_set('memory_limit', '128M');
set_time_limit(10);

// Wyłącz niebezpieczne funkcje
disable_functions();

function disable_functions() {
    $dangerous = ['system','exec','passthru','shell_exec','popen','proc_open',
                  'curl_exec','eval','assert','create_function'];
    ini_set('disable_functions', implode(',', $dangerous));
}
disable_functions();

try {
echo "Hello, My friends, lalalalala!";
} catch (Throwable $e) {
    echo 'RUNTIME_ERROR: ' . $e->getMessage() . "\n";
}
?>