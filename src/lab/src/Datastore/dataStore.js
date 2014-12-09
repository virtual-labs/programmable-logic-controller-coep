/**
 * Author : Priya
 * Insertion of all the elements and rungs in Model in the structure as
 *  rung->[ loops , elements] 
 *  elements - > [loopID , rungID ] (inLoop id of loop present on it else -1 )
 *  *  loops - > [elements , loops]
 *  */



window.PLCSpace.dataStore = (function() {
    
    var programContainer = new plc();   
    var CreateProgram = function(programID) {
        
        if(programID === null)
            throw new Exception._("Error : program cant be created ");
        var program = new Programs({
            id : programID,
            attr : {
                name : "main"
            }
        });
        programContainer.add(program);

    }
    
    var InsertRungInRungModel = function(obj, programID) {
        if(_.isEmpty(obj) || programID === null)
            throw new Exception._("Error : Rung cant be created ");
        var rung = new Rung({
            id : obj.rungid,
            attr : obj
        });
        var plcprogram = programContainer.models[programID];
        var existingrung = plcprogram.get("rungs");
        existingrung.add(rung);
        logger.add(" Rung "+obj.rungid+" created..");
        //console.log("New Rung added...");
    };
    
    var SetDisableRungInRungModel = function(rungid,status,programID){
    	  if( programID === null)
            throw new Exception._("Error : Rung cant be disabled ");
    	var plcprogram = programContainer.models[programID];
    	 var existingrung = plcprogram.get("rungs").get(rungid);
    	   existingrung.get("attr").attr.isDisabled=status;
    }
    
    
    var InsertLoop = function(obj, programID) {     
        if(_.isEmpty(obj) || programID === null)
            throw new Exception._("Error : Loop cant be inserted ");
        
        var id =  obj.loopid;     
         id = id.slice(4,id.length);
        var parentIds = id.split("-", id.length - 1);
        var rungid = parentIds[0];
        var len = parentIds.length - 1;     
        var plcprogram = programContainer.get(programID);
        var existingrung = plcprogram.get("rungs").get(rungid);
        var loops = existingrung.get("loops");
        var loop = new Loop({
            id : obj.loopid,
            attr : obj
        });  

        if(loops.length != 0 && len > 1 ){
            //iterates to the last loop where the new loop has to be placed
            var existingLoop = loops.models[(parentIds[1])];
            var noOfParents = 2;    
            while(noOfParents < len) {
                var nestedLoopList = existingLoop.get("loops");
                existingLoop = nestedLoopList.models[parentIds[noOfParents]];
                noOfParents++;
            }
            existingLoop =  existingLoop.get("loops")
            existingLoop.add(loop);
       }
       else
    	   loops.add(loop);
       
       logger.add("New Loop added..");
       //console.log("New Loop added...");
    }
    
    var InsertElement = function(obj, programID) {
        if(_.isEmpty(obj) || programID === null)
            throw new Exception._("Error : Element on Loop cant be inserted ");
        var id = obj.id == undefined ? ""  :obj.id;
        // obj.id
        var loopid = -1; 
         id = id.slice(4,id.length);
        var parentIds = id.split("-", id.length - 1)== undefined ? "":id.split("-", id.length - 1) ;
        var rung_id = parentIds[0];
        var len = (parentIds.length) -2 ;
        var plcprogram = programContainer.get(programID);
        var existingrung = plcprogram.get("rungs").get(rung_id);
        var loops;
        var existingLoop;
        var elements;
        var loops = existingrung.get("loops");
        var elem = new Element({
                id : obj.id,
                attr : obj,
                inRung : rung_id,
                inLoop :obj.inLoop,
                type : obj.type,
                
        });
        if(len > 1){
            var existingLoop = loops.models[parentIds[1]];
            var noOfParents = 2;
            while(noOfParents < len) {
                var nestedLoopList = existingLoop.get("loops");
                existingLoop = nestedLoopList.models[parentIds[noOfParents]];
                
                noOfParents++;
            }
             elements = existingLoop.get("elements")
             elem.setParent(existingLoop);
                    
       }
       else {
            elements = existingrung.get("elements");
            elem.setParent(existingrung);
       }
       elements.add(elem);
       logger.add("New Element added..");
       //console.log("New Element added..");
    }
    
    var UpdateElementLable = function(programID,id,label,tagName){
    	pid= id.slice(4,id.length);
    	var parentIds = pid.split("-", id.length - 1)== undefined ? "":pid.split("-", pid.length - 1) ;
    	var plcprogram = programContainer.get(programID);
    	var existingrung = plcprogram.get("rungs").get(parentIds[0]);
    	var len = parentIds.length-1;
    	if(len > 2){
    		 var existingLoop = existingrung.get("loops").models[parentIds[1]];
    		 var noOfParents = 3;
    		   while(noOfParents < len) {
    			   var nestedLoopList = existingLoop.get("loops");
    			   existingLoop = nestedLoopList.models[parentIds[noOfParents-1]];
    			 
    			   noOfParents++;
    		   }
    		   var elem = existingLoop.get("elements").get(id);
    	    	  elem.get("attr").tagname=label;
    	    	  elem.get("attr").hardwareAddress = tagName;
    	}
    	else{    	    	  
    	  var elem = existingrung.get("elements").get(id);
    	  elem.get("attr").tagname=label;
    	  elem.get("attr").hardwareAddress = tagName;
    	}
    	//console.log("lable appended");
    };
    var UpdateFunctionBlockConfiguration = function(programID,id,obj){
    	pid= id.slice(4,id.length);
    	var parentIds = pid.split("-", id.length - 1)== undefined ? "":pid.split("-", pid.length - 1) ;
    	var plcprogram = programContainer.get(programID);
    	var existingrung = plcprogram.get("rungs").get(parentIds[0]);
    	var len = parentIds.length;
    	if(len > 3){
    		 var existingLoop = existingrung.get("loops").models[parentIds[1]];
    		 var noOfParents = 4;
    		   while(noOfParents < len) {
    			   var nestedLoopList = existingLoop.get("loops");
    			   existingLoop = nestedLoopList.models[parentIds[noOfParents-1]];
    			   noOfParents++;
    		   }
    		   var elem = existingLoop.get("elements").get(id);
    	    	  elem.get("attr").attr.functionBlock=obj;  	
    	}
    	else{    	    	  
    	  var elem = existingrung.get("elements").get(id);
    	  elem.get("attr").attr.functionBlock=obj;  
    	}
    	//console.log("fb appended");
    	
    };
    var updateInLoopStatus = function(programID,id, inloop){
    	pid= id.slice(4,id.length);
    	var parentIds = pid.split("-", id.length - 1)== undefined ? "":pid.split("-", pid.length - 1) ;
    	var plcprogram = programContainer.get(programID);
    	var existingrung = plcprogram.get("rungs").get(parentIds[0]);
    	var len = parentIds.length-1;
    	if(len > 2){
    		 var existingLoop = existingrung.get("loops").models[parentIds[1]];
    		 var noOfParents = 3;
    		   while(noOfParents < len) {
    			   var nestedLoopList = existingLoop.get("loops");
    			   existingLoop = nestedLoopList.models[parentIds[noOfParents-1]];
    			 
    			   noOfParents++;
    		   }
    		   var elem = existingLoop.get("elements").get(id);
    		   elem.set({"inLoop" : inloop}); 
    	}
    	else{    	    	  
    	  var elem = existingrung.get("elements").get(id);
    	  elem.set({"inLoop" : inloop}); 
    	}
    	//console.log("inloop appended");
    }
    
    var deleteElement = function(elemid,programID){   
    	if(elemid == null|| programID === null)
            throw new Exception._("Error : Loop cant be inserted ");
    	var id =  elemid;    
        id = id.slice(4,id.length);
       var parentIds = id.split("-", id.length - 1);   
       var rungid = parentIds[0];
       var len = parentIds.length - 1;     
       var plcprogram = programContainer.get(programID);
       var existingrung = plcprogram.get("rungs").get(rungid);
       
    	if(len > 3){
      		 var existingLoop = existingrung.get("loops").models[parentIds[1]];
    		 var noOfParents = 3;
    		   while(noOfParents < len) {
    			   var nestedLoopList = existingLoop.get("loops");
    			   existingLoop = nestedLoopList.models[parentIds[noOfParents-1]];
    			 
    			   noOfParents++;
    		   }
    		   var elem = existingLoop.get("elements").get(elemid);
    		   existingLoop.get("elements").remove(elem);
    	}
    	else{    	    	  
    	  var elem = existingrung.get("elements").get(elemid);
    	  existingrung.get("elements").remove(elem);
    	}
    	//console.log("element deleted");
    };
    
    var deleteLoop = function(loopid , programID){
        if(loopid == null|| programID === null)
            throw new Exception._("Error : Loop cant be inserted ");
        
        var id =  loopid;    
         id = id.slice(4,id.length);
        var parentIds = id.split("-", id.length - 1);   
        var rungid = parentIds[0];
        var len = parentIds.length - 1;     
        var plcprogram = programContainer.get(programID);
        var existingrung = plcprogram.get("rungs").get(rungid);
        var loops = existingrung.get("loops");
        var existingLoop = loops.models[(parentIds[1])];
        if(loops.length != 0){               
                var noOfParents = 2; 
                var nestedLoopList;
                while(noOfParents < len) {
                    nestedLoopList = existingLoop.get("loops");
                    existingLoop = nestedLoopList.models[parentIds[noOfParents]];
                    noOfParents++;
               }         
       }
       loops.remove(existingLoop);
       logger.add("loop deleted...");      
       //console.log("loop deleted...");
    };
    
    var unProcessElements = function(objArray){
    	 var programs = PLCSpace.dataStore.programContainer.toArray();
         var pobj = [];         
        
         _.each(programs ,function(program){
              var rungs = program.get("rungs").toArray();
              _.each(rungs , function(rung){
                 var elements = rung.get("elements").toArray();;
                 _.each(elements , function(elem){
                	 elem.set({"isProcessed" : false});       
                	 if(elem.get("attr").type == "function")  
      	 					if(elem.get("attr").attr.type =="countup")
      	 					elem.get("attr").attr.functionBlock.acc = 0;
      	 					else if(elem.get("attr").attr.type =="countdown")
      	 					elem.get("attr").attr.functionBlock.acc =elem.get("attr").attr.functionBlock.preset;
                 });
                 var loops = rung.get("loops").toArray();;
                 setLoopElementsProcessed(loops);   
                 
              });
         });
        
    };
    
    var setLoopElementsProcessed = function(objArray){
    	 _.each(objArray , function(obj){
    	       var elements = obj.get("elements").toArray();;
    	       _.each(elements , function(elem){
    	              elem.set({"isProcessed" : false});                  
    	            //console.log("unporcessed  "+elem.get("attr").tagname)
    	       var loops = elem.parent.get("loops").toArray();;
    	       if(loops != null && loops.length !=0){
    	        setLoopElementsProcessed(loops);}
    	       });
    	      })
    };
    
    var setPreviousStatusDefault  = function(id,rungID,programID){
    	var type = id.split("-")[0];
    	var plcprogram = programContainer.get(programID);
    	var existingrung = plcprogram.get("rungs").get(rungID);
    	var fb = existingrung.get("elements").get(id);
    	if(fb != undefined)
    	{
    		switch(type){
    			case "TON":
	    		case "TOF":
	    		case "RTO":
			    		fb.get("attr").attr.functionBlock.acc= 0;
			    		PLCSpace.scanCycle.outputImageTable["acc"] = 0;
			    		fb.get("attr").attr.functionBlock.prevStatus = 0;
			    		break;
			    		
	    		case "CTU":
	    		case "CTD":
	    			fb.get("attr").attr.functionBlock.prevStatus = 0;
	    		break
	    		case "OLT":
	    			fb.get("attr").attr.functionBlock.unlatchOutput = 0;
	    			fb.get("attr").attr.functionBlock.status = 0;
	    			fb.get("attr").attr.functionBlock.output.unLatchstatus = 0;
	    			fb.get("attr").attr.functionBlock.output.status = 0;
	    		break;
	    		case "OTU":
	    			fb.get("attr").attr.functionBlock.output.preOutput = 0;
	    			fb.get("attr").attr.functionBlock.output.status = 0;
	    		break;
	    		default:
    		}
    		
    	}
    		
    }
    
    var save = function(id) {       
        var main ;
        PLCSpace.PLCJson = new Array();
        /*
        $.each(programContainer,function(i,v){
                    main = programContainer.get(i);
                    PLCSpace.PLCJson[i] = main.toJSON();
                });*/
        
        for(var  i = 0 ; i < programContainer.length ; i++){
        	main = programContainer.get(i);
        	PLCSpace.PLCJson[i] = main.toJSON();
        }
        console.log("saving...");
        //console.log(main.toJSON());
        console.log(JSON.stringify(main.toJSON()));
        //main.saveToServer();
       // PLCSpace.PLCJson = main.toJSON();
    };
    
    var fetch = function() {
        this.newprogram = new Programs();
        //console.log("open : " + this.newprogram.fetch(this.newprogram.url()+"/0"));
    };
    
    /**
     * TODO
     * change the lastPointOfLoop after expanding or reducing the loop
     */
    var updateLoop = function(prgId,id,op){
    	
         id = id.slice(4,id.length);
        var parentIds = id.split("-", id.length - 1);
		 var rungid = parentIds[0];
		 
    	var plcprogram = programContainer.get(prgId);
        var existingrung = plcprogram.get("rungs").get(rungid);
        var loops = existingrung.get("loops");
        var existingLoop = loops.models[(parentIds[1])];
        var len = parentIds.length ;     
        
        if(len > 1 ){
            //iterates to the last loop where the new loop has to be placed
            //var existingLoop = loops.models[(parentIds[1])];
            var noOfParents = 2;    
            while(noOfParents < len) {
                var nestedLoopList = existingLoop.get("loops");
                existingLoop = nestedLoopList.models[parentIds[noOfParents]];
                noOfParents++;
            }
            //existingLoop =  existingLoop.get("loops")
       }
       
        if(op==1){
        	existingLoop.get("attr").endPositionOfLoop++ ; 
        }else{
        	existingLoop.get("attr").endPositionOfLoop-- ; 
        }
       // console.log("loop updated successfully"+existingLoop.get("attr").endPositionOfLoop);
        
    }
    return {
        InsertRungInRungModel : InsertRungInRungModel,
        InsertLoop : InsertLoop,
        InsertElement : InsertElement,
        UpdateElementLable:UpdateElementLable,
        updateInLoopStatus : updateInLoopStatus,
        deleteLoop : deleteLoop,
        deleteElement:deleteElement,
        programContainer : programContainer,
        CreateProgram : CreateProgram,
        UpdateFunctionBlockConfiguration : UpdateFunctionBlockConfiguration,
        SetDisableRungInRungModel :SetDisableRungInRungModel,
        setPreviousStatusDefault:setPreviousStatusDefault,
        save : save,
        fetch : fetch,
        unProcessElements  :unProcessElements,
        updateLoop : updateLoop
    };
})();


