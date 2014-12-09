var PLCSpace = PLCSpace || {};
PLCSpace.currentCanvas = {};
PLCSpace.currentProgramModel = {};
PLCSpace.sarvaGlobal = {};

	
	Array.max = function( array ){
	    return Math.max.apply( Math, array );
	};
	Array.min = function( array ){
	    return Math.min.apply( Math, array );
	};
	PLCSpace.PLCEditorModel = {
			_id : "PLC-Editor",
			_collection : [],
			getCollectionObject : function(id) {
				//var index = this._collection.indexOf(id);
				for(var i = 0; i < this._collection.length; i++) {
					if(this._collection[i]._id == id) {
						return this._collection[i];
					}
				}
			}
    };
  
   
$(document).ready(function() {
		
	//PLCSpace.PLCEditorSpace.canvasId = "tabhead1";
	var view = new PLCSpace.view.view();	
	
});


/*
$(".full-screen right").on('click', function() {		
	 var element = $("#player");
	    if (element.mozRequestFullScreen) {
	      element.mozRequestFullScreen();
	    } else if (element.webkitRequestFullScreen) {
	      element.webkitRequestFullScreen();
	   }
});
*/


