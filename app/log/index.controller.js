(function() {
    'use strict';

    angular
        .module('app')
        .controller('Log.IndexController', Controller);


    function Controller(UserService) {
        var vm = this;

        vm.user = null;
        vm.remove = remove;
        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function(user) {
                vm.user = user;
               var gender = angular.element(document).find("#name");
                if (vm.user.gender.charAt(0) === 'g'){
                  
                   gender.css('color' , 'pink');
                      
                } else {
                    gender.css('color', 'skyblue');
                }
            });
        }
      
        //remove log entry
        function remove(i) {
            var log;
            /*  checks the first letter of the log entry
                and sets the variable 'log' to whichever
                log it needs to be removed from
            */
            if(i.charAt(0) == 'P'){
                log = vm.user.pumplog;
                
            }else if(i.charAt(0) == 'F'){
                log = vm.user.feedlog;
                
            }else if(i.charAt(0) == 'C' ){
                log = vm.user.changelog;
                
            }else{
                log = vm.user.nurselog;
            }
            
            vm.user.index = i;
            UserService.Remove(vm.user).then(function() {
                /*  log.splice allows the log entry to be 
                    removed instantly
                    from the screen with no refresh needed
                */
                log.splice(log.indexOf(i), 1);
            });
        }
        

    }

})();