/**
 * Author : Sushil Medhe
 * TODO
 * executes functionblock and stores the result in scanCycle.outputImageTable
 */
window.PLCSpace.functionBlocks = (function(){
	
	var outputImgTable;
	var prevAcc = 0;
	var flag= false;
	var flagAdd = 0;
		flagSub = 0;
		flagDiv = 0;
		flagMul = 0;
	var cnt =-1;
	var inputImageTableOfSR = null ; 
	var outputImageTableOfSR = null ;
	var instructionTableOfSR = null ;
	var execute = function(fb,result , type , rungid){
		outputImgTable = PLCSpace.scanCycle.outputImageTable;
		switch(type){
		case "add" : evaluateAdd(fb,result , rungid);
					break;
		case "sub" : evaluateSub(fb,result , rungid);
					break;
		case "mul" : evaluateMul(fb,result , rungid);
					break;
		case "div" : evaluateDiv(fb,result , rungid);
		   			break;
		case "countup" : evaluateCounter(fb,result , 1);
						break;
		case "countdown" : evaluateDownCounter(fb,result);
						break;
		case "reset" : evaluateCounterReset(fb,result);
						break;
		case "timeron" : evaluateTimerOn(fb,result);
						break;
		case "timeroff" : evaluateTimerOff(fb,result);
						break;	
		case "retentivetimeron" : evaluateRTO(fb,result);
						break;
		case "latch" : evaluateLatch(fb,result , rungid);
						break;
		case "unlatch" : evaluateUnLatch(fb,result , rungid);
						break;	
		case "pid" : evaluatePID(fb,result);
                        break;
        case "equ" : evaluateEQU(fb);
                        break;
        case "neq" : evaluateNEQ(fb);
                        break;
        case "grt" : evaluateGRT(fb);
                        break;
        case "les" : evaluateLES(fb);
                        break;
        case "geq" : evaluateGEQ(fb);
                        break; 
        case "leq" : evaluateLEQ(fb);
                        break;  
        case "compare" : evaluateCMP(fb);
                        break;
        case "lim" : evaluateLIM(fb);
                        break; 
        case "move" : evaluateMOV(fb,result);
                        break; 
       	case "compute" : evaluateCPT(fb,result);
                        break;                 
       	case "jump" : evaluateJMP(fb,result);
                        break;  
        case "jsr" : evaluateJSR(fb,result);
        				break;
       
        case "scl" : evaluateSCL(fb,result);
        				break;    
        case "srt" : evaluateSRT(fb,result);
        				break;    
        case "totalizer" : evaluateTOT(fb,result);
        	break;                                                                                            
		}
		//console.log(PLCSpace.objectHolder.functionalStorage);
	}
	
	//change the text with referenced value 
	var updateValue = function(id,status){
		for(var i = 0; i<PLCSpace.currentProgramModel._collection.length;i++){
			t = PLCSpace.currentProgramModel._collection[i].functionBlockObject;
			for(var key in t){
				if(key == id){
									
									t[key].attr.valueA.attr("text" , status);
							}
						}
		}
					
	};
		var updateValueB = function(id,status){
		for(var i = 0; i<PLCSpace.currentProgramModel._collection.length;i++){
			t = PLCSpace.currentProgramModel._collection[i].functionBlockObject;
			for(var key in t){
				if(key == id){
									
									t[key].attr.valueB.attr("text" , status);
							}
						}
		}
					
	};
	var calculateStatus = function(tag){
		outputImgTable = PLCSpace.scanCycle.outputImageTable;
		inputImgTable = PLCSpace.scanCycle.inputImageTable;
		if(tag != "" && outputImgTable[tag] != undefined){
			return outputImgTable[tag].status;
		}
		else if(tag != "" && outputImgTable[tag+"-OUT"] != undefined){
			return outputImgTable[tag+"-OUT"].status;
		}
		else if(tag != "" && inputImgTable[tag+"-OPN"] != undefined){
			return inputImgTable[tag+"-OPN"].status;
		}
		else if(tag != "" && inputImgTable[tag+"-CLS"] != undefined){
			return inputImgTable[tag+"-CLS"].status;
		}
		else {
			return 0;
		}
	}
	var evaluateExpression = function(expression){
		//TODO : evalation of expression
		if(expression === "")
			throw new Exception._("Error : Circuit cannot be Resolved ");
		
		var inputimagetable = inputImageTableOfSR;
		var keys = _.keys(inputimagetable);
		for(var i =0;i<keys.length; i++){
			expBuilder.withVariable(inputimagetable[i].tagName , inputimagetable[i].status);
		};
		var equation = expBuilder.build(expression);
		var output = eval(equation)//expBuilder.calculate(equation);
		return output;
	}
	var SetOutputOfExperssion = function(resultOfExpression , outputAddress){
		for(var key in outputImageTableOfSR){
			if(outputImageTableOfSR[key].tagName == outputAddress){
				outputImageTableOfSR[key].status = resultOfExpression ; 
				break;
			}
		}	
		
	}
	var updateInputimagetable = function(label , status){
		var inputimagetable = inputImageTableOfSR;
		var keys = _.keys(inputimagetable);
		for(var i =0;i<keys.length; i++){
			if(inputimagetable[i].tagName.split("-")[0] == label)
				inputimagetable[i].status = status;
		};
	}
	var evaluateFunctionalBlock  = function(eq , resultOfExpression){		
		var functionblocktype = eq.functionObject.functionType;
		var functionblock = eq.functionObject.functionBlock[functionblocktype];
		PLCSpace.functionBlocks.execute(functionblock , resultOfExpression,functionblocktype , eq.rungId);	
	}	
	var evaluateJSR = function(obj,result){
		// 3 tables from first/main tab
		var inputImageTableOfMain = PLCSpace.InstructionTable.instructionTable[0].input ; 
		var outputImageTableOfMain = PLCSpace.InstructionTable.instructionTable[0].output ; 
		var InstructionTableOfMain = PLCSpace.InstructionTable.instructionTable[0].equation ;
		var outputImageTable = [];
		
		var inputparam = obj.inputParam.split(",");
		var returnparam = obj.output.split(",");
		if(!!result){
			for(var programCounter = 0; programCounter < PLCSpace.PLCEditorModel._collection.length; programCounter++ ){
				// 3 tables from current tab
				inputImageTableOfSR = PLCSpace.InstructionTable.instructionTable[programCounter].input ;
				outputImageTableOfSR = PLCSpace.InstructionTable.instructionTable[programCounter].output ; 
				instructionTableOfSR = PLCSpace.InstructionTable.instructionTable[programCounter].equation ;
				
				
				for(var i = 0;i < instructionTableOfSR.length ; i++){
					if(instructionTableOfSR[i].functionObject.functionType == "sbr"){
						
						var sbrFound = instructionTableOfSR[i].functionObject.functionBlock ;
						if(sbrFound["sbr"].tagName == obj.srname){
							//set/put the  output contact in outputimagetable
							for(var k =0;k<outputImageTableOfSR.length; k++){
								PLCSpace.scanCycle.outputImageTable[outputImageTableOfSR[k].tagName] = outputImageTableOfSR[k];
							}
							//set the  output value present in function block in outputimagetable
							for(var k =1;k<instructionTableOfSR.length; k++){//k=1 to ignore 1st rung containing sbr blk 
								if(_.isEmpty(instructionTableOfSR[k].functionObject) == false){
									var type = instructionTableOfSR[k].functionObject.functionType ; 
									var obj1 = instructionTableOfSR[k].functionObject.functionBlock[type];
									var len = _.keys(obj1).length;
									for(var i=0;i < len;i++){
										if(_.isObject(_.values(obj1)[i])){
											var outputContact = (_.values(obj1)[i]);
											if(!_.isEmpty(outputContact) && outputContact!= undefined)
													if(outputContact.type != "unlatch" )
													{
														//if(outputContact.status != -1)
														PLCSpace.scanCycle.outputImageTable[outputContact.tagName] = outputContact;
													}
														
													else{
														latchOjb = PLCSpace.scanCycle.outputImageTable[outputContact.tagName]; 		//set the unlatchstatus
														PLCSpace.scanCycle.outputImageTable[outputContact.tagName] = outputContact;
														if(latchOjb == "" || latchOjb == undefined){
													
														}else{
															latchOjb.unLatchstatus = outputContact.status;
														}
													};
										}				
									}
								}
								
								
							}
							//set the values of inputparams coming from main program to sbr program
							var inputparamOfSr = sbrFound.sbr.inputParam.split(","); 
							for(var l = 0 ; l < inputparamOfSr.length ; l++){
								if(PLCSpace.scanCycle.outputImageTable[inputparam[l]] != undefined){
									var val = PLCSpace.scanCycle.outputImageTable[inputparam[l]].status ; 
									if(PLCSpace.scanCycle.outputImageTable[inputparamOfSr[l]] != undefined){
										PLCSpace.scanCycle.outputImageTable[inputparamOfSr[l]].status = val;
									}
								}/*else if(PLCSpace.scanCycle.inputImageTable[inputparam[l]+"-OPN"] != undefined || 
								PLCSpace.scanCycle.inputImageTable[inputparam[l]+"-CLS"] != undefined ||
								PLCSpace.scanCycle.outputImageTable[inputparam[l]+"-OUT"]){
									
									if(PLCSpace.scanCycle.inputImageTable[inputparam[l]+"-OPN"] != undefined){
										var val = PLCSpace.scanCycle.inputImageTable[inputparam[l]+"-OPN"].status ;
										var type = "OPN" ; 
									}else if(PLCSpace.scanCycle.inputImageTable[inputparam[l]+"-CLS"] != undefined){
										var val = PLCSpace.scanCycle.inputImageTable[inputparam[l]+"-CLS"].status ;
										var type = "CLS" ;
									}else if(PLCSpace.scanCycle.outputImageTable[inputparam[l]+"-OUT"] != undefined){
										var val = PLCSpace.scanCycle.outputImageTable[inputparam[l]+"-OUT"].status ;
										
									}
									
									 var lbl = inputparamOfSr[l];
									 var lblObj = PLCSpace.currentProgramModel.labels ; 
									 for(var key in lblObj){
									 	if(lblObj[key].label == lbl){
									 		collection1 =  PLCSpace.currentProgramModel._collection;
											for(var k = 0 ; k < collection1.length ; k++){
												var elem1 = collection1[k].functionBlockObject[key];
												if(elem1 != undefined && elem1._id == key ){
													if(val == 0.0 ){
														if(key.split("-")[0] == "OPN"){
															if(type == "CLS"){
																collection1[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "assert/img/open_toggle.png";
																updateInputimagetable(lbl,1.0);
															}
																
															else{
																collection1[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "assert/img/open_normal.png";
																updateInputimagetable(lbl,0.0);
															}
																
														}
															
														else if(key.split("-")[0] == "CLS"){
															collection1[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "assert/img/close_normal.png";
															updateInputimagetable(lbl,0.0);
														}
															
													}else if(val == 1.0){
														if(key.split("-")[0] == "OPN"){
															if(type == "CLS"){
																collection1[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "assert/img/open_normal.png";
																updateInputimagetable(lbl,0.0);
															}
																
															else{
																collection1[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "assert/img/open_toggle.png";
																updateInputimagetable(lbl,1.0);
															}
																
														}
															
														else if(key.split("-")[0] == "CLS"){
															collection1[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "assert/img/close_toggle.png";
															updateInputimagetable(lbl,1.0);
														}
															
													}
												}
											}
									 	}
									 }
								}*/
								
							}
							//search for RET block
							var retObj = null ;
							var eq = instructionTableOfSR[instructionTableOfSR.length - 1];
							if(eq.functionObject.functionType == "ret"){
								retObj = eq.functionObject.functionBlock;
								returnParamOfSr = retObj["ret"].output.split(",");
								
								//set the values of returnparams coming from sbr program to main program
								for(var l = 0 ; l < returnParamOfSr.length ; l++){
									if(PLCSpace.scanCycle.outputImageTable[returnParamOfSr[l]] != undefined){
										var val = PLCSpace.scanCycle.outputImageTable[returnParamOfSr[l]].status ; 
										//var ob = PLCSpace.scanCycle.outputImageTable[returnParamOfSr[l]];
										//ob.tagName = returnparam[l];
										var ob={
											hardwareAddress:"",
											status : 0,
											tagName :returnparam[l],
	                                        type:"output"
										}
										PLCSpace.scanCycle.outputImageTable[returnparam[l]] = ob;
										//PLCSpace.scanCycle.outputImageTable[returnparam[l]].tagName = returnparam[l];
										//PLCSpace.scanCycle.outputImageTable[returnparam[l]].status = val;
										if(PLCSpace.scanCycle.inputImageTable[eq.equation].status == 1)
										{
											PLCSpace.scanCycle.outputImageTable[returnparam[l]].status = val;
										}
										else
										{
											PLCSpace.scanCycle.outputImageTable[returnparam[l]].status = 0;
										}
										
									}
									else if(PLCSpace.scanCycle.inputImageTable[returnParamOfSr[l]] != undefined){
										/*var val = PLCSpace.scanCycle.inputImageTable[returnParamOfSr[l]].status ; 
										var ob = PLCSpace.scanCycle.inputImageTable[returnParamOfSr[l]];
										ob.tagName = returnparam[l];
										PLCSpace.scanCycle.inputImageTable[returnparam[l]] = ob;
										
										if(PLCSpace.scanCycle.inputImageTable[eq.equation].status == 1)
											PLCSpace.scanCycle.inputImageTable[returnparam[l]].status = val;
										else
											PLCSpace.scanCycle.inputImageTable[returnparam[l]].status = 0;*/
									}
									
								}
							}//search for RET ends
							
							//execution in current tab copied from scanCycle.js
							for(var j = 1; j < instructionTableOfSR.length ; j++){
								eq = instructionTableOfSR[j];
								var resultOfExpression = (eq.equation == "") ? true : evaluateExpression(eq.equation);
								_.isEmpty(eq.functionObject) ?
									SetOutputOfExperssion(resultOfExpression , eq.output) : evaluateFunctionalBlock(eq, resultOfExpression);
									
								
								if(eq.output != "" && !!_.isEmpty(eq.functionObject)){
									// var obj = {};
									// var address = eq.output ; 
									// address = address.split("-")[0];
									// obj[address] =  resultOfExpression ;
									// PLCSpace.PLCEditorSpace.showdata(obj);	
									PLCSpace.scanCycle.showData(eq.output,resultOfExpression);
								}
							}
						}
					}
					
				}
			}//main forloop ends
			
		}//result ends
	}//evaluateJSR() ends
	
	
	var evaluateJMP = function(fb,result){
		var rungid = 0;
		if(!!result){
			//console.log(PLCSpace.scanCycle.outputImageTable)
			obj = PLCSpace.currentProgramModel.labels;
			for(var key in obj){
				if(key.split("-")[0] == "LBL" && obj[key].label == fb.labelName){
					rungid = key.split("-")[1];
					PLCSpace.scanCycle.RungPointer = parseInt(rungid);
				}
			}
		}
	}
	var evaluateCPT = function(obj,result){
		if(result !=0){
			var a= obj.expression;
			//var b = a.match(/[a-z]/g);
			var a1 = "(".concat(a)
			var b = a1.split(/[*\/()\.+=-][0-9]*/);
			if(b != null){
				for(var i=0;i<b.length;i++){
					
					var c = calculateStatus(b[i]);
					if(c != undefined)
					a = a.replace(b[i],c);
				}
			}
			a = eval(a);
			if(a == Infinity){
				a=0;
			}
			PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = a;
			PLCSpace.scanCycle.showData(obj.tagName , a);
		
		}
		else{
			PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
			PLCSpace.scanCycle.showData(obj.tagName , 0)
		}
	}
	var evaluateMOV = function(obj,result){
		if(result != 0 ){
			if(obj.source.status == -1){
				obj.source.status = calculateStatus(obj.source.tagName);
			}
			PLCSpace.scanCycle.outputImageTable[obj.dest.tagName].status = obj.source.status;
		
		}else{
			PLCSpace.scanCycle.outputImageTable[obj.dest.tagName].status = 0;
		}
			PLCSpace.scanCycle.showData(obj.dest.tagName , PLCSpace.scanCycle.outputImageTable[obj.dest.tagName].status);
	}
	
	var evaluateSCL = function(obj,status){
			var li=eval(obj.LI.status);
			var hi=eval(obj.HI.status);
			var lo=eval(obj.LO.status);
			var ho=eval(obj.HO.status);
			var ti=eval(obj.TI.status);
			
		if(li == -1){
			li = parseFloat(calculateStatus(obj.LI.tagName));
		}
		if(hi == -1){
			hi = parseFloat(calculateStatus(obj.LI.tagName));
		}
		if(lo == -1){
			lo = parseFloat(calculateStatus(obj.LI.tagName));
		}
		if(ho == -1){
			ho = parseFloat(calculateStatus(obj.LI.tagName));
		}
		if(ti == -1){
			ti = parseFloat(calculateStatus(obj.LI.tagName));
		}
		if(!!status){
			
			var res;
			if(ti < li){
				res = lo;
			}else if(ti>hi){
				res = ho;
			}else{
				var temp = (ho-lo)/(hi-li);
				res = (temp*ti)+(lo-temp*li);
			}
			
			res = res.toFixed(2);
			PLCSpace.scanCycle.outputImageTable[obj.res.tagName].status = res;
			PLCSpace.scanCycle.showData(obj.res.tagName , PLCSpace.scanCycle.outputImageTable[obj.res.tagName].status);
		}
	}
	
	var evaluateTOT = function(obj,status){
		
		PLCSpace.scanCycle.totStatus[obj.label]=status;
		var input=eval(obj.input.status);
		if(input == -1){
			input = parseFloat(calculateStatus(obj.input.tagName));
		}
		var timebase;
		//if(obj.timebae == )
		switch(obj.timebae){
			case "SEC":
				timebase = 1;
			break;
			case "MIN":
				timebase = 60;
			break;
			case "HRS":
				timebase = 3600;
			break;
			default:
				timebase = 0;
		}
		var preOutput = obj.preOutput;
		var totalOutput = 0;
	//	var preInput = 0;
		var preInput =input;
		var intervalVariable ;
		//PLCSpace.PLCEditorSpace.preInput[obj.label]=0;
		if((status == 1) && !PLCSpace.scanCycle.stop ) {
			if(obj.prevStatus == 0){
			
			obj.prevStatus = 1;
			
			
			var autorefresh = function ()
				{
					var functionObj = PLCSpace.objectHolder.getObjectWithTypeAndTag("reset" , obj.label);
					if(functionObj==null) {
						functionObj={};
						functionObj["st"]=0;
					}
					if(functionObj["st"]==undefined) 
						functionObj["st"]=0;
						console.log(functionObj.st==0)
					if((PLCSpace.scanCycle.totStatus[obj.label] == 1) && !PLCSpace.scanCycle.stop && (functionObj.st == 0)) {
						
								totalOutput = (preOutput)+1*(1/(2*timebase))*(input+preInput);
								preOutput = totalOutput;
								preInput = input;
								totalOutput = 0.0;
								PLCSpace.scanCycle.outputImageTable[obj.output.tagName].status =preOutput.toFixed(4);
								PLCSpace.scanCycle.showData(obj.output.tagName , PLCSpace.scanCycle.outputImageTable[obj.output.tagName].status);
								obj.preOutput = preOutput;
								
					} else {
						clearInterval(intervalVariable);
						
					}
					
				};
				
				intervalVariable = setInterval(autorefresh, 1000) ;
			}
		}else{
			clearInterval(intervalVariable);
			obj.prevStatus = 0;
			
		}		
		
		
		
	}/////////////
	
	var evaluateSRT = function(obj,status){
		var input=eval(obj.input.status);
		if(input == -1){
			input = parseFloat(calculateStatus(obj.input.tagName));
		}
		if(!!status){
			var res;
			res = Math.sqrt(input);
			res = res.toFixed(2);
			PLCSpace.scanCycle.outputImageTable[obj.output.tagName].status = res;
			PLCSpace.scanCycle.showData(obj.output.tagName , PLCSpace.scanCycle.outputImageTable[obj.output.tagName].status);
		}
		
	}
	var evaluateLIM = function(obj){
		var a= parseFloat(obj.lowValue);
		var c= parseFloat(obj.highValue);
		var b= parseFloat(obj.testValue);
		if(a == -1){
			a = parseFloat(calculateStatus(obj.lowLabel));
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.testLabel));
		}
		if(c == -1){
			b = parseFloat(calculateStatus(obj.highLabel));
		}
		if(b >= a && b<=c)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	var evaluateCMP = function(obj){
		//var expression = obj.expression;
		var type =  obj.operation;
		type = type.toLowerCase();
		var a = parseFloat(obj.op1);
		var b = parseFloat(obj.op2);
		
		if(isNaN(a)){
			a = parseFloat(calculateStatus(obj.op1));
		}
		if(isNaN(b)){
			b = parseFloat(calculateStatus(obj.op2));
		}
		
		
		switch(type){
			case "grt":
				if(a > b)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			break;
			case "equ":
				if(a == b)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			break;
			case "neq":
				if(a != b)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			break;
			case "les":
				if(a < b)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			break;
			case "geq":
				if(a >= b)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			break;
			case "leq":
				if(a <= b)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			break;
			case "and":
				PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = a&b;
			break;
			case "or":
				PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = a|b;
			break;
			case "xor":
				PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = a^b;
			break;
			case "not":
				if(a==0)
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status =1.0;
				else
					PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status =0.0;
			break;
		}	
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	var evaluateEQU = function(obj){
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
		}
		if(a==b)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	
	var evaluateNEQ = function(obj){
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(a == -1){
			a = calculateStatus(obj.sourceA.tagName);
			a = parseFloat(a);
		}
		if(b == -1){
			b = calculateStatus(obj.sourceB.tagName);
			b = parseFloat(b);
		}
		if(a != b)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	
	var evaluateGRT = function(obj){
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
		}
		if(a > b)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	var evaluateLES = function(obj){
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
		}
		if(a < b)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	var evaluateGEQ = function(obj){
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
		}
		if(a >= b)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	var evaluateLEQ = function(obj){
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
		}
		if(a <= b)
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 1.0
		else
			PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status = 0.0
			
		PLCSpace.scanCycle.showData(obj.outputAddress , PLCSpace.scanCycle.outputImageTable[obj.outputAddress+"-OUT"].status)
	}
	var evaluateAdd = function(obj,result,rungid){
		var paper = PLCSpace.currentProgramModel.paper;
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(result == 1){
		
		if(a == -1){
			var t;
				a = parseFloat(calculateStatus(obj.sourceA.tagName));
				updateValue("ADD-"+rungid+"-7-0",a);
			
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
			updateValueB("ADD-"+rungid+"-7-0",b);
		}
		}
		var c= a + b;
		
			//if(result == 0 && flagAdd == 0)
			if(result == 0)
					{
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
					}
			 else
			 {
			 	if(PLCSpace.PLCEditorSpace.flagRun == 1){
					 PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
				  }				
			   	  else {
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = c.toFixed(2);
						flagAdd = 1;	 	
					 }
			}
		PLCSpace.scanCycle.showData(obj.destination.tagName , PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status)
	}
	var evaluateSub = function(obj,result,rungid){
		var paper = PLCSpace.currentProgramModel.paper;
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(result == 1){
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
			//paper.text(obj.x,obj.y,a);
			updateValue("SUB-"+rungid+"-7-0",a);
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
			updateValueB("SUB-"+rungid+"-7-0",b);
		}
		}
		var c= parseFloat(a) - parseFloat(b);
		//if(result == 0 && flagSub == 0)
		if(result == 0)
					{
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
					}
			 else
			 {
			 	if(PLCSpace.PLCEditorSpace.flagRun == 1){
					 PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
				  }				
			   	  else {
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = c.toFixed(2);
						flagSub = 1;	 	
					 }
			}
		
			PLCSpace.scanCycle.showData(obj.destination.tagName , PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status)
	}
	var evaluateMul = function(obj,result,rungid){
		var paper = PLCSpace.currentProgramModel.paper;
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(result == 1){
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
			updateValue("MUL-"+rungid+"-7-0",a);
		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
			updateValueB("MUL-"+rungid+"-7-0",b);
		}
		}
		var c= a * b;
		//if(result == 0 && flagMul == 0)
		if(result == 0)
					{
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
					}
			 else
			 {
			 	if(PLCSpace.PLCEditorSpace.flagRun == 1){
					 PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
				  }				
			   	  else {
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = c.toFixed(2);
						flagMul = 1;	 	
					 }
			}
			
		PLCSpace.scanCycle.showData(obj.destination.tagName , PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status)
	}
	var evaluateDiv = function(obj,result,rungid){
		var paper = PLCSpace.currentProgramModel.paper;
		var a= parseFloat(obj.sourceA.status);
		var b= parseFloat(obj.sourceB.status);
		if(result == 1){
		if(a == -1){
			a = parseFloat(calculateStatus(obj.sourceA.tagName));
				updateValue("DIV-"+rungid+"-7-0",a);

		}
		if(b == -1){
			b = parseFloat(calculateStatus(obj.sourceB.tagName));
				updateValueB("DIV-"+rungid+"-7-0",b);

		}
		}
		var c = a / b;
		//if(result == 0 && flagDiv == 0)
		if(result == 0)
					{
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
					}
			 else
			 {
			 	if(PLCSpace.PLCEditorSpace.flagRun == 1){
					 PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = 0;
				  }				
			   	  else {
						PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status = c.toFixed(2);
						flagDiv = 1;	 	
					 }
			}
	
		PLCSpace.scanCycle.showData(obj.destination.tagName , PLCSpace.scanCycle.outputImageTable[obj.destination.tagName].status)
	}
	var evaluateCounter = function(obj,result){//up counter
		var acc = obj.acc;
		//prevAcc = acc;
		var preset = obj.preset;
		if(!!result){
			if(obj.prevStatus == 0){
			acc = acc+1;
			prevAcc = acc;
			console.log("accc "+prevAcc ) ;
			obj.acc= acc;
			if(acc<preset)
				outputImgTable[obj.dn.tagName].status = 0.0;				
			else if(acc == preset)
				outputImgTable[obj.dn.tagName].status = 1.0;		
			
			obj.prevStatus = 1;
			outputImgTable[obj.cu.tagName].status = 1.0;
			}
		}else{
			outputImgTable[obj.cu.tagName].status = 0.0;
			if(acc<preset){
				outputImgTable[obj.dn.tagName].status = 0.0;
			}else{
				outputImgTable[obj.dn.tagName].status = 1.0;
			}
				
			obj.prevStatus=0;
		}		
		PLCSpace.scanCycle.showData(obj.cu.tagName , outputImgTable[obj.cu.tagName].status);
		PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
		if(PLCSpace.PLCEditorSpace.flagRun == 1){
			prevAcc = 0;
					PLCSpace.scanCycle.showData(obj.tagName+"_acc" , prevAcc);
		}
		else{
				PLCSpace.scanCycle.showData(obj.tagName+"_acc" , prevAcc);			
		}
		
		
	
	}
	var evaluateDownCounter = function(obj,result){
		var acc = obj.acc;
		var preset = obj.preset;
		if(result){
			if(obj.prevStatus == 1){
			acc = acc-1;;
			//console.log("accc "+acc ) ;
			obj.acc= acc;
			if(acc > 0)
				outputImgTable[obj.dn.tagName].status = 1.0;				
			else if(acc <= 0)
				outputImgTable[obj.dn.tagName].status = 0.0;		
			
			obj.prevStatus = 0;
			outputImgTable[obj.cu.tagName].status = 1.0;
			}
		}else{
			outputImgTable[obj.cu.tagName].status = 0.0;
			if(acc <=0)
			outputImgTable[obj.dn.tagName].status = 0.0;	
			else
			outputImgTable[obj.dn.tagName].status = 1.0;
				
			obj.prevStatus=1;
		}		
		PLCSpace.scanCycle.showData(obj.cu.tagName , outputImgTable[obj.cu.tagName].status);
		PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
		PLCSpace.scanCycle.showData(obj.tagName+"_acc" , acc);
	}
	var evaluateCounterReset = function(obj,result){
		var tg = obj.output.tagName;
		var functionObj = PLCSpace.objectHolder.getExistingObject("CTU" , tg);
		if(functionObj == undefined){return 0;}
		obj["st"]=result;
		if(result){
			
			if(functionObj != null || functionObj != undefined){
				switch(functionObj.type){
					case "CTU":
						PLCSpace.scanCycle.outputImageTable[functionObj.dn.tagName].status = 0.0;
						functionObj.acc = 0.0;
						PLCSpace.scanCycle.showData(functionObj.tagName+"_acc" , 0);
						
						PLCSpace.scanCycle.showData(functionObj.dn.tagName , outputImgTable[functionObj.dn.tagName].status);
						prevAcc=0.0;
					break;
					case "CTD":
						PLCSpace.scanCycle.outputImageTable[functionObj.dn.tagName].status = 1.0;
						functionObj.acc = functionObj.preset;
						PLCSpace.scanCycle.showData(functionObj.tagName+"_acc" , functionObj.preset);
						
						PLCSpace.scanCycle.showData(functionObj.dn.tagName , outputImgTable[functionObj.dn.tagName].status);
					break;
					case "RTO":
						PLCSpace.scanCycle.outputImageTable[functionObj.dn.tagName].status = 0.0;
						PLCSpace.scanCycle.outputImageTable['acc'] = 0.0;
						functionObj.acc = 0.0;
						PLCSpace.scanCycle.showData(functionObj.tagName+"_acc" , 0);
						PLCSpace.functionBlocks.RTOFlag=false;
						PLCSpace.functionBlocks.returnFlag=true;
						
						PLCSpace.scanCycle.showData(functionObj.dn.tagName , outputImgTable[functionObj.dn.tagName].status);

					break;
					case "TOT":
						PLCSpace.scanCycle.outputImageTable[functionObj.output.tagName].status = 0.0;
						PLCSpace.scanCycle.showData(functionObj.output.tagName , 0.0);
						//PLCSpace.scanCycle.totStatus[functionObj.label]=0;
						
						functionObj.prevStatus=0;
						functionObj.preOutput=0;
						
					break;
				
				}
								
			}
									
			PLCSpace.scanCycle.outputImageTable[tg] = 1.0;
			PLCSpace.scanCycle.showData(tg , 1);
		}
		else{
			PLCSpace.scanCycle.showData(tg, 0);
			PLCSpace.functionBlocks.returnFlag=false;
			if(PLCSpace.scanCycle.totStatus[functionObj.label]==0 && obj["st"]==0){
				PLCSpace.scanCycle.totStatus[functionObj.label]=0;
			}else if(PLCSpace.scanCycle.totStatus[functionObj.label]==1 && obj["st"]==1){
			
				PLCSpace.scanCycle.totStatus[functionObj.label]=1;
			}
			
			
			/*
			for(var k=0;k<=PLCSpace.objectHolder.functionalStorage.length;k++){
							try{
								if(PLCSpace.objectHolder.functionalStorage[k].type=="RTO"){
								PLCSpace.objectHolder.functionalStorage[k].prevStatus=0;
							}
							}catch(err){
								
							}
							
				}//for loop ends*/
			
			
		}
	}
	var evaluateTimerOn = function(obj,result){
		var acc = 0;
		var preset = parseInt(obj.preset);
		var timect = 0;
		var interval = 100;
		var setTimeoutvariable ;
		if(!!result && !PLCSpace.scanCycle.stop ) {
			if(obj.prevStatus == 0){
			PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 1.0; 
			PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
			obj.prevStatus = 1;
			var autorefresh = function ()
				{
					if(timect < preset && 	PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status && !PLCSpace.scanCycle.stop) {
						timect = parseInt(timect)+ parseInt(interval);
						PLCSpace.scanCycle.outputImageTable[obj.acc]= timect;
						PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 1.0;
						PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
						PLCSpace.scanCycle.showData(obj.tagName+"_acc" , timect);
					} else {
						clearInterval(setTimeoutvariable);
						PLCSpace.scanCycle.outputImageTable[obj.acc]= timect;
						PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
						PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = 1.0;
						PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
						PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
						PLCSpace.scanCycle.showData(obj.tagName+"_acc" , timect);
					}
					
				};
				
				setTimeoutvariable = setInterval(autorefresh, 100) ;
			}
		}else{
			clearInterval(setTimeoutvariable);
			obj.prevStatus = 0;
			PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
			PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = 0.0;
			PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 0.0;
			PLCSpace.scanCycle.outputImageTable[obj.acc]= 0;
			PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
			PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
			PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
			PLCSpace.scanCycle.showData(obj.tagName+"_acc" , 0);
		}		
	}
	
	var evaluateTimerOff = function(obj,result){
		var acc = 0;
		var preset = parseInt(obj.preset);
		var timect = 0;
		var interval = 100;
		var setTimeoutvariable ;
		if(!result && !PLCSpace.scanCycle.stop){
			if(obj.prevStatus == 1){
			PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 0.0; 
			PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
			
			obj.prevStatus =0 ;
			var autorefresh = function ()
				{
					if(timect < preset && 	!PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status && !PLCSpace.scanCycle.stop) {
						timect = parseInt(timect)+ parseInt(interval);
						PLCSpace.scanCycle.outputImageTable[obj.acc]= timect;
						PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 1.0;
						PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = 1.0;
						PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
						PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
						PLCSpace.scanCycle.showData(obj.tagName+"_acc" , timect);
					} else {
						clearInterval(setTimeoutvariable);
						PLCSpace.scanCycle.outputImageTable[obj.acc]= timect;
						PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
						PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = 0.0;
						PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
						PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
						PLCSpace.scanCycle.showData(obj.tagName+"_acc" , timect);
					}
					
				};
				
				setTimeoutvariable = setInterval(autorefresh, 100) ;
			}
		}
		else{
			clearInterval(setTimeoutvariable);
			obj.prevStatus = 1;
			PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
			PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = 1.0;
			PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 1.0;
			PLCSpace.scanCycle.outputImageTable[obj.acc]= 0;
			PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
			PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
			PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
			PLCSpace.scanCycle.showData(obj.tagName+"_acc" , 0);
		}		
		
	}
	var evaluateRTO = function(obj,result){
		if(PLCSpace.functionBlocks.returnFlag==true){
			if(result == 0){
				PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 0.0;
				PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
				PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
				PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
			}else if(result == 1){
				PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 1.0;
				PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
			
			}
			
			return 0;
		
		}
		 var acc = obj.acc;
		  var preset = parseInt(obj.preset);
		  var timect = obj.acc;
		  var interval = 100;
		  var setRtoTimeoutvariable ;
		  if(!!result && !PLCSpace.scanCycle.stop ) {
		   if(obj.prevStatus == 0){
		   PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 1.0; 
		   PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
		   obj.prevStatus = 1;
		   var autorefresh = function ()
		    {
		    if(PLCSpace.functionBlocks.returnFlag==true){
			timect=0;
			return 0;
			
			}
		     if(timect < preset && !!PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status && !PLCSpace.scanCycle.stop) {
		     	if(PLCSpace.functionBlocks.RTOFlag == true){return 0;}
		      timect = parseInt(timect)+ parseInt(interval);
		      console.log("Acc is:"+timect);
		      PLCSpace.scanCycle.outputImageTable["acc"]= timect;
		      PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 1.0;
		      PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
		      PLCSpace.scanCycle.showData(obj.tagName+"_acc" , timect);
		     } else {
		      clearInterval(setRtoTimeoutvariable);
		      PLCSpace.scanCycle.outputImageTable["acc"]= (timect == preset)  ? 0 :  timect;
		      PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
		      PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = (timect == preset) ?   1.0 : 0.0;
		      PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
		      PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
		      PLCSpace.scanCycle.showData(obj.tagName+"_acc" , timect);
		      if(timect == preset){
		      	PLCSpace.functionBlocks.RTOFlag = true;
		      }
		     }
		     
		    };
		    
		    setRtoTimeoutvariable = setInterval(autorefresh, 100) ;
		    
		   }
		  }else{
		   clearInterval(setRtoTimeoutvariable);
		   
		   PLCSpace.scanCycle.outputImageTable[obj.tt.tagName].status = 0.0;
		   PLCSpace.scanCycle.outputImageTable[obj.dn.tagName].status = 0.0;
		   PLCSpace.scanCycle.outputImageTable[obj.en.tagName].status = 0.0;
		   //PLCSpace.scanCycle.outputImageTable["acc"]= timect;
		  
		   if(PLCSpace.scanCycle.outputImageTable["acc"] != undefined){
		    obj.acc = PLCSpace.scanCycle.outputImageTable["acc"];
		   }
		   
		   
		   PLCSpace.scanCycle.showData(obj.tt.tagName , outputImgTable[obj.tt.tagName].status);
		   PLCSpace.scanCycle.showData(obj.en.tagName , outputImgTable[obj.en.tagName].status);
		   PLCSpace.scanCycle.showData(obj.dn.tagName , outputImgTable[obj.dn.tagName].status);
		   
		   
		   if(PLCSpace.functionBlocks.RTOFlag == true){return 0;}
		   obj.prevStatus = 0;
		   
		   //if(timect ==0 )
		   // PLCSpace.scanCycle.showData(obj.tagName+"_acc" , 0);
		 
		  }
		
	}
	var evaluateLatch = function(obj,result,rungid){
		var tg = obj.output.tagName;
		 var unlatchObj = PLCSpace.objectHolder.getExistingObject("unlatch" , tg);
		 var latch = PLCSpace.scanCycle.outputImageTable[tg];
		 latch.preOutput = PLCSpace.scanCycle.outputImageTable[latch.tagName].status;
		if(result){			
			 latch.status = result?1.0:0.0;
			 obj.output.status = latch.status;
			 PLCSpace.scanCycle.outputImageTable[tg].status = latch.status;
			 obj.unlatchOutput =  PLCSpace.scanCycle.outputImageTable[tg].status;
			 (unlatchObj != undefined)?
			 unlatchObj.status =  latch.status : "";
		}		
		PLCSpace.scanCycle.showData(tg ,latch.status);
	}
	
	var evaluateUnLatch = function(obj,result){
		var tg = obj.output.tagName;
		var latchObj =  PLCSpace.objectHolder.getExistingObject("latch" , tg);
		if(result){
				 obj.output.status = 1.0;
				 latchObj.unlatchOutput = 0.0;
				 latchObj.output.status = 0.0;
				 PLCSpace.scanCycle.outputImageTable[latchObj.output.tagName].status = 0.0;
				 latchObj.preOutput = 0.0;
				 //console.log("unLatch : "+ latchObj.unlatchOutput);
			}
			PLCSpace.scanCycle.showData(tg ,  obj.output.status);
	}
	var evaluatePID = function(pidobj,result){
	   var output = 0;
	   var objk;
	   objk=PLCSpace.sarvaGlobal[pidobj.label];
	   // objk=pidobj;
        if(result) {
            var control = pidobj.control;
            var mode = pidobj.mode;
            if(mode == "auto"){
                
                
                objk=evaluatePIDnew(objk);
                output=objk.outVal;
            }
            else {
               output =(objk.Input);
            }
        }else if(!result){
        	
        	PLCSpace.sarvaGlobal[pidobj.label].outputVal =0;
			PLCSpace.sarvaGlobal[pidobj.label].intialControlOp=50;
			PLCSpace.sarvaGlobal[pidobj.label].preE=0;
        }
        objk.output =  output;
        PLCSpace.sarvaGlobal[pidobj.label]=objk;
        PLCSpace.scanCycle.showData(objk.outputLbl , output);
        //outputImgTable['pid'].status = output;
	}
	
    
   //////////////////////new pid
   
   var evaluatePIDnew = function(obj) {
	var ip = obj.inputVal;
	var sp = obj.setPiont;
	var ep = sp - ip;
	var outVal = 0;
	if(obj.mode == "auto") {//auto
		switch(obj.control) {
			case "p" :
				if(obj.action == "direct") {
					outVal = ep * parseFloat(obj.kp) + parseFloat(obj.P0);
				} else if(obj.action == "reverse") {
					outVal = (-ep) * parseFloat(obj.kp) + parseFloat(obj.P0);
				}
				break;
			//p ends
			case "pi" :
				if(obj.type == "parallel") {
					if(obj.action == "direct") {
						outVal = (ep * obj.kp) + (obj.ki * (obj.preE + ep)) + obj.intialControlOp + parseFloat(obj.P0);
						if(outVal < obj.minInput) {
							outVal = obj.minInput;
						} else if(outVal >= obj.maxInput) {
							outVal = obj.maxInput;
						}
						obj.intialControlOp = (obj.ki * (obj.preE + ep)) + obj.intialControlOp;

					} else if(obj.action == "reverse") {
						outVal = ((-ep) * obj.kp) - (obj.ki * (obj.preE + ep)) + obj.intialControlOp + parseFloat(obj.P0);
						if(outVal < obj.minInput) {
							outVal = obj.minInput;
						} else if(outVal >= obj.maxInput) {
							outVal = obj.maxInput;
						}
						obj.intialControlOp = obj.intialControlOp - (obj.ki * (obj.preE + ep));
					}
				}//parallel ends
				else if(obj.type == "non-intreracting") {
					if(obj.action == "direct") {
						outVal = (ep * obj.kp) + (obj.kp * obj.ki * (obj.preE + ep)) + obj.intialControlOp + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = ((obj.kp * obj.ki * (obj.preE + ep)) + obj.intialControlOp);
					} else if(obj.action == "reverse") {
						outVal = (-ep) * obj.kp - (obj.kp * obj.ki * (obj.preE + ep)) + obj.intialControlOp + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = (obj.intialControlOp - (obj.kp * obj.ki * (obj.preE + ep)));
					}

					//non-intreracting ends
				}
				break;
			//pi ends

			case "pd":
				// ///pd type
				if(obj.type == "parallel") {
					if(obj.action == "direct") {
						outVal = obj.kp * ep + (obj.kd / obj.Time) * (ep - obj.preE) + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = (outVal);
					} else {
						outVal = obj.kp * (-ep) - ((obj.kd / obj.Time) * ((ep) - obj.preE)) + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = (outVal);
					}
				}// pd parallel end

				else {// pd non interacting

					if(obj.action == "direct") {
						outVal = obj.kp * ep + (obj.kd / obj.Time) * obj.kp * (ep - obj.preE) + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = (outVal);
					} else {
						outVal = obj.kp * (-ep) - ((obj.kd / obj.Time) * obj.kp * ((ep) - obj.preE)) + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = (outVal);
					}

				}// //pd non interacting end
				break;
			//pd ends

			case "pid":

				// pid type
				if(obj.type == "parallel") {
					if(obj.action == "direct") {
						outVal = (ep * obj.kp) + (obj.ki * (obj.preE + ep)) + ((obj.kd / obj.Time) * (ep - obj.preE)) + obj.intialControlOp + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = ((obj.ki * (obj.preE + ep)) + obj.intialControlOp);
					} else {
						outVal = (-ep) * obj.kp - (obj.ki * (obj.preE + ep)) - ((obj.kd / obj.Time) * (ep - obj.preE)) + obj.intialControlOp + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = (obj.intialControlOp - (obj.ki * (obj.preE + ep)));
					}
				}// pid - parallel end

				else {// pid-Non interacting start

					if(obj.action = "direct") {
						outVal = (ep * obj.kp) + (obj.kp * obj.ki * (obj.preE + ep)) + ((obj.kd / obj.Time) * obj.kp * (ep - obj.preE)) + obj.intialControlOp + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
						obj.intialControlOp = ((obj.kp * obj.ki * (obj.preE + ep)) + obj.intialControlOp);
					} else {
						outVal = (-ep) * obj.kp - (obj.kp * obj.ki * (obj.preE + ep)) - ((obj.kd / obj.Time) * obj.kp * (ep - obj.preE)) + obj.intialControlOp + parseFloat(obj.P0);

						if(outVal < obj.minInput)
							outVal = obj.minInput;
						else if(outVal >= obj.maxInput)
							outVal = obj.maxInput;
							obj.intialControlOp = (obj.intialControlOp - (obj.kp * obj.ki * (obj.preE + ep)));
					}

				}// pid-Non interacting end

				// pid type end

				break;
			//pid ends

		}

	}//auto ends
	if(outVal != "0")
	obj.outVal=outVal.toFixed(2);
	obj.preE=ep;
	return obj;
}
 /////////////////////new pid end
	
	return {
		execute :execute,
		flagAdd:flagAdd
	}
})()