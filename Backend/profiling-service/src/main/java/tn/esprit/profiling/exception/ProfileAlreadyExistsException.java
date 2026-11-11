package tn.esprit.profiling.exception;

public class ProfileAlreadyExistsException extends RuntimeException {
    public ProfileAlreadyExistsException(String studentId) {
        super("Un profil existe déjà pour : " + studentId);
    }
}