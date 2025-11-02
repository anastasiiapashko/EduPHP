package com.polsl.EduPHP.Service;

public class PHPExecutionResult {
    private final boolean success;
    private final String output;
    private final String errors;
    private final String filePath;
    
    public PHPExecutionResult(boolean success, String output, String errors, String filePath) {
        this.success = success;
        this.output = output;
        this.errors = errors;
        this.filePath = filePath;
    }
    
    // gettery
    public boolean isSuccess() { return success; }
    public String getOutput() { return output; }
    public String getErrors() { return errors; }
    public String getFilePath() { return filePath; }
}