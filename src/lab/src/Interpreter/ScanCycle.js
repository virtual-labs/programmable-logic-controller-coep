/**
 * Author : Priya
 * Starts scanning Cycle.
 * functions : 
 * ScanInstructionTable : scans the InstructionTable and insert the contact into inputImageTable & outputImageTable 
 *  & evalatue the equation & if functionBlock(fb) is empty then SetOutputOfExperssion or evaluateFunctionalBlock 
 */


//define(['expressionBuilder','objectHolder'], function() {

window.PLCSpace.scanCycle = (function(){
var inputImageTable = [];
var outputImageTable = [];
var equations = [];
var RungPointer = 0 ;
var expout ={};
var scancyclethread;	
var stop = false;
var totStatus = {};

	var ScanInstructionTable = function(){
		//logger.warn("Program downloaded successfully...Run Mode Activated")
		programs = PLCSpace.InstructionTable.instructionTable;
		
		for(var k = 0 ; k < programs.length ; k++){
			//put all input contact object from "PLCSpace.InstructionTable.instructionTable" to 
			//"PLCSpace.scanCycle.inputImageTable"
			InsertInputInInputImageTable(programs[k].input);
			//put all output contact object from "PLCSpace.InstructionTable.instructionTable" to 
			//"PLCSpace.scanCycle.outputImageTable"
			InsertOutputInOutputImageTable(programs[k].output);
		}
		var mainProgram = programs[0];
		PLCSpace.scanCycle.stop = false;
		if(_.isEmpty(mainProgram))
			throw new Exception._("Error : program can't be parsed ");
				
		//InsertInputInInputImageTable(mainProgram.input);
		//InsertOutputInOutputImageTable(mainProgram.output);
					
		equations = mainProgram.equation;
		 _.each(equations , function(eqobj){
		 	if(!_.isEmpty(eqobj.functionObject))
		 	PLCSpace.objectHolder.setObject(eqobj);
		 });
		
		scancyclethread = setInterval(function(){
		  
		  /*
		  _.each(equations , function(eq){
									var resultOfExpression = eq.equation == "" ? true : evaluateExpression(eq.equation);
									//console.log("resultOfExpression "+resultOfExpression);
								_.isEmpty(eq.functionObject) ?
											SetOutputOfExperssion(resultOfExpression , eq.output) : evaluateFunctionalBlock(eq, resultOfExpression);
														//saving output status to its refrenced inputs	
									if(eq.output != "" && !!_.isEmpty(eq.functionObject)){
											showData(eq.output , resultOfExpression);
										}
																		//calculate output and then check for functional block if not empty then send the output to it 
									//or else take the output from eq and update it in output		
			});*/
		  
			  
			for(PLCSpace.scanCycle.RungPointer = 0; PLCSpace.scanCycle.RungPointer < equations.length ; PLCSpace.scanCycle.RungPointer++){
					eq = equations[PLCSpace.scanCycle.RungPointer];
					var resultOfExpression = eq.equation == "" ? true : evaluateExpression(eq.equation);
					//console.log("resultOfExpression "+resultOfExpression);
					_.isEmpty(eq.functionObject) ?
							SetOutputOfExperssion(resultOfExpression , eq.output) : evaluateFunctionalBlock(eq, resultOfExpression);
					//saving output status to its refrenced inputs	
					if(eq.output != "" && !!_.isEmpty(eq.functionObject)){
						showData(eq.output , resultOfExpression);
					}
									
			}
			  
		
		},100);
	};
	/*
     * Author : Sushil
     * @Param address : tagname of output contact eg."a-OUT"
     * @Param status : status of output contact ie 0/1
     * TODO
     * 1.change the status of the input contacts referred by output contact(ie having same name)
     * 2.call 'showdata()'to show status of contact(ie white/green) 
     * */
	var showData = function(address , status)
	{
		var obj = {};
		address = address.split("-")[0]
			if(address != ""){
				for (var key in PLCSpace.scanCycle.inputImageTable) {
						var tagname  = key.split("-")[0]
						var contactType = key.split("-")[1]
						if(tagname == address){
							if(contactType == "CLS" )
							PLCSpace.scanCycle.inputImageTable[key].status = status ==1.0 ? 0.0:1.0;
							else 
							PLCSpace.scanCycle.inputImageTable[key].status = status ;
						}
					}
				
			}
		obj[address] =  status 	
		PLCSpace.PLCEditorSpace.showdata(obj);	
	}
	
	var evaluateExpression = function(expression){
		//TODO : evalation of expression
		if(expression === "")
			throw new Exception._("Error : Circuit cannot be Resolved ");
		
		var inputimagetable = PLCSpace.scanCycle.inputImageTable;
		var keys = _.keys(inputimagetable);
		for(var i =0;i<keys.length; i++){
			//if((inputimagetable[keys[i]].id).split("-")[0] == "CLS")
			expBuilder.withVariable(keys[i] , inputimagetable[keys[i]].status);
		};
		var equation = expBuilder.build(expression);
		//eval function can be used as there is no security threat, 
		//if you use eval to evaluate a function then it is a wrong way to do it
		var output = eval(equation)//expBuilder.calculate(equation);
		return output;
	};	
	var setStatusOfToggledObject = function(obj){
		var type = obj.type;
		switch(type){
			case "contact" :var currentStatus = obj.status;
							configureStatus(obj.tagName , currentStatus ,obj.tagName);
						   // PLCSpace.scanCycle.inputImageTable[obj.tagName].status = currentStatus;
						  	
						    break;
			case "function" : PLCSpace.objectHolder.functionalStorage[obj.rungId] = obj;
			break;
		}		
	}
	/*
	 * Author : Sushil
	 * @param address : tagname of a input contact
	 * @param status : status(0/1) of a input contact 
	 * @param type : type(opn/cls) of a input contact
	 * TODO
	 * after toggling,set the status of a input contacts as well as their referenced i/p contacts
	 * in PLCSpace.scanCycle.inputImageTable
	 */
	var configureStatus = function(address , status ,type){
		var obj = {};
		type = type.split("-")[1]
		address = address.split("-")[0]
			if(address != ""){
				for (var key in PLCSpace.scanCycle.inputImageTable) {
						var tagname  = key.split("-")[0]
						var contactType = key.split("-")[1]
						if(tagname == address){
							
							if(type == 'OPN'){
								if(contactType == 'OPN'){
									PLCSpace.scanCycle.inputImageTable[key].status = status;
									obj[address] =  status 	
									PLCSpace.PLCEditorSpace.showdata(obj);
								}else if(contactType == 'CLS'){
									PLCSpace.scanCycle.inputImageTable[key].status = status ==1.0 ? 0.0:1.0;
								}
							}else if(type == 'CLS'){
								if(contactType == 'CLS'){
									PLCSpace.scanCycle.inputImageTable[key].status = status;
								}else if(contactType == 'OPN'){
									PLCSpace.scanCycle.inputImageTable[key].status = status ==1.0 ? 0.0:1.0;
								}
							}
						}
					}
				
			}
			
				
	}
	var SetOutputOfExperssion = function(resultOfExpression , outputAddress){
		var outputContact = PLCSpace.scanCycle.outputImageTable[outputAddress];		
		outputContact.status = resultOfExpression;		
		//console.log(outputAddress +": "+outputContact.status)
		//PLCSpace.scanCycle.outputImageTable[outputAddress]=resultOfExpression;
		
	}
	var evaluateFunctionalBlock  = function(eq , resultOfExpression){		
		var functionblocktype = eq.functionObject.functionType;
		var functionblock = eq.functionObject.functionBlock[functionblocktype];
	//	PLCSpace.objectHolder.setObject(eq);
		PLCSpace.functionBlocks.execute(functionblock , resultOfExpression,functionblocktype , eq.rungId);	
	}
	
	var InsertInputInInputImageTable = function(ip){	
		if(_.isEmpty(ip))
		return;
			//throw new Exception._("Error : inputs cant be parsed ");
			
		for(var i =0;i<ip.length; i++){
			var tg = ip[i].tagName;
			inputImageTable[tg] = ip[i];
		}
		PLCSpace.scanCycle.inputImageTable = inputImageTable;
	}
	var InsertOutputInOutputImageTable = function(op){		
	/*	if(_.isEmpty(op))
			throw new Exception._("Error : outputs cant be parsed ");*/
			
		for(var i =0;i<op.length; i++){
			outputImageTable[op[i].tagName] = op[i];
		}
		PLCSpace.scanCycle.outputImageTable = outputImageTable;
	}
	
	var StopScanCycle  = function(){
		if(scancyclethread == undefined)
			throw new Exception._("Error : Already in development mode");
		clearInterval(scancyclethread);
		PLCSpace.scanCycle.stop = true;
		if(!!PLCSpace.objectHolder.functionalStorage)
		PLCSpace.objectHolder.functionalStorage.length = 0;
		logger.warn("Run Mode Deactivated");
	}
	
	return {
		ScanInstructionTable : ScanInstructionTable,
		setStatusOfToggledObject : setStatusOfToggledObject,
		showData : showData,
		InsertOutputInOutputImageTable : InsertOutputInOutputImageTable,
		InsertInputInInputImageTable : InsertInputInInputImageTable ,
		stop:stop,
		StopScanCycle:  StopScanCycle,
		RungPointer : RungPointer,
		totStatus : totStatus
	}
})();
