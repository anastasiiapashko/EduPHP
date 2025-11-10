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

// POŁĄCZENIE Z BAZĄ DANYCH Z RANDOM USER ID
$conn = new mysqli("localhost", "php_sandbox_user", "sandbox_password123", "eduphp_sandbox");
if ($conn->connect_error) {
    die("Błąd połączenia z bazą: " . $conn->connect_error);
}

// RANDOM USER ID DLA IZOLACJI DANYCH
$current_user_id = 16833; // Random ID: 16833

// NADPISANIE METOD QUERY DLA AUTOMATYCZNEJ IZOLACJI (PHP 8.1+ COMPATIBLE)
class SecuredMySQLi extends mysqli {
    private int $user_id;
    
    public function __construct(string $host, string $user, string $password, string $database, int $user_id) {
        parent::__construct($host, $user, $password, $database);
        $this->user_id = $user_id;
    }
    
    public function query(string $query, int $resultmode = MYSQLI_STORE_RESULT): mysqli_result|bool {
        $secured_query = $this->addUserIsolation($query);
        return parent::query($secured_query, $resultmode);
    }
    
    public function prepare(string $query): mysqli_stmt|false {
        $secured_query = $this->addUserIsolation($query);
        return parent::prepare($secured_query);
    }
    
    private function addUserIsolation(string $query): string {
        // Analiza zapytania SQL
        $query_upper = strtoupper(trim($query));
        
        // Dla SELECT - dodaj warunek user_id
        if (strpos($query_upper, 'SELECT') === 0) {
            return $this->modifySelectQuery($query);
        }
        
        // Dla INSERT - automatycznie dodaj user_id
        if (strpos($query_upper, 'INSERT') === 0) {
            return $this->modifyInsertQuery($query);
        }
        
        // Dla UPDATE/DELETE - dodaj warunek user_id
        if (strpos($query_upper, 'UPDATE') === 0 || strpos($query_upper, 'DELETE') === 0) {
            return $this->modifyUpdateDeleteQuery($query);
        }
        
        return $query;
    }
    
    private function modifySelectQuery(string $query): string {
        if (stripos($query, 'WHERE') !== false) {
            return preg_replace('/WHERE\s+/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) AND ', $query);
        } else {
            // Dodaj WHERE jeśli nie ma
            if (stripos($query, 'GROUP BY') !== false) {
                return preg_replace('/GROUP BY/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) GROUP BY', $query);
            } elseif (stripos($query, 'ORDER BY') !== false) {
                return preg_replace('/ORDER BY/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) ORDER BY', $query);
            } elseif (stripos($query, 'LIMIT') !== false) {
                return preg_replace('/LIMIT/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) LIMIT', $query);
            } else {
                return $query . ' WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL)';
            }
        }
    }

    private function modifyInsertQuery(string $query): string {
        // Sprawdź czy podano kolumny
        if (preg_match('/INSERT\s+INTO\s+\w+\s*\((.*?)\)/i', $query, $matches)) {
            // INSERT z kolumnami: INSERT INTO table (col1, col2) VALUES (val1, val2)
            $columns = $matches[1];
            $new_columns = $columns . ', user_id';
            
            // Dodaj wartość user_id do VALUES
            $query = preg_replace('/VALUES\s*\((.*?)\)/i', 'VALUES($1, ' . $this->user_id . ')', $query);
            $query = str_replace('(' . $columns . ')', '(' . $new_columns . ')', $query);
        } else {
            // INSERT bez kolumn: INSERT INTO table VALUES (val1, val2)
            $query = preg_replace('/VALUES\s*\((.*?)\)/i', 'VALUES($1, ' . $this->user_id . ')', $query);
        }
        
        return $query;
    }
    
    private function modifyUpdateDeleteQuery(string $query): string {
        if (stripos($query, 'WHERE') !== false) {
            return preg_replace('/WHERE\s+/i', 'WHERE user_id = ' . $this->user_id . ' AND ', $query);
        } else {
            return $query . ' WHERE user_id = ' . $this->user_id;
        }
    }
}

// ZASTĄP STANDARDOWE POŁĄCZENIE ZABEZPIECZONYM
$secured_conn = new SecuredMySQLi("localhost", "php_sandbox_user", "sandbox_password123", "eduphp_sandbox", $current_user_id);
if ($secured_conn->connect_error) {
    die("Błąd połączenia z bazą: " . $secured_conn->connect_error);
}

$conn = $secured_conn;

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
    $error_msg = 'RUNTIME_ERROR: ' . $e->getMessage();
    
    // Dodatkowa pomoc dla częstych błędów
    if (strpos($e->getMessage(), 'Column count doesn\'t match value count') !== false) {
        $error_msg .= "\n💡 Wskazówka: Upewnij się, że podajesz nazwy kolumn w INSERT: INSERT INTO tabela (kol1, kol2) VALUES (wart1, wart2)";
    }
    
    echo $error_msg . "\n";
} finally {
    if (isset($secured_conn)) {
        $secured_conn->close();
    }
}
?>