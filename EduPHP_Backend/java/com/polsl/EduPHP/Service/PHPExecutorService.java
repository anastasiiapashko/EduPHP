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
            System.err.println("❌ PHP NOT AVAILABLE: " + e.getMessage());
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
        
        System.out.println("💾 Zapisano/aktualizowano plik: " + solutionFile.toAbsolutePath());
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
        "ini_set('max_execution_time', 10);\n" +
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
        "        $secured_query = $this->addUserIsolation($query);\n" +
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
        "\n" +
        "    private function modifyInsertQuery(string $query): string {\n" +
        "        // ZABEZPIECZENIE PRZED MASOWYM INSERTEM - limit 50 rekordów\n" +
        "        $query_lower = strtolower($query);\n" +
        "        \n" +
        "        // Sprawdź czy to INSERT z wieloma wartościami\n" +
        "        if (preg_match('/values\\s*\\([^)]+\\)\\s*,\\s*\\([^)]+\\)/i', $query)) {\n" +
        "            // INSERT z wieloma VALUES: INSERT INTO table VALUES (a,b), (c,d), (e,f)\n" +
        "            $values_count = preg_match_all('/\\([^)]+\\)/i', $query);\n" +
        "            if ($values_count > 50) {\n" +
        "                die(\"❌ BŁĄD BEZPIECZEŃSTWA: Próbujesz wstawić zbyt wiele rekordów naraz (max 100). Liczba wykrytych rekordów: \" . $values_count);\n" +
        "            }\n" +
        "        } else {\n" +
        "            // Pojedynczy INSERT - sprawdź czy nie ma zbyt wielu wartości\n" +
        "            if (preg_match('/values\\s*\\((.*?)\\)/i', $query, $matches)) {\n" +
        "                $values = $matches[1];\n" +
        "                $value_count = substr_count($values, ',') + 1; // Liczba wartości\n" +
        "                if ($value_count > 5) { // Jeśli zbyt wiele kolumn\n" +
        "                    die(\"❌ BŁĄD BEZPIECZEŃSTWA: Zbyt wiele wartości w INSERT (max 50 kolumn). Liczba wykrytych wartości: \" . $value_count);\n" +
        "                }\n" +
        "            }\n" +
        "        }\n" +
        "        \n" +
        "        // Sprawdź czy podano kolumny\n" +
        "        if (preg_match('/INSERT\\s+INTO\\s+\\w+\\s*\\((.*?)\\)/i', $query, $matches)) {\n" +
        "            // INSERT z kolumnami: INSERT INTO table (col1, col2) VALUES (val1, val2)\n" +
        "            $columns = $matches[1];\n" +
        "            $new_columns = $columns . ', user_id';\n" +
        "            \n" +
        "            // Dodaj wartość user_id do VALUES\n" +
        "            $query = preg_replace('/VALUES\\s*\\((.*?)\\)/i', 'VALUES($1, ' . $this->user_id . ')', $query);\n" +
        "            $query = str_replace('(' . $columns . ')', '(' . $new_columns . ')', $query);\n" +
        "        } else {\n" +
        "            // INSERT bez kolumn: INSERT INTO table VALUES (val1, val2)\n" +
        "            $query = preg_replace('/VALUES\\s*\\((.*?)\\)/i', 'VALUES($1, ' . $this->user_id . ')', $query);\n" +
        "        }\n" +
        "        \n" +
        "        return $query;\n" +
        "    }\n" +
        "    \n" +
        "    private function modifyUpdateDeleteQuery(string $query): string {\n" +
        "        if (stripos($query, 'WHERE') !== false) {\n" +
        "            return preg_replace('/WHERE\\s+/i', 'WHERE user_id = ' . $this->user_id . ' AND ', $query);\n" +
        "        } else {\n" +
        "            return $query . ' WHERE user_id = ' . $this->user_id;\n" +
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
        "    // Dodatkowa pomoc dla częstych błędów\n" +
        "    if (strpos($e->getMessage(), 'Column count doesn\\'t match value count') !== false) {\n" +
        "        $error_msg .= \"\\n💡 Wskazówka: Upewnij się, że podajesz nazwy kolumn w INSERT: INSERT INTO tabela (kol1, kol2) VALUES (wart1, wart2)\";\n" +
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
                if (!process.waitFor(10, TimeUnit.SECONDS)) {
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
            return new PHPExecutionResult(false, "", "⏰ Timeout: Kod wykonywał się zbyt długo (max 10 sekund)", "");
        } catch (Exception e) {
            return new PHPExecutionResult(false, "", "❌ Błąd wykonania: " + e.getMessage(), "");
        } finally {
            // 6. Sprzątanie plików tymczasowych
            if (tempFile != null) {
                cleanupTempFile(tempFile);
            }
        }
    }
}