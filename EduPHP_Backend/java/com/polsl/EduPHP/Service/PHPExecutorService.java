//package com.polsl.EduPHP.Service;
//
//import org.springframework.stereotype.Service;
//import org.springframework.beans.factory.annotation.Value;
//import java.io.*;
//import java.nio.file.*;
//import java.util.concurrent.TimeUnit;
//import java.util.concurrent.TimeoutException;
//import java.util.stream.Collectors;
//
//@Service
//public class PHPExecutorService {
//    
//    @Value("${php.executor.path:C:\\Users\\Lenovo\\Documents\\workspace-spring-tool-suite-4-4.29.1.RELEASE\\EduPHP - git\\EduPHP\\php\\php.exe}")
//	//@Value("${php.executor.path:..\\..\\..\\..\\..\\..\\php\\php.exe}")
//    private String phpExecutablePath;
//    
//    
//    @Value("${php.solutions.directory:user_solutions}")
//    private String solutionsDirectory;
//    
//    // Główna metoda wykonująca kod PHP
//    public PHPExecutionResult executePHPCode(Integer userId, Integer taskId, String phpCode) {
//        try {
//            // 1. Przygotuj ścieżki plików
//            Path userDir = prepareUserDirectory(userId);
//            Path phpFile = createPHPFile(userDir, taskId, phpCode);
//            
//            // 2. Wykonaj kod PHP
//            Process process = executePHPProcess(phpFile);
//            
//            // 3. Przechwyć wynik
//            String output = readProcessOutput(process);
//            String errors = readProcessErrors(process);
//            
//            // 4. Sprawdź status wykonania
//            boolean success = process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0;
//            
//            return new PHPExecutionResult(success, output, errors, phpFile.toString());
//            
//        } catch (TimeoutException e) {
//            return new PHPExecutionResult(false, "", "Timeout: Kod wykonywał się zbyt długo", "");
//        } catch (Exception e) {
//            return new PHPExecutionResult(false, "", "Błąd wykonania: " + e.getMessage(), "");
//        }
//    }
//    
//    private Path prepareUserDirectory(Integer userId) throws IOException {
//        Path userDir = Paths.get(solutionsDirectory, "user_" + userId);
//        Files.createDirectories(userDir);
//        return userDir;
//    }
//    
//    private Path createPHPFile(Path userDir, Integer taskId, String phpCode) throws IOException {
//        String filename = "task_" + taskId + "_" + System.currentTimeMillis() + ".php";
//        Path phpFile = userDir.resolve(filename);
//        
//        // Dodaj podstawowe zabezpieczenia do kodu
//        String securedCode = addPHPSecurityWrappers(phpCode);
//        Files.writeString(phpFile, securedCode, StandardOpenOption.CREATE);
//        
//        return phpFile;
//    }
//    
//    private String addPHPSecurityWrappers(String phpCode) {
//        return "<?php\n" +
//               "// AUTO-GENERATED SECURITY WRAPPERS\n" +
//               "error_reporting(E_ALL);\n" +
//               "ini_set('display_errors', '0');\n" +
//               "ini_set('max_execution_time', 5); // 5 sekund timeout\n" +
//               "ini_set('memory_limit', '128M');\n" +
//               "\n" +
//               "try {\n" +
//               phpCode + "\n" +
//               "} catch (Exception $e) {\n" +
////               "    echo 'RUNTIME_ERROR: ' . $e->getMessage();\n" +
//               "}\n" +
//               "?>";
//    }
//    
//    private Process executePHPProcess(Path phpFile) throws IOException, TimeoutException {
//        ProcessBuilder processBuilder = new ProcessBuilder(
//            phpExecutablePath,
//            "-f",
//            phpFile.toAbsolutePath().toString()
//        );
//        
//        processBuilder.redirectErrorStream(false);
//        processBuilder.directory(phpFile.getParent().toFile());
//        
//        Process process = processBuilder.start();
//        
//        // Timeout zabezpieczenie
//        new Thread(() -> {
//            try {
//                if (!process.waitFor(10, TimeUnit.SECONDS)) {
//                    process.destroyForcibly();
//                }
//            } catch (InterruptedException e) {
//                process.destroyForcibly();
//            }
//        }).start();
//        
//        return process;
//    }
//    
//    private String readProcessOutput(Process process) throws IOException {
//        try (BufferedReader reader = new BufferedReader(
//                new InputStreamReader(process.getInputStream()))) {
//            return reader.lines().collect(Collectors.joining("\n"));
//        }
//    }
//    
//    private String readProcessErrors(Process process) throws IOException {
//        try (BufferedReader reader = new BufferedReader(
//                new InputStreamReader(process.getErrorStream()))) {
//            return reader.lines().collect(Collectors.joining("\n"));
//        }
//    }
//}