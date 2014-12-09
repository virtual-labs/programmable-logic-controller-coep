//compile
//errror
//exceptions
//warn
//onError:
//info

(function(){
	logger = {        
        add : function(msg){
           $('.console-window').append("<br>"+msg);
        },
        warn :  function(msg){
            $('.console-window').append("<br>"+msg);
        },
        error :  function(msg){
           $('.console-window').append("<br>"+msg);
        },
   	}   

	Exception = {
	_ : function(e){
		logger.error(e);				
		}
	}
	
})();
	