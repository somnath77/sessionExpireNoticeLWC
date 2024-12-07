public with sharing class useHandlerClass {

    @AuraEnabled(Cacheable = true)
    public static User getUserDetails (String userdId) {
        try {
            User us = [SELECT Id, Name FROM User WHERE Id=: userdId limit 1];
            return us;
        } catch (Exception e) {
            throw e;
        }
    }
}