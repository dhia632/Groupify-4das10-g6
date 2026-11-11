package tn.esprit.profiling.exception;

public class ProfileNotFoundException extends RuntimeException {
    public ProfileNotFoundException(String studentId) {
        super("Profil introuvable : " + studentId);
    }
}