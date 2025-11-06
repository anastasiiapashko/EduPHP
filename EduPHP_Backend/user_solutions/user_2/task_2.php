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

// AUTOMATYCZNE POŁĄCZENIE Z BAZĄ DANYCH
$db_host = 'localhost';
$db_user = 'php_sandbox_user';
$db_pass = 'sandbox_password123';
$db_name = 'eduphp_sandbox';

// Globalne zmienne z połączeniami
$mysqli_conn = null;
$pdo_conn = null;

// Automatyczne połączenie MySQLi
function get_mysqli() {
    global $mysqli_conn, $db_host, $db_user, $db_pass, $db_name;
    if ($mysqli_conn === null) {
        $mysqli_conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
        if ($mysqli_conn->connect_error) {
            die('MySQLi Connection failed: ' . $mysqli_conn->connect_error);
        }
    }
    return $mysqli_conn;
}

// Automatyczne połączenie PDO
function get_pdo() {
    global $pdo_conn, $db_host, $db_user, $db_pass, $db_name;
    if ($pdo_conn === null) {
        try {
            $pdo_conn = new PDO('mysql:host=' . $db_host . ';dbname=' . $db_name, $db_user, $db_pass);
            $pdo_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die('PDO Connection failed: ' . $e->getMessage());
        }
    }
    return $pdo_conn;
}

// Automatyczne zamknięcie połączeń na końcu
function close_connections() {
    global $mysqli_conn, $pdo_conn;
    if ($mysqli_conn) $mysqli_conn->close();
    $pdo_conn = null;
}
register_shutdown_function('close_connections');

try {
$result = get_mysqli()->query("SELECT * FROM customers");
while($row = $result->fetch_assoc()) {
    echo $row['name'] . "\n";
}
} catch (Throwable $e) {
    echo 'RUNTIME_ERROR: ' . $e->getMessage() . "\n";
}
?>