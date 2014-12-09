/**
 * @author : Sushil Medhe
 * TODO
 * read saved file on database and render it on html canvas
 */
PLCSpace.utilView = (function() {	

var openFile = function(){
	
	
		var testObject = [{"id":0,"attr":{"name":"main"},"rungs":[{"id":0,"attr":{"rungid":0,"name":"rung","loopid":0,"attr":{"isDisabled":false}},"loops":[],"elements":[{"inRung":"0","inLoop":-1,"id":"OPN-0-0-0","attr":{"id":"OPN-0-0-0","tagname":"a-OPN","status":"0.0","hardwareMapper":"hEF","type":"input","contactType":"OPN","inLoop":-1},"type":"input","isProcessed":true},{"inRung":"0","id":"RTO-0-7-0","attr":{"id":"RTO-0-7-0","type":"function","attr":{"type":"retentivetimeron","functionBlock":{"prevStatus":0,"tagName":"c","preset":"6000","type":"RTO","en":{"type":"output","tagName":"c_en","status":0},"dn":{"type":"output","tagName":"c_dn","status":0},"tt":{"type":"output","tagName":"c_tt","status":0},"acc":0}}},"type":"function","isProcessed":false}],"program":0},{"id":1,"attr":{"rungid":1,"name":"rung","loopid":0,"attr":{"isDisabled":false}},"loops":[],"elements":[{"inRung":"1","inLoop":-1,"id":"OPN-1-0-0","attr":{"id":"OPN-1-0-0","tagname":"b-OPN","status":"0.0","hardwareMapper":"hEF","type":"input","contactType":"OPN","inLoop":-1},"type":"input","isProcessed":true},{"inRung":"1","id":"RES-1-7-0","attr":{"id":"RES-1-7-0","type":"function","attr":{"type":"reset","functionBlock":{"rungAddress":1,"output":{"type":"reset","tagName":"c_reset","status":0,"hardwareAddress":""}}}},"type":"function","isProcessed":false}],"program":0}]}];

		// Put the object into storage
		sessionStorage.setItem('testObject', JSON.stringify(testObject));
		
		// Retrieve the object from storage
		//var retrievedObject = sessionStorage.getItem('testObject');
		
		//refresh the current tab
		location.reload();	
};
/**
 * param dt : a JSON of text file to be opened
 */
	var renderFile = function(dt){
		try
		  {
		
			dt = JSON.parse(dt);	
			$.each(dt,function(i,v){
			if(i != 0 ){
				PLCSpace.view.generateNewTab();
			}
			var rung = v.rungs 
			for(var j= 0 ; j< rung.length; j++){//in a current rung
				
				currentRung = PLCSpace.pageView.createRung(PLCSpace.currentProgramModel._rungid);
				PLCSpace.currentProgramModel._rungid++;		
				
				var rungelement_cnt = rung[j].elements.length;
				var rungloop_cnt = rung[j].loops.length;
				var eleIterator = 0;
				
				
				for(eleIterator = 0 ;eleIterator < rungelement_cnt ; eleIterator++){
					drawContactOrFunctionBlock(rung[j],eleIterator,currentRung);
				}
								
				for(var l = 0;l < rungloop_cnt ;l++){//loop on current rung
					var loop = rung[j].loops[l];
					
					var data = {
						coordinate : {
							x : loop.attr.coordinate.x,
							y : loop.attr.coordinate.y
						},
						id : rung[j].attr.rungid,
						isLoopPlaced : false ,
						parentObject : currentRung,
						pointOnRung : loop.attr.startPositionOfLoop,
						lastYCoordinate : loop.attr.coordinate.y+50

					}
					var loopLenCnt = loop.attr.endPositionOfLoop - loop.attr.startPositionOfLoop;
					getloop(data,loop,loop.attr.coordinate.y,currentRung,loopLenCnt);
					
				}//end of loop on current rung
			}//end of a current rung
		});
		  }
		catch(err)
		  {
		  	alert("Unable to open File");
		  }
		
		
	};//end of render file
	
	var drawContactOrFunctionBlock = function(rung,k,currentRung){
		
					var element = rung.elements[k];
					var eleID = element.attr.id;
					var type = eleID.split("-")[0];
					var position = eleID.split("-")[2];
					var paper = PLCSpace.currentProgramModel.paper;
					var data = {
						  	id : currentRung._id,
						  	blockOnRung : position,
							 coordinate : {
								x : 55 + (position * 135),
								y : currentRung.coordinate.y
							},
							parentObject : currentRung,
							lastYCordinate : currentRung.lastYCordinate + 50
					  	}
					  	
					  	switch(type){
					  		case "OPN":
						  		PLCSpace.PLCEditorSpace.setInstructionId("openContact");
						  		PLCSpace.PLCEditorSpace.drawInstruction(data);
						  		assignLabel(data,eleID,element.attr.tagname.split("-")[0]);
					  		break;
					  		case "CLS":
						  		PLCSpace.PLCEditorSpace.setInstructionId("closeContact");
						  		PLCSpace.PLCEditorSpace.drawInstruction(data);
						  		assignLabel(data,eleID,element.attr.tagname.split("-")[0]);
					  		break;
					  		case "OUT":
						  		PLCSpace.PLCEditorSpace.setInstructionId("addOutput");
						  		PLCSpace.PLCEditorSpace.drawInstruction(data);
						  		assignLabel(data,eleID,element.attr.tagname.split("-")[0]);
					  		break;
					  		
					  		case "OLT":
					  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.output.tagName,
							  	}
						  		PLCSpace.PLCEditorSpace.configureOLT(eleID,objTemp,data,paper,f,type);
					  		break;
					  		
					  		case "OTU":
					  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.output.tagName,
							  	}
						  		PLCSpace.PLCEditorSpace.configureOTU(eleID,objTemp,data,paper,f,type);
					  		break;
					  		
					  		case "ADD":
					  		case "SUB":
					  		case "MUL":
					  		case "DIV":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
						  		PLCSpace.PLCEditorSpace.drawInstruction(data);
						  		var objTemp = data.parentObject.functionBlockObject[eleID];
						  		var f = {
						  			label : element.attr.attr.functionBlock.label,
						  			labelA : element.attr.attr.functionBlock.sourceA.tagName,
						  			labelB : element.attr.attr.functionBlock.sourceB.tagName,
						  			labelR : element.attr.attr.functionBlock.destination.tagName,
						  			valueA : element.attr.attr.functionBlock.sourceA.status,
						  			valueB : element.attr.attr.functionBlock.sourceB.status
						  		}
						  		PLCSpace.PLCEditorSpace.configureArithmeticBlocks(eleID,objTemp,data,paper,f,true,type);
					  		break;
					  		
					  		case "CPT":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.label,
							  		expression : element.attr.attr.functionBlock.expression,
							  		destination :  element.attr.attr.functionBlock.destination.tagName
							  	}
							  	PLCSpace.PLCEditorSpace.configureCPT(eleID,objTemp,data,paper,f,true,type);
						  	break;
						  	
						  	case "TON":
						  	case "TOF":
						  	case "RTO":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.tagName,
							  		preset : element.attr.attr.functionBlock.preset
							  	}
						  		PLCSpace.PLCEditorSpace.configureTimer(eleID,objTemp,data,paper,f,true,type);
						  	break;
						  	case "CTU":
						  	case "CTD":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.tagName,
							  		preset : element.attr.attr.functionBlock.preset
							  	}
						  		PLCSpace.PLCEditorSpace.configureCounter(eleID,objTemp,data,paper,f,true,type);
						  	break;
						  	
						  	case 'RES':
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.output.tagName.split("_")[0],
							  	}
						  		PLCSpace.PLCEditorSpace.configureRES(eleID,objTemp,data,paper,f,type);
						  	break;
						  	
						  	case 'EQU':
							case 'NEQ':
							case 'GRT':
							case 'LES':
							case 'GEQ':
							case 'LEQ':
								PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.lable,
							  		SrcALabel : element.attr.attr.functionBlock.sourceA.tagName,
							  		SrcBLabel : element.attr.attr.functionBlock.sourceB.tagName,
							  		SrcAValue : element.attr.attr.functionBlock.sourceA.status,
							  		SrcBValue : element.attr.attr.functionBlock.sourceB.status
							  	}
							  	var outputAddress = element.attr.attr.functionBlock.outputAddress;
							  	PLCSpace.PLCEditorSpace.configureComparativeBlocks(eleID,objTemp,data,paper,f,outputAddress,type);
						  	break;
						  	case "CMP":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label:element.attr.attr.functionBlock.lable,
							  		op1 : element.attr.attr.functionBlock.op1,
							  		op2:element.attr.attr.functionBlock.op2,
							  		operations :element.attr.attr.functionBlock.operation
							  	}
							  	var outputAddress = element.attr.attr.functionBlock.outputAddress;
							  	PLCSpace.PLCEditorSpace.configureCMP(eleID,objTemp,data,paper,f,outputAddress,type);
						  	break;
						  	case "LIM":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label:element.attr.attr.functionBlock.label,
							  		HLLabel:element.attr.attr.functionBlock.highLabel,
							  		HLValue:element.attr.attr.functionBlock.highValue,
							  		LLValue:element.attr.attr.functionBlock.lowValue,
							  		LLlabel:element.attr.attr.functionBlock.lowLabel,
							  		TestLabel:element.attr.attr.functionBlock.testLabel,
							  		TestValue:element.attr.attr.functionBlock.testValue,
							  		
							  	}
							  	var outputAddress = element.attr.attr.functionBlock.outputAddress;
							  	PLCSpace.PLCEditorSpace.configureLIM(eleID,objTemp,data,paper,f,outputAddress,type);
						  	break;
						  	
						  	case "MOV":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.label,
							  		SrcALabel : element.attr.attr.functionBlock.source.tagName ,
							  		SrcAValue: element.attr.attr.functionBlock.source.status,
							  		SrcBLabel: element.attr.attr.functionBlock.dest.tagName,
							  	}
							  	PLCSpace.PLCEditorSpace.configureMOV(eleID,objTemp,data,paper,f,type);
						  	break;
						  	
						  	case "JMP":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.labelName
							  	};
							  	PLCSpace.PLCEditorSpace.configureJMP(eleID,objTemp,data,paper,f,type);
						  	break;
						  	
						  	case "LBL":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.labelName
							  	};
							  	PLCSpace.PLCEditorSpace.configureLBL(eleID,objTemp,data,paper,f,type);
						  	break;
						  	
						  	case "PID":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label: element.attr.attr.functionBlock.label,
							  		input: element.attr.attr.functionBlock.Input,
							  		inputval:  element.attr.attr.functionBlock.inputVal,
							  		output: element.attr.attr.functionBlock.outputLbl,
							  		action : element.attr.attr.functionBlock.action,
							  		control : element.attr.attr.functionBlock.control,
							  		type : element.attr.attr.functionBlock.type,
							  		setPiont : element.attr.attr.functionBlock.setPiont,
							  		maxInput : element.attr.attr.functionBlock.maxInput,
							  		minInput : element.attr.attr.functionBlock.minInput,
							  		kp : element.attr.attr.functionBlock.kp,
							  		P0 : element.attr.attr.functionBlock.P0,
							  		Time : element.attr.attr.functionBlock.Time,
							  		ki : element.attr.attr.functionBlock.ki,
							  		kd : element.attr.attr.functionBlock.kd,
							  		mode :  element.attr.attr.functionBlock.mode
							  	};
							  	PLCSpace.PLCEditorSpace.configurePID(eleID,objTemp,data,paper,f,type);
						  	break;
						  	case "JSR":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label :  element.attr.attr.functionBlock.tagName,
							  		Subroutine : element.attr.attr.functionBlock.srname,
							  		inputParameter : element.attr.attr.functionBlock.inputParam,
							  		returnParameter : element.attr.attr.functionBlock.output
							  	}
							  	PLCSpace.PLCEditorSpace.configureJSR(eleID,objTemp,data,paper,f,type);
						  	break;
						  	case "SBR":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.tagName,
							  		inputParameter : element.attr.attr.functionBlock.inputParam 
							  	}
							  	PLCSpace.PLCEditorSpace.configureSBR(eleID,objTemp,data,paper,f,type);
						  	break;
						  	case "RET":
						  		PLCSpace.PLCEditorSpace.setInstructionId(type);
							  	PLCSpace.PLCEditorSpace.drawInstruction(data);
							  	var objTemp = data.parentObject.functionBlockObject[eleID];
							  	var f = {
							  		label : element.attr.attr.functionBlock.label,
							  		returnParameter : element.attr.attr.functionBlock.output
							  	}
							  	PLCSpace.PLCEditorSpace.configureRET(eleID,objTemp,data,paper,f,type);
						  	break;
						  	
					  	}//switch case ends
					  
					  	
	}
	/*
	 * TODO
	 * draw a loop
	 */
	var getloop = function(data,loop,y,parentObject,len){
			var currentLoop = PLCSpace.pageView.drawLoop(data);
			for (var i=0; i < len; i++) {
				PLCSpace.pageView.expandLoop(currentLoop,parentObject);
			};
			//draw loop elements
			var loopelement_cnt = loop.elements.length;
			
			for (var n=0; n < loopelement_cnt; n++) {
				var element = loop.elements[n];
				eleID = element.attr.id;
				eleID1 = element.attr.id;
				var type = eleID.split("-")[0];
				eleID = eleID.split("-");
				var position = eleID[eleID.length-2];
				
				var data = {
					id : loop.id,
					blockOnRung : position,
					coordinate : {
								x : 55 + (position * 135),
								y : y + 50
					},
							parentObject : currentLoop,
							lastYCordinate : y+50
				}
				
					if(type == "OPN"){
					  		PLCSpace.PLCEditorSpace.setInstructionId("openContact");
					  		PLCSpace.PLCEditorSpace.drawInstruction(data);
					  		assignLabel(data,eleID1,element.attr.tagname.split("-")[0]);
					  	}else if(type == "CLS"){
					  		PLCSpace.PLCEditorSpace.setInstructionId("closeContact");
					  		PLCSpace.PLCEditorSpace.drawInstruction(data);
					  		assignLabel(data,eleID1,element.attr.tagname.split("-")[0]);
					  	}
			};
			
			//draw child loop/loops
			if(loop.loops.length > 0)
			{
				y = y+50;
				var childloop_cnt = loop.loops.length;
				for(var i = 0;i < childloop_cnt;i++)
				{
					var childloop = loop.loops[i];	
					var data = {
							coordinate : {
								x : childloop.attr.coordinate.x-3,
								y : childloop.attr.coordinate.y
							},
							id : loop.attr.loopid,
							isLoopPlaced : false ,
							parentObject : currentLoop,
							pointOnRung : childloop.attr.startPositionOfLoop,
							lastYCoordinate :childloop.attr.coordinate.y+50
						}
						var loopLenCnt = childloop.attr.endPositionOfLoop - childloop.attr.startPositionOfLoop;
						getloop(data,childloop,y,currentLoop,loopLenCnt);	
				}
					
			}
		}//getLoop ends
	
	/**
	 * same as "tag" function in blockview.js
	 */
	var assignLabel = function(data,id,label){
		
		
				var rungID = id.slice(4,5);
				var paper = PLCSpace.currentProgramModel.paper;
				var objTemp = data.parentObject.functionBlockObject[id];
				var type = id.slice(0,3);
				
					
				var obj = {};
			 	var t = objTemp.attr.label;
				t.attr("text" , label);
			 	/*
			 	* following 3 lines push "id" to respective object of perticular label
			 	*/
				var presentObj = PLCSpace.currentProgramModel.lableSet;
							
				obj[label] = [id];
				PLCSpace.currentProgramModel.lableSet.push(obj);
							
				data.parentObject.functionBlockObject[id].attr.tagName = label;
				data.parentObject.functionBlockObject[id]._value.label = label;
				if(!!data.parentObject.ipblock){
					data.parentObject.functionBlockObject[data.parentObject.ipblock]._value.outputAdress = label;
				}
				transformString = data.parentObject._eleSet[0].transform();
				data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
				data.parentObject.functionBlockObject[id]._eleSet.attr("title", label+" : "+objTemp.attr.type);
							
				PLCSpace.currentProgramModel.labels[id].label = label;
							
				PLCSpace.dataStore.UpdateElementLable(
						PLCSpace.view.programID,
						objTemp._id,
						objTemp._value.label+"-"+type , label)
									

			
	}
	
	
	var undo = function()
	{
		
		var obj = PLCSpace.currentProgramModel.undoStack.pop();
		if(obj == undefined){return 0}
		PLCSpace.currentProgramModel.redoStack.push(obj)
		if(obj.type == 'rung')
		{
			PLCSpace.currentProgramModel.globalEleSetObject.pop();
			obj.lastY = obj._eleSet[0].matrix.y(obj.coordinate.x,obj.coordinate.y);
			PLCSpace.currentProgramModel._startingPoint[1] -= 150;
			PLCSpace.currentProgramModel._rungid--;
			transformRung(0, (obj.lastY - 75), PLCSpace.currentProgramModel.eleset, 2);
			obj._eleSet.remove();
		}
		else if(obj.type == 'loop')
		{
			var id = obj._id.charAt(4)
			id = parseInt(id);
			PLCSpace.currentProgramModel.globalEleSetObject[id].uiEleArray.pop();
			obj._eleSet.remove();
			if(!!obj._parentObject.loopCount){obj._parentObject.loopCount--}
			obj._parentObject.loopPointArray[obj._loopPointOnRung].right = null;
		}
		else if(obj.type == 'contact')
		{
			obj._eleSet.remove();
			if(!!obj._parentObject.contactCount){obj._parentObject.contactCount--}
		}
		else if(obj.type == 'FBlock')
		{
			obj._eleSet.remove();
			
		}
	
	}
	var transformRung = function(x, y, list, index) {
		
		if (typeof index == 'undefined') {
			list.transform("t " + x + " " + y);
		} else {
			for ( var i = index; i < list.length; i++)
				list[i].transform("t " + x + " " + y);
		}
	
	}
