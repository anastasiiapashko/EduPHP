package com.polsl.EduPHP.Service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;

import java.io.*;
import java.nio.file.*;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
 //Twoje konto
@Service
@Transactional
public class PHPExecutorService {
    
	@Autowired
    private SandboxUserService sandboxUserService;
	
    @Value("${php.executor.path:C:\\Users\\Lenovo\\Documents\\workspace-spring-tool-suite-4-4.29.1.RELEASE\\EduPHP - git\\EduPHP\\php\\php.exe}")
    private String phpExecutablePath;
    
    @PostConstruct
    public void init() {
        checkPHPAvailability();
    }
    
    private void checkPHPAvailability() {
        try {
            File phpFile = new File(phpExecutablePath);
            System.out.println("=== PHP DEBUG INFO ===");
            System.out.println("PHP Path: " + phpExecutablePath);
            System.out.println("File exists: " + phpFile.exists());
            System.out.println("Is file: " + phpFile.isFile());
            System.out.println("Can execute: " + phpFile.canExecute());
            System.out.println("Absolute path: " + phpFile.getAbsolutePath());
            
            // Test wykonania
            ProcessBuilder pb = new ProcessBuilder(phpExecutablePath, "--version");
            Process process = pb.start();
            String versionOutput = readProcessOutput(process);
            System.out.println("PHP Version: " + versionOutput);
            System.out.println("=== END PHP DEBUG ===");
            
        } catch (Exception e) {
            System.err.println("PHP NOT AVAILABLE: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @Value("${php.solutions.directory:user_solutions}")
    private String solutionsDirectory;
    
    @Value("${php.temp.directory:temp}")
    private String tempDirectory;
    
    // Zapisz rozwiązanie użytkownika na stałe - NADPISUJE istniejący plik
    public String saveUserSolution(Integer userId, Integer taskId, String phpCode) throws IOException {
        Path userDir = prepareUserDirectory(userId);
        String filename = generateSolutionFilename(taskId); // Tylko task_X.php
        Path solutionFile = userDir.resolve(filename);
        
        String securedCode = addPHPSecurityWrappers(phpCode, userId);
        
        // Nadpisz plik jeśli istnieje, utwórz jeśli nie istnieje
        Files.writeString(solutionFile, securedCode, 
            StandardOpenOption.CREATE, 
            StandardOpenOption.TRUNCATE_EXISTING, 
            StandardOpenOption.WRITE);
        
        System.out.println("Zapisano/aktualizowano plik: " + solutionFile.toAbsolutePath());
        return solutionFile.toString();
    }
    
    // Pobierz ostatnie rozwiązanie użytkownika - teraz szuka tylko task_X.php
    public String getLastUserSolution(Integer userId, Integer taskId) throws IOException {
        Path userDir = Paths.get(solutionsDirectory, "user_" + userId);
        if (!Files.exists(userDir)) {
            return "<?php\n// Napisz swoje rozwiązanie tutaj\n?>";
        }
        
        // Szukaj pliku task_X.php (bez timestampu)
        Path solutionFile = userDir.resolve("task_" + taskId + ".php");
        if (Files.exists(solutionFile)) {
           String content = Files.readString(solutionFile);
            return extractUserCode(content);
        }
        
        // Fallback: szukaj starych plików z timestampem (dla kompatybilności)
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(userDir, 
             "task_" + taskId + "_*.php")) {
            
            Path latestFile = null;
            for (Path file : stream) {
                if (latestFile == null || 
                    Files.getLastModifiedTime(file).compareTo(Files.getLastModifiedTime(latestFile)) > 0) {
                    latestFile = file;
                }
            }
            
            if (latestFile != null) {
                // Przenieś stary plik do nowej nazwy (bez timestampu)
                String content = Files.readString(latestFile);
                String userCode = extractUserCode(content);
                Path newFile = userDir.resolve("task_" + taskId + ".php");
                Files.writeString(newFile, addPHPSecurityWrappers(userCode, userId), 
                    StandardOpenOption.CREATE, 
                    StandardOpenOption.TRUNCATE_EXISTING);
                
                // Usuń stary plik
                Files.deleteIfExists(latestFile);
                
                return userCode;
            }
        }
        
        return "<?php\n// Napisz swoje rozwiązanie tutaj\n?>";
    }
    
   // NOWA METODA - wyciąga tylko kod użytkownika z wrapperów
    private String extractUserCode(String wrappedCode) {
        if (wrappedCode == null || wrappedCode.trim().isEmpty()) {
            return "<?php\n// Napisz swoje rozwiązanie tutaj\n?>";
        }
        
        // Szukamy bloku try { ... } catch
        String tryBlockStart = "try {";
        String tryBlockEnd = "} catch (Throwable $e) {";
        
        int tryStart = wrappedCode.indexOf(tryBlockStart);
        int tryEnd = wrappedCode.indexOf(tryBlockEnd);
        
        if (tryStart != -1 && tryEnd != -1) {
            // Wyciągamy kod z bloku try
            int userCodeStart = tryStart + tryBlockStart.length();
            String userCode = wrappedCode.substring(userCodeStart, tryEnd).trim();
            
            // Jeśli użytkownik miał własne tagi PHP, zachowujemy je
            if (userCode.startsWith("<?php")) {
                return userCode;
            } else {
                // Dodajemy tagi PHP jeśli ich nie ma
                return "<?php\n" + userCode + "\n?>";
            }
        }
        
        // Fallback: jeśli nie znaleziono wrapperów, zwróć oryginalny kod
        return wrappedCode;
    }
    
    private Path prepareTempDirectory() throws IOException {
        Path tempDir = Paths.get(tempDirectory);
        Files.createDirectories(tempDir);
        return tempDir;
    }
    
    private Path prepareUserDirectory(Integer userId) throws IOException {
        Path userDir = Paths.get(solutionsDirectory, "user_" + userId);
        Files.createDirectories(userDir);
        return userDir;
    }
    
    // Pliki tymczasowe nadal mają timestamp (to jest OK)
    private Path createTempPHPFile(Path tempDir, Integer userId, Integer taskId, String phpCode) 
            throws IOException {
        String filename = String.format("temp_%d_%d_%s.php", 
            userId, taskId, LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmssSSS")));
        Path phpFile = tempDir.resolve(filename);
        
        String securedCode = addPHPSecurityWrappers(phpCode, userId);
        Files.writeString(phpFile, securedCode, StandardOpenOption.CREATE);
        
        System.out.println("Created temp file: " + phpFile.toAbsolutePath());
        return phpFile;
    }
    
    // Tylko task_X.php - bez timestampu
    private String generateSolutionFilename(Integer taskId) {
        return String.format("task_%d.php", taskId);
    }
    
    //Wrapper jest jako obudowa bezpieczeństwa, zapobiega uruchomiania złośliwego kodu, a kod usera daje w miejsce phpCode
    private String addPHPSecurityWrappers(String phpCode, Integer userId) {
        // Pobierz/generuj sandbox_id
        Integer sandboxUserId = sandboxUserService.getOrCreateSandboxUserId(userId);
        
        String cleanCode = phpCode.trim();
        if (cleanCode.startsWith("<?php")) {
            cleanCode = cleanCode.substring(5);
        }
        if (cleanCode.endsWith("?>")) {
            cleanCode = cleanCode.substring(0, cleanCode.length() - 2);
        }
        cleanCode = cleanCode.trim();
        
        return "<?php\n" +
        "// AUTO-GENERATED SECURITY WRAPPERS - EduPHP\n" +
        "error_reporting(E_ALL);\n" +
        "ini_set('display_errors', '1');\n" +
        "ini_set('max_execution_time', 5);\n" +
        "ini_set('memory_limit', '128M');\n" +
        "set_time_limit(10);\n" +
        "\n" +
        "// Wyłącz niebezpieczne funkcje\n" +
        "disable_functions();\n" +
        "\n" +
        "function disable_functions() {\n" +
        "    $dangerous = ['system','exec','passthru','shell_exec','popen','proc_open',\n" +
        "                  'curl_exec','eval','assert','create_function'];\n" +
        "    ini_set('disable_functions', implode(',', $dangerous));\n" +
        "}\n" +
        "disable_functions();\n" +
        "\n" +
        "// POŁĄCZENIE Z BAZĄ DANYCH Z RANDOM USER ID\n" +
        "$conn = new mysqli(\"localhost\", \"php_sandbox_user\", \"sandbox_password123\", \"eduphp_sandbox\");\n" +
        "if ($conn->connect_error) {\n" +
        "    die(\"Błąd połączenia z bazą: \" . $conn->connect_error);\n" +
        "}\n" +
        "\n" +
        "// RANDOM USER ID DLA IZOLACJI DANYCH\n" +
        "$current_user_id = " + sandboxUserId + "; // Random ID: " + sandboxUserId + "\n" +
        "\n" +
        "// NADPISANIE METOD QUERY DLA AUTOMATYCZNEJ IZOLACJI (PHP 8.1+ COMPATIBLE)\n" +
        "class SecuredMySQLi extends mysqli {\n" +
        "    private int $user_id;\n" +
        "    \n" +
        "    public function __construct(string $host, string $user, string $password, string $database, int $user_id) {\n" +
        "        parent::__construct($host, $user, $password, $database);\n" +
        "        $this->user_id = $user_id;\n" +
        "    }\n" +
        "    \n" +
        "    public function query(string $query, int $resultmode = MYSQLI_STORE_RESULT): mysqli_result|bool {\n" +
        "        echo \"DEBUG QUERY START ===\\n\";\n" +
        "        echo \"DEBUG Original query: $query\\n\";\n" +
        "        $secured_query = $this->addUserIsolation($query);\n" +
        "        echo \"DEBUG Modified query: $secured_query\\n\";\n" +
        "        echo \"DEBUG QUERY END ===\\n\\n\";\n" +
        "        return parent::query($secured_query, $resultmode);\n" +
        "    }\n" +
        "    \n" +
        "    public function prepare(string $query): mysqli_stmt|false {\n" +
        "        $secured_query = $this->addUserIsolation($query);\n" +
        "        return parent::prepare($secured_query);\n" +
        "    }\n" +
        "    \n" +
        "    private function addUserIsolation(string $query): string {\n" +
        "        // Analiza zapytania SQL\n" +
        "        $query_upper = strtoupper(trim($query));\n" +
        "        \n" +
        "        // Dla SELECT - dodaj warunek user_id\n" +
        "        if (strpos($query_upper, 'SELECT') === 0) {\n" +
        "            return $this->modifySelectQuery($query);\n" +
        "        }\n" +
        "        \n" +
        "        // Dla INSERT - automatycznie dodaj user_id\n" +
        "        if (strpos($query_upper, 'INSERT') === 0) {\n" +
        "            return $this->modifyInsertQuery($query);\n" +
        "        }\n" +
        "        \n" +
        "        // Dla UPDATE/DELETE - dodaj warunek user_id\n" +
        "        if (strpos($query_upper, 'UPDATE') === 0 || strpos($query_upper, 'DELETE') === 0) {\n" +
        "            return $this->modifyUpdateDeleteQuery($query);\n" +
        "        }\n" +
        "        \n" +
        "        return $query;\n" +
        "    }\n" +
        "    \n" +
        "    private function modifySelectQuery(string $query): string {\n" +
        "        // Sprawdź czy to zapytanie z JOIN\n" +
        "        $query_lower = strtolower($query);\n" +
        "        \n" +
        "        if (strpos($query_lower, 'join') !== false) {\n" +
        "            return $this->modifyJoinQuery($query);\n" +
        "        }\n" +
        "        \n" +
        "        // ZABEZPIECZENIE PRZED WIELKIMI ZAPYTANIAMI SELECT - automatyczny LIMIT\n" +
        "        $query_upper = strtoupper($query);\n" +
        "        \n" +
        "        // Sprawdź czy już ma LIMIT\n" +
        "        if (strpos($query_upper, 'LIMIT') === false) {\n" +
        "            // Jeśli nie ma LIMIT, dodaj automatyczny LIMIT 100\n" +
        "            if (stripos($query, 'WHERE') !== false) {\n" +
        "                $query = preg_replace('/WHERE\\s+/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) AND ', $query);\n" +
        "            } else {\n" +
        "                // Dodaj WHERE jeśli nie ma\n" +
        "                if (stripos($query, 'GROUP BY') !== false) {\n" +
        "                    $query = preg_replace('/GROUP BY/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) GROUP BY', $query);\n" +
        "                } elseif (stripos($query, 'ORDER BY') !== false) {\n" +
        "                    $query = preg_replace('/ORDER BY/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) ORDER BY', $query);\n" +
        "                } else {\n" +
        "                    $query = $query . ' WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL)';\n" +
        "                }\n" +
        "            }\n" +
        "            \n" +
        "            // DODAJ AUTOMATYCZNY LIMIT 100\n" +
        "            $query = $query . ' LIMIT 100';\n" +
        "        } else {\n" +
        "            // Jeśli już ma LIMIT, tylko dodaj warunek user_id\n" +
        "            if (stripos($query, 'WHERE') !== false) {\n" +
        "                $query = preg_replace('/WHERE\\s+/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) AND ', $query);\n" +
        "            } else {\n" +
        "                if (stripos($query, 'GROUP BY') !== false) {\n" +
        "                    $query = preg_replace('/GROUP BY/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) GROUP BY', $query);\n" +
        "                } elseif (stripos($query, 'ORDER BY') !== false) {\n" +
        "                    $query = preg_replace('/ORDER BY/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) ORDER BY', $query);\n" +
        "                } else {\n" +
        "                    $query = $query . ' WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL)';\n" +
        "                }\n" +
        "            }\n" +
        "        }\n" +
        "        \n" +
        "        return $query;\n" +
        "    }\n" +
        "    \n" +
        "    private function modifyJoinQuery(string $query): string {\n" +
        "        // PROSTE ROZWIĄZANIE BEZ ALIASÓW\n" +
        "        $query_lower = strtolower($query);\n" +
        "        $query_upper = strtoupper($query);\n" +
        "        \n" +
        "        $conditions = [];\n" +
        "        \n" +
        "        if (strpos($query_lower, 'orders') !== false) {\n" +
        "            $conditions[] = \"(orders.user_id = \" . $this->user_id . \" OR orders.user_id IS NULL)\";\n" +
        "        }\n" +
        "        \n" +
        "        if (strpos($query_lower, 'customers') !== false) {\n" +
        "            $conditions[] = \"(customers.user_id = \" . $this->user_id . \" OR customers.user_id IS NULL)\";\n" +
        "        }\n" +
        "        \n" +
        "        if (strpos($query_lower, 'products') !== false) {\n" +
        "            $conditions[] = \"(products.user_id = \" . $this->user_id . \" OR products.user_id IS NULL)\";\n" +
        "        }\n" +
        "        \n" +
        "        if (empty($conditions)) {\n" +
        "            return $this->addLimitIfMissing($query, $query_upper);\n" +
        "        }\n" +
        "        \n" +
        "        $combinedCondition = '(' . implode(' AND ', $conditions) . ')';\n" +
        "        \n" +
        "        $where_pos = stripos($query, 'WHERE');\n" +
        "        \n" +
        "        if ($where_pos !== false) {\n" +
        "            $query = substr_replace($query, 'WHERE ' . $combinedCondition . ' AND ', $where_pos, 5);\n" +
        "        } else {\n" +
        "            $order_by_pos = stripos($query, 'ORDER BY');\n" +
        "            $group_by_pos = stripos($query, 'GROUP BY');\n" +
        "            $limit_pos = stripos($query, 'LIMIT');\n" +
        "            \n" +
        "            if ($order_by_pos !== false) {\n" +
        "                $query = substr_replace($query, 'WHERE ' . $combinedCondition . ' ', $order_by_pos, 0);\n" +
        "            } else if ($group_by_pos !== false) {\n" +
        "                $query = substr_replace($query, 'WHERE ' . $combinedCondition . ' ', $group_by_pos, 0);\n" +
        "            } else if ($limit_pos !== false) {\n" +
        "                $query = substr_replace($query, 'WHERE ' . $combinedCondition . ' ', $limit_pos, 0);\n" +
        "            } else {\n" +
        "                $query .= ' WHERE ' . $combinedCondition;\n" +
        "            }\n" +
        "        }\n" +
        "        \n" +
        "        return $this->addLimitIfMissing($query, $query_upper);\n" +
        "    }\n" +
        "    \n" +
        "    private function addLimitIfMissing(string $query, string $query_upper): string {\n" +
        "        if (strpos($query_upper, 'LIMIT') === false) {\n" +
        "            $query .= ' LIMIT 100';\n" +
        "        }\n" +
        "        return $query;\n" +
        "    }\n" +
        "    \n" +
        "    private function modifyInsertQuery(string $query): string {\n" +
        "        echo \"DEBUG modifyInsertQuery INPUT: $query\\n\";\n" +
        "        \n" +
        "        // Tylko dla INSERT INTO orders\n" +
        "        if (stripos($query, 'INSERT INTO orders') === false) {\n" +
        "            echo \"DEBUG: Not INSERT INTO orders, skipping\\n\";\n" +
        "            return $query;\n" +
        "        }\n" +
        "        \n" +
        "        // Jeśli już ma 'user_id' w zapytaniu - NIE ZMIENIAJ\n" +
        "        if (stripos($query, 'user_id') !== false) {\n" +
        "            echo \"DEBUG: Already has user_id, skipping\\n\";\n" +
        "            return $query;\n" +
        "        }\n" +
        "        \n" +
        "        // USUŃ NOWE LINIE dla łatwiejszego parsowania\n" +
        "        $query_normalized = str_replace(array(\"\\r\", \"\\n\"), ' ', $query);\n" +
        "        $query_normalized = preg_replace('/\\s+/', ' ', $query_normalized); // Zastąp wiele spacji jedną\n" +
        "        echo \"DEBUG Normalized query: $query_normalized\\n\";\n" +
        "        \n" +
        "        // Znajdź ') VALUES' w znormalizowanym zapytaniu\n" +
        "        $values_pos = stripos($query_normalized, ') VALUES');\n" +
        "        if ($values_pos === false) {\n" +
        "            echo \"DEBUG: Cannot find ') VALUES' even in normalized query\\n\";\n" +
        "            return $query;\n" +
        "        }\n" +
        "        \n" +
        "        // Teraz musimy znaleźć odpowiednie pozycje w ORYGINALNYM zapytaniu\n" +
        "        // 1. Znajdź pierwszy ')' w oryginalnym zapytaniu (koniec kolumn)\n" +
        "        $first_paren_pos = strpos($query, ')');\n" +
        "        if ($first_paren_pos === false) {\n" +
        "            echo \"DEBUG: Cannot find first ')'\\n\";\n" +
        "            return $query;\n" +
        "        }\n" +
        "        \n" +
        "        // 2. Dodaj ', user_id' przed pierwszym ')'\n" +
        "        $part1 = substr($query, 0, $first_paren_pos);\n" +
        "        $part2 = substr($query, $first_paren_pos);\n" +
        "        \n" +
        "        $new_part1 = $part1 . ', user_id';\n" +
        "        \n" +
        "        // 3. Znajdź ostatni ')' w oryginalnym zapytaniu (koniec VALUES)\n" +
        "        $last_paren_pos = strrpos($part2, ')');\n" +
        "        if ($last_paren_pos === false) {\n" +
        "            echo \"DEBUG: Cannot find last ')'\\n\";\n" +
        "            return $query;\n" +
        "        }\n" +
        "        \n" +
        "        // 4. Dodaj ', X' przed ostatnim ')'\n" +
        "        $part2a = substr($part2, 0, $last_paren_pos);\n" +
        "        $part2b = substr($part2, $last_paren_pos);\n" +
        "        \n" +
        "        $new_part2 = $part2a . ', ' . $this->user_id . $part2b;\n" +
        "        \n" +
        "        // 5. Połącz\n" +
        "        $new_query = $new_part1 . $new_part2;\n" +
        "        \n" +
        "        echo \"DEBUG modifyInsertQuery OUTPUT: $new_query\\n\";\n" +
        "        return $new_query;\n" +
        "    }\n" +
        "    private function modifyUpdateDeleteQuery(string $query): string {\n" +
        "        if (stripos($query, 'WHERE') !== false) {\n" +
        "            return preg_replace('/WHERE\\s+/i', 'WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL) AND ', $query);\n" +
        "        } else {\n" +
        "            return $query . ' WHERE (user_id = ' . $this->user_id . ' OR user_id IS NULL)';\n" +
        "        }\n" +
        "    }\n" +
        "}\n" +
        "\n" +
        "// ZASTĄP STANDARDOWE POŁĄCZENIE ZABEZPIECZONYM\n" +
        "$secured_conn = new SecuredMySQLi(\"localhost\", \"php_sandbox_user\", \"sandbox_password123\", \"eduphp_sandbox\", $current_user_id);\n" +
        "if ($secured_conn->connect_error) {\n" +
        "    die(\"Błąd połączenia z bazą: \" . $secured_conn->connect_error);\n" +
        "}\n" +
        "\n" +
        "$conn = $secured_conn;\n" +
        "\n" +
        "try {\n" +
        cleanCode + "\n" +
        "} catch (Throwable $e) {\n" +
        "    $error_msg = 'RUNTIME_ERROR: ' . $e->getMessage();\n" +
        "    \n" +
        "    if (strpos($e->getMessage(), 'Column count doesn\\'t match value count') !== false) {\n" +
        "        $error_msg .= \"\\n Wskazówka: Upewnij się, że podajesz nazwy kolumn w INSERT: INSERT INTO tabela (kol1, kol2) VALUES (wart1, wart2)\";\n" +
        "    }\n" +
        "    \n" +
        "    echo $error_msg . \"\\n\";\n" +
        "} finally {\n" +
        "    if (isset($secured_conn)) {\n" +
        "        $secured_conn->close();\n" +
        "    }\n" +
        "}\n" +
        "?>";
    }
    
    private Process executePHPProcess(Path phpFile) throws IOException, TimeoutException {
        ProcessBuilder processBuilder = new ProcessBuilder(
            phpExecutablePath,
            "-f",
            phpFile.toAbsolutePath().toString()
        );
        
        processBuilder.redirectErrorStream(false);
        processBuilder.directory(phpFile.getParent().toFile());
        
        // Zmienne środowiskowe dla bezpieczeństwa
        Map<String, String> env = processBuilder.environment();
        env.put("PHP_DISABLE_FUNCTIONS", "system,exec,passthru,shell_exec,popen,proc_open");
        
        Process process = processBuilder.start();
        
        // Timeout zabezpieczenie
        new Thread(() -> {
            try {
                if (!process.waitFor(5, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
            } catch (InterruptedException e) {
                process.destroyForcibly();
                Thread.currentThread().interrupt();
            }
        }).start();
        
        return process;
    }
    
    private String readProcessOutput(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }
    
    private String readProcessErrors(Process process) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getErrorStream()))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }
    
    private void cleanupTempFile(Path tempFile) {
        try {
            Files.deleteIfExists(tempFile);
        } catch (IOException e) {
            System.err.println("Nie udało się usunąć pliku tymczasowego: " + tempFile);
        }
    }
   
    // Główna metoda wykonująca kod PHP (bez zmian)
    public PHPExecutionResult executePHPCode(Integer userId, Integer taskId, String phpCode) {
        Path tempFile = null;
        try {
            // 1. Przygotuj katalog tymczasowy
            Path tempDir = prepareTempDirectory();
            
            // 2. Stwórz plik tymczasowy
            tempFile = createTempPHPFile(tempDir, userId, taskId, phpCode);
            
            // 3. Wykonaj kod PHP
            Process process = executePHPProcess(tempFile);
            
            // 4. Przechwyć wynik
            String output = readProcessOutput(process);
            String errors = readProcessErrors(process);
            
            // 5. Sprawdź status wykonania
            boolean success = process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
            
            return new PHPExecutionResult(success, output, errors, tempFile.toString());
            
        } catch (TimeoutException e) {
            return new PHPExecutionResult(false, "", "Timeout: Kod wykonywał się zbyt długo (max 10 sekund)", "");
        } catch (Exception e) {
            return new PHPExecutionResult(false, "", "Błąd wykonania: " + e.getMessage(), "");
        } finally {
            // 6. Sprzątanie plików tymczasowych
            if (tempFile != null) {
                cleanupTempFile(tempFile);
            }
        }
    }
}