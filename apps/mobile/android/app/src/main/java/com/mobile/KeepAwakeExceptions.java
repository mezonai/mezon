package com.mezon.mobile;

public final class KeepAwakeExceptions {

    public static class ActivateKeepAwakeException extends RuntimeException {
        public ActivateKeepAwakeException() {
            super("Unable to activate keep awake");
        }
    }

    public static class DeactivateKeepAwakeException extends RuntimeException {
        public DeactivateKeepAwakeException() {
            super("Unable to deactivate keep awake. However, it probably is deactivated already");
        }
    }

    public static class MissingModuleException extends RuntimeException {
        public MissingModuleException(String moduleName) {
            super("Module '" + moduleName + "' not found. Are you sure all modules are linked correctly?");
        }
    }
}