var redo = function(){

		if(PLCSpace.currentProgramModel.redoStack.length ==0){return 0}
		var obj = PLCSpace.currentProgramModel.redoStack.pop();
		
		if(obj.type == 'rung')
		{
			PLCSpace.currentProgramModel._startingPoint[1] = obj.lastY;
			PLCSpace.currentProgramModel._rungid++;
			drawRung(obj._id);
		}
		else if(obj.type == 'loop')
		{
			 var data = {
                    id: obj._parentObject._id,
                    pointOnRung: obj._loopPointOnRung,
                    coordinate: {
                        x:	obj.coordinate.x,
                        y: 	obj.coordinate.y
                    },
                    parentObject: obj._parentObject,
                    isLoopPlaced : false,
                    lastYCoordinate: obj._parentObject.lastYCordinate
                }
			drawLoop(data)
		}
		else if(obj.type == 'contact')
		{
			type = obj._id.substring(0, 3);
			var data = { 
					id : obj._parentObject._id,
					blockOnRung : obj.position,
					coordinate : {
						x : obj.attr.x,
						y : obj.attr.y
					},
					parentObject : obj._parentObject,
					
				};
			if(type == "OPN"){
					instructionId = 'openContact';
					instructionObject[instructionId](data);
					obj._parentObject.contactCount++;
			}
			else if(type == "CLS"){
					instructionId = 'closeContact';
					instructionObject[instructionId](data);
					obj._parentObject.contactCount++;
			}
			else if(type == "OUT"){
					instructionId = 'addOutput';
					instructionObject[instructionId](data);
			}
			else{
				instructionObject[type](data);
			}
		}
		else if(obj.type == "FBlock"){
			type = obj._id.substring(0, 3);
			var data = { 
					id : obj._parentObject._id,
					blockOnRung : obj.position,
					coordinate : {
						x : obj._parentObject.coordinate.x+15,
						y : obj._parentObject.coordinate.y
					},
					parentObject : obj._parentObject,
					
				};
				if(instructionType(type)== 'OUTPUT'){data.coordinate.x += 805} 
				
				instructionObject[type](data,obj.f)
				
		}
		
	
	
}
	return{		
		undo : undo,
		openFile : openFile,
		redo : redo,
		renderFile : renderFile
	}
	})();