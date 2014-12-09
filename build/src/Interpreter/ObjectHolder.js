
/**
 * Author : Laxmikant Kumbhare
 * Hold the object of functional block
 * functions : 
 * setObject : set the function bloack in fucntion storage and sets the output contact present in function bloack in
 * 				outputimagetable
 */


window.PLCSpace.objectHolder = (function(){
	var functionalStorage = [];
	var setObject = function(eq){
		var obj = functionalStorage[eq.rungId];
		var latchOjb;
		if(obj == "" || obj == undefined){
			var type =  eq.functionObject.functionType;
			obj = eq.functionObject.functionBlock[type];
			if(type=="totalizer"){
				eq.functionObject.functionBlock[type].preOutput =0;
			}
			functionalStorage[eq.rungId] =eq.functionObject.functionBlock[type];
		}
		var len = _.keys(obj).length;
		//get value of output contact like CU , DN , TT , EN and store in functionstorage
		for(var i=0;i < len;i++){
			if(_.isObject(_.values(obj)[i])){
				var outputContact = (_.values(obj)[i]);
				if(!_.isEmpty(outputContact) && outputContact!= undefined)
						if(outputContact.type != "unlatch" )
						{
							if(outputContact.status != -1)
							PLCSpace.scanCycle.outputImageTable[outputContact.tagName] = outputContact;
						}
							
						else{
							//PLCSpace.scanCycle.outputImageTable=[];
							latchOjb = PLCSpace.scanCycle.outputImageTable[outputContact.tagName]; 		//set the unlatchstatus
							PLCSpace.scanCycle.outputImageTable[outputContact.tagName] = outputContact;
							if(latchOjb == "" || latchOjb == undefined){
						
							}else{
								latchOjb.unLatchstatus = outputContact.status;
							}
						};
			}				
		}
		
		if(functionalStorage.size == 0)
			throw new Exception._("Error : "+eq.functionObject.functionType+" block can not be parsed");			
		PLCSpace.objectHolder.functionalStorage = functionalStorage;
		
	} ;
	
	var getExistingObject = function(type , tg){
		var obj;
		for(var i=0;i<PLCSpace.objectHolder.functionalStorage.length;i++){
		
			 obj = PLCSpace.objectHolder.functionalStorage[i];
			 var tag ;
			 if(obj != undefined ){
				if(type == "latch" || type == "unlatch"){
					tag = obj.output.tagName;
				 }else{
						 tag = obj.tagName;
				 }
				 
				 
				/* switch(type){
				 	case 'latch':
				 	case 'unlatch':
				 		tag = obj.output.tagName;
				 	break;
				 	
				 	case 'RESET':
				 		tag = obj.output.tagName;
				 	break;
				 	
				 	default:
				 	tag = obj.tagName;
				 	break;
				 	
				 }*/
				
				if(tag == tg.split("_")[0]){ 
					
							return obj;				
				
					}
				}
			}
		
		
	};
	
	var getObjectWithTypeAndTag = function(type , tg){
		var obj1;
		var flag=false;
		 _.each(PLCSpace.objectHolder.functionalStorage , function(obj){
		 	var tag ;
			 if(obj != undefined && flag==false){
				if(type == "latch" || type == "unlatch" || type== "reset"){
					tag = obj.output.tagName;
				 }else{
						 tag = obj.tagName;
				 }
				 
				 
				
				
				if(tg == tag.split("_")[0]  && obj.output.type==type){ 
					
							//return obj;	
							obj1=obj;	
							flag=true;	
				
					}
					else{
						obj =null;
					}
				}
				else{
					if(flag==false)
						obj= null;
					}
		 });
		 
		 
		 
		
					return obj1;
		
		
	};
	
	return {
		setObject : setObject,
		getExistingObject:getExistingObject,
		getObjectWithTypeAndTag :getObjectWithTypeAndTag
	};
})();
