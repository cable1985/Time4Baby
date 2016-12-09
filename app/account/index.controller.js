(function () {
    'use strict';

    angular
        .module('app')
        .controller('Account.IndexController', Controller);

    function Controller($window, UserService, FlashService) {
        var vm = this;

        vm.user = null;
        vm.saveUser = saveUser;
        vm.deleteUser = deleteUser;
    
        initController();
       
        function initController() {
            // get current user
            UserService.GetCurrent().then(function (user) {
                vm.user = user;
                //get element and set color based on gender chosen.
                var gender = angular.element(document).find("#name");
                if (vm.user.gender.charAt(0) === 'g'){
                   gender.css('color' , 'pink');
                      
                } else { 
                    gender.css('color', 'skyblue');
                   
                }
            });
        }

        function saveUser() {
            UserService.Update(vm.user)
                .then(function () {
                    FlashService.Success('');
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
            
        }
     
        function deleteUser() {
            UserService.Delete(vm.user._id)
                .then(function () {
                    // log user out
                    $window.location = '/login';
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
        }
    }

})();