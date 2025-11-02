<?php
echo "=== TEST KONFIGURACJI PHP ===\n\n";

// Podstawowe informacje
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Memory Limit: " . ini_get('memory_limit') . "\n";
echo "Max Execution Time: " . ini_get('max_execution_time') . "\n";
echo "Disabled Functions: " . ini_get('disable_functions') . "\n\n";

// Test bezpiecznych funkcji
echo "=== BEZPIECZNE FUNKCJE ===\n";
$safe_functions = ['strlen', 'substr', 'array_map', 'htmlspecialchars'];
foreach ($safe_functions as $func) {
    if (function_exists($func)) {
        echo "✅ $func: DZIAŁA\n";
    } else {
        echo "❌ $func: NIE DZIAŁA\n";
    }
}
// echo zawsze działa - to konstrukcja języka
echo "✅ echo: DZIAŁA (konstrukcja języka)\n";

echo "\n=== ZABLOKOWANE FUNKCJE ===\n";
$dangerous_functions = ['system', 'exec', 'shell_exec', 'eval'];
foreach ($dangerous_functions as $func) {
    if (function_exists($func)) {
        echo "❌ $func: DZIAŁA (POWINNO BYĆ ZABLOKOWANE!)\n";
    } else {
        echo "✅ $func: ZABLOKOWANE\n";
    }
}

echo "\n=== ROZSZERZENIA ===\n";
$required_extensions = ['curl', 'mbstring', 'openssl'];
foreach ($required_extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✅ $ext: ZAŁADOWANE\n";
    } else {
        echo "❌ $ext: BRAK\n";
    }
}

echo "\n=== KONIEC TESTU ===\n";
?>