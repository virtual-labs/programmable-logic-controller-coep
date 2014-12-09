window.PLCSpace.jsonCode = (function(){
    var plcCompileFormat = [];
    var equation = "";
    var inputList = [] , outputList = [],rungFunctionBlock = {};
    var flag = false;
    
    var cnt =0;
    var GenerateFormat = function(){
        var programs = PLCSpace.dataStore.programContainer.toArray();
        var pobj = [];
        
        
        _.each(programs ,function(program){
            
            var rungs = program.get("rungs").toArray();
            var rungJson = [];
            _.each(rungs , function(rung){
            	if(!rung.get("attr").attr.isDisabled){
                evaluateRung(rung);
                var obj = {
                    equation : equation.substr(0,equation.length-1),
                    inputList : inputList,
                    outputList  :outputList,
                    rungFunctionBlock  :rungFunctionBlock,
                };
                rungJson.push(obj);
                equation= "";
                inputList = [];
                outputList = [];
                rungFunctionBlock = {};
                 }
            });
            pobj.push({"rungs" : rungJson });
           
        });
        (plcCompileFormat.size == 0)?logger.add("Compilation Failed"):logger.add("Program is Compiled Successfully");
        PLCSpace.jsonCode.plcCompileFormat = plcCompileFormat = {"program" : pobj};
        
        //console.log(plcCompileFormat);
    }
    var evaluateRung = function(rung){
        var elements = rung.get("elements").toArray();
        _.each(elements, function(elem){
        	var isprocessed= elem.get("isProcessed")==undefined ? false :elem.get("isProcessed") ;
            if(!isprocessed)
                processElement(elem , "&");         
        });
        /*var loops = rung.get("loops").toArray();
        _.each(loops, function(loop){
            if(!loop.get("isProcessed"))
                processLoop(loop);          
        })*/
    }
    var processElement = function(elem , op){
    	 var psr = false;
    	 var inLoop = elem.get("inLoop");
         var type = elem.get("type");
  
        switch(type){
            case "input" : InsertInInputList(elem);
                            break;
            case "output" : InsertInOutputList(elem);       
            
                            break;
            case "function" : InsertFunctionalBlock(elem);
                            break;
        }
        
        if(inLoop == -1  && elem.get("type") == "input")
            expressionGenerator(elem , op);
        else if(!elem.get("isProcessed") && elem.get("type") == "input"){
        	equation = equation+"(";
        	//equation = equation+""+elem.get("attr").tagname;
        	var section =  processInElements(elem, inLoop );
        	var len = section.length;
        	var secLen=0;
        	
        	if(section != undefined && section.length>0)
        	{	       	equation = equation+"(";
	        			equation = equation+""+elem.get("attr").tagname+"&";
        	}
            for(var i=0; i<=len; i++){
                	if(i == len-1)
                		{
                		 expressionGenerator(section[i] ,"");   
                		 InsertInInputList(section[i])    
                		  equation = equation+")";         		 
                		break;
                		}
                	if(type == "input" && section[i] != undefined) {
                		InsertInInputList(section[i]);
                    expressionGenerator(section[i] , "&");
                   }
                   // len--;
            }
           
              		
            if(len== 0){
            	flag=true;
            	var chkFlag = false;
            	processInLoop(elem, inLoop);
            	var sectionElements = elem.collection.models
            	for(var i=0;i<sectionElements.length ; i++){
            		var el = sectionElements[i];
            		var isProcessed = el.get("isProcessed");
            		if(!isProcessed) {
            			equation = equation + ")&";
            			chkFlag = false;
            			break;
            		}
            		else
            		 chkFlag = true;
            	}
            	if(chkFlag)
            	equation = equation + ")";
				
            }else
            	{
            		processInLoop(section[i] , inLoop);
            		var chkFlag = false;
            		var sectionElements = section[i].collection.models
            		for(var i=0;i<sectionElements.length ; i++){
            		var el = sectionElements[i];
            		var isProcessed = el.get("isProcessed");
            		if(!isProcessed) {
            			equation = equation + ")&";
            			chkFlag = false;
            			break;
            		}
            		else
            		 chkFlag = true;
            	}
            	if(chkFlag)
            	equation = equation + ")";
            	}
        }
    }
    
    var processLoop =function(loop){
        var elements = loop.get("elements").toArray();
        _.each(elements, function(elem){
            processElement(elem);           
        });     
    }
    var processInElements = function(elem,inLoop){
        var section = [];
        var parent = elem.getParent();
        var inelements = parent.get("elements").toArray();
        _.each(inelements , function(inelem){ 
            if(inelem.get("inLoop") == inLoop && elem.cid != inelem.cid && !inelem.get("isProcessed")){
                    section.push(inelem);
            }
        });
        return section;
    }
    var processInLoop = function(elem , inLoop){
        var loopLen=0;
        var parentLoop = elem.getParent();

        if(flag== true &&  !elem.get("isProcessed")){
        	expressionGenerator(elem, "|");
        }else{
        	expressionGenerator("", "|");
        }
        var inloop = parentLoop.get("loops").models[inLoop];
        var elements = inloop.get("elements").toArray();
        loopLen =elements.length;
       // inloop.set({"isProcessed" : true});
        if(loopLen > 1) equation =equation +"(";
        //_.each(elements, function(elem){
          for(var n=0;n<= loopLen;n++){
        	          
            if(loopLen == 1 && !elements[n].get("isProcessed"))
            	{
            		if(n==0)  {
            			equation = equation +elements[n].get("attr").tagname;
            			InsertInInputList(elements[n]);
            			 if(elements[n].get("inLoop") > -1) {
            				  var iloop=  elements[n].get("inLoop")
            		          flag = false;
            				  processInLoop(elements[n] , iloop); 
            				 };
            		}else{
            			equation = equation + elements[n].get("attr").tagname +")";
            			InsertInInputList(elements[n]);
            		}
            		break;
            	}
            	if(n==loopLen-1) {
            		// equation = equation + elements[n].get("attr").tagname +")";
            		// InsertInInputList(elements[n])
            		 processElement(elements[n] , "");
            		 equation = (equation[equation.length-1] != "&" || equation[equation.length-1] != "|")? equation +")" :
            		 equation.substr(0,equation.length-1) +")";
            		break;
            	}
            	
            else{
            	 processElement(elements[n] , "&");
            	// loopLen--;
            	}
            
          }
            
        //});     
    }
    
    var expressionGenerator = function(elem,operator){
    	 //var inLoop = elem.get("inLoop");
    	// var parentLoop = elem.getParent();
    	 //var el = parentLoop.get("inLoop");  
    	 
    	/* if(inLoop == -1 &&  flag == true  ){
    		 equation = equation+""+elem.get("attr").tagname+")"+operator;
    		 flag = false;
    		 cnt = 0 ;
    	 }else*/
    	
    	if(elem == "" ){
    		equation = equation+""+operator;
    	}else{
    		equation = equation+""+elem.get("attr").tagname+""+operator;
    		 elem.set({"isProcessed" : true});
    	}
       
        //console.log(equation);
    }
    var InsertInInputList = function(elem){
        var attr = elem.get("attr");
        var tagname = attr.tagname;
      //  _.each(inputList,function(input){
        //	if(tagname != input.get("attr").tagname){
	        var obj = {
		            "type":attr.type,
		            "tagName":attr.tagname,
		            "status": attr.status,
		            "hardwareAddress":attr.hardwareAddress,
		            "id":attr.id,
		        }
		        inputList.push(obj);
    }
    var InsertInOutputList = function(elem){
        var attr = elem.get("attr");
        var obj = {
            "type":attr.type,
            "tagName":attr.tagname,
            "status":attr.status,
            "hardwareAddress":attr.hardwareAddress,
           
        }
        outputList.push(obj);
    }
    var InsertFunctionalBlock = function(elem){
        var fb = {};
        var attr = elem.get("attr").attr;        
        var type=  attr.type;
        var obj = {
            "functionType":type,
            "functionBlock" : {}
        }
        obj.functionBlock[type] = attr.functionBlock;
       rungFunctionBlock = obj;
    };
    
    return {
        GenerateFormat : GenerateFormat,        
    }
})();
