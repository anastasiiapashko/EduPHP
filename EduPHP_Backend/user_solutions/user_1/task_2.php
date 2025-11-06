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

// POŁĄCZENIE Z BAZĄ DANYCH
$conn = new mysqli("localhost", "php_sandbox_user", "sandbox_password123", "eduphp_sandbox");
if ($conn->connect_error) {
    die("Błąd połączenia z bazą: " . $conn->connect_error);
}

try {
// Alias - ale nadal używa $conn
function get_mysqli() {
    global $conn;
    return $conn;
}

$result = get_mysqli()->query("SELECT * FROM customers");
while($row = $result->fetch_assoc()) {
    echo $row['name'] . "\n";
}
} catch (Throwable $e) {
    echo 'RUNTIME_ERROR: ' . $e->getMessage() . "\n";
} finally {
    // ZAMKNIĘCIE POŁĄCZENIA Z BAZĄ
    if (isset($conn)) {
        $conn->close();
    }
}
?>