package com.polsl.EduPHP.DTO;

import java.time.LocalDateTime;

public class ProfilDTO {
    private Integer idProf;
    private String avatarType;
    private String opisUser;
    private LocalDateTime lastLoging;
    private Integer userId;
    
    // Konstruktory
    public ProfilDTO() {}
    
    public ProfilDTO(Integer idProf, String avatarType, String opisUser, 
                    LocalDateTime lastLoging, Integer userId) {
        this.idProf = idProf;
        this.avatarType = avatarType;
        this.opisUser = opisUser;
        this.lastLoging = lastLoging;
        this.userId = userId;
    }
    
    // Gettery i settery
    public Integer getIdProf() { return idProf; }
    public void setIdProf(Integer idProf) { this.idProf = idProf; }
    
    public String getAvatarType() { return avatarType; }
    public void setAvatarType(String avatarType) { this.avatarType = avatarType; }
    
    public String getOpisUser() { return opisUser; }
    public void setOpisUser(String opisUser) { this.opisUser = opisUser; }
    
    public LocalDateTime getLastLoging() { return lastLoging; }
    public void setLastLoging(LocalDateTime lastLoging) { this.lastLoging = lastLoging; }
    
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
}

/*
 * Rozwiązał problem: SyntaxError: Expected ':' after property name in JSON at
 * position 368148 Ten błąd występował, ponieważ Spring próbował zseryjalizować
 * obiekt Profil do JSON, a ten obiekt zawierał pole byte[] avatar - czyli dane
 * binarne obrazka. JSON to format tekstowy, a dane binarne (obrazki) to: Nie
 * tekst - to ciąg bajtów który nie ma sensu w JSON Bardzo duże - obrazki mogą
 * mieć megabajty Zawierają specjalne znaki które psują strukturę JSON 1. DTO
 * filtruje niepotrzebne dane Jak teraz działa flow: Frontend:
 * 
 * GET /api/profil/123 → dostaje metadane (JSON)
 * 
 * GET /api/profil/avatar/123 → dostaje obrazek (jeśli potrzebuje)
 * 
 * Backend:
 * 
 * Kontroler woła serwis
 * 
 * Serwis zwraca obiekt Profil z bazy
 * 
 * Konwertujemy Profil → ProfilDTO (odfiltrowujemy avatar)
 * 
 * Zwracamy czysty JSON
 */

