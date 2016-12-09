(function() {
    'use strict';

    angular
        .module('app')
        .controller('Home.IndexController', Controller);

    function Controller($window, UserService, FlashService) {
        var vm = this;

        vm.user = null;
        vm.time1 = time1;
        vm.log = log;

        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function(user) {
                vm.user = user;
                var gender = angular.element(document).find("#name");
                if (vm.user.gender.charAt(0) === 'g'){
                  
                   gender.css('color' , 'pink');
                      
                } else {
                    
                    gender.css('color' , 'skyblue');
                }
            });
        }

        
        function log(i) {
            
            var ntime = new Date();
            var theTime = convertTime((ntime-time));
            //http://stackoverflow.com/questions/175554/how-to-convert-milliseconds-into-human-readable-form
            function convertTime(time) {        
                var millis= time % 1000;
                time = parseInt(time/1000);
                var seconds = time % 60;
                time = parseInt(time/60);
                var minutes = time % 60;
                time = parseInt(time/60);
                var hours = time % 24;
                var out = "";
                if(hours && hours > 0) 
                    out += hours + " " + ((hours == 1)?"hr":"hrs") + " ";
                if(minutes && minutes > 0) 
                    out += minutes + " " + ((minutes == 1)?"min":"mins") + " ";
                if(seconds && seconds > 0) 
                    out += seconds + " " + ((seconds == 1)?"sec":"secs") + " ";
                return out.trim();
            }
            
            
            //an array storing the baby habits based on which button was pressed
            var logArray = [
                "Nursed Left Side " + theTime + " ", //----------------------------0
                "Nursed Right Side " + theTime + " ", //---------------------------1
                "Changed wet diaper ", //------------------------------------------2
                "Changed dirty diaper ", //----------------------------------------3
                "Changed dirty and wet diaper ", //--------------------------------4
                "Fed " + vm.user.number + " milliliters ", //----------------------5
                "Fed " + vm.user.number + " ounces ", //---------------------------6
                "Pumped " + vm.user.number + " milliliters from left side ", //----7
                "Pumped " + vm.user.number + " milliliters from right side ", //---8
                "Pumped " + vm.user.number + " ounces from left side ", //---------9
                "Pumped " + vm.user.number + " ounces from right side " //---------10
            ];
            
            vm.user.text = logArray[i];
            if((vm.user.text.charAt(0) == 'P' || vm.user.text.charAt(0) == 'F') 
               && vm.user.number === undefined){    
                    console.log("error");
                    
            }else{
                    UserService.Log(vm.user)
                    .catch(function(error) {
                        FlashService.Error(error);});
                
            }
        }

        var time;
        
        
        function time1() {
            time = new Date();
        }

    }
    
})();