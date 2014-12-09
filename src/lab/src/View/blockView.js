/**
 * Author : Sushil Medhe
 * TODO
 * 1.create various plc objects like opn/cls contact,functional blocks
 * 2.create different operations on plc elements like tag,toggle,delete,modify
 * 3.change the status/values of contacts & functional block according to values coming from 
 * ScanCycle.js or FunctionBlock.js 
 */

PLCSpace.PLCEditorSpace = (function() {
	//console.log(PLCSpace.PLCEditorSpace.currentProgramModel.paper);
	var// some global variable
	instructionId;
	flag1 = 0;
	flagRun = 0;
	inputInstruction = {
		"openContact" : true,
		"closeContact" : true,
		"CMP" : true,
		"EQU" : true,
		"NEQ" : true,
		"GRT" : true,
		"LES" : true,
		"GEQ" : true,
		"LEQ" : true,
		"LIM" : true,
		"SBR" : true,
		"LBL" : true,
		"LGC" : true,
		
		
	},
	 outputInstruction = {
	 	"addOutput" : true,
		"OLT" : true,
		"OTU" : true,
		"addUnlatch" : true,
		"RES" : true,
		"TON" : true,
		"TOF" : true,
		"RTO" : true,
		"CTU" : true,
		"CTD" : true,
		"ADD" : true,
		"SUB" : true,
		"MUL" : true,
		"DIV" : true,
		"MOV" : true,
		"CPT" : true,
		"JSR" : true,
		"JMP" : true,
		"PID" : true,
		"RET" : true,
		"SCL" : true,
		"SRT" : true,
		"TOT" : true
	}, blockCounter = 0, selected = null;

	var ProgramModel = {};
	var pidId = null;
	var poc = {};
	var createProgramModel = function(){
			var PModel = {
			_id : "",
			_rungid : 0,
			_collection : [],
			_save : false,
			paper : null,
			eleset : null,
			disabledRung : [],
			runModeSet : null,
			lableSet : [],
			lbl :[],
			labels : {},
			latchlabels : [],
			loopObject : {},  //stores loopid(key) and loopid,length of loop,id of containing contacts as a (values)
			fbObjects : {},
			_startingPoint : [ 40, 50 ],
			globalEleSetObject: [], //global array to store information about Rung/Loop for performing transformation
			// Rung/Loop for performing transformation
			rungCoordinateArray : [],
			runmode : false,
			runmodeFlag : false,
			getID : function() {
				return this._id;
			},
			setID : function(id) {
				this._id = id
			},
			rungDepth : [],
			undoStack : [10],
			redoStack : [10],
			loopTodelete :null,
			//elementTodelete : null,
			deleteOption : "",
			runnableObject : {},
			latchCount : 0,
			unlatchCount : 0,
			outputElement : {}  //contains rungid(key) and 1(value)if o/p is present on respective rung else 0(value) 
			};
		return PModel;
		};
		 
	
	/*
     * @Param loopObject for drawing button on that ui
     * TODO ::
     * 1. Creating button for loop to expand and adding click event for that button
     * */

	/*@Param rung/loop Address
	 * TODO::
	 * 1. To draw instruction block for an object
	 * 2. Instruction Object for Complete Instruction Like add,mul
	 */
    var setInstructionId = function(instruction) {
		instructionId = instruction;
		PLCSpace.PLCEditorSpace.instructionId =instructionId;
		//return instructionId;
	}
	var drawInstruction = function(data) {
		if(!!PLCSpace.currentProgramModel.runmode){return 0}
		if(data.isOccupied)
		{
			alert("Not allowed...Input contact already placed !!");
			return 0;
		}
		
		if (instructionType(instructionId) == "INPUT") {
			
			if(PLCSpace.currentProgramModel._id == 'tabhead1' && instructionId == 'SBR'){
				
				alert("sbr not allowed here")
				return 0;
			}

			if ((data.blockOnRung == 0)) {
				
				if((instructionId != "openContact") && (instructionId != "closeContact"))
				{
					if(data.parentObject.loopCount > 0 || data.parentObject.contactCount > 0){
						alert("not allowed")
						return 0;
					}
					if(data.parentObject.blockFlag == true){
						alert("Two functional blocks on same rung ...not allowed");
						return 0;
					}	
					if(instructionId == 'LBL' && PLCSpace.currentProgramModel.outputElement[data.parentObject._id] == 1)
					{
						alert("Delete output first...")
						return 0 ;
					}
					data.parentObject.isBlockPresent = true;
					data.parentObject.blockFlag = true;
					
				}
				instructionObject[instructionId](data);
				data.isOccupied = true ;
				PLCSpace.currentProgramModel.runnableObject[data.parentObject._id] = 1;
				if(instructionId == "openContact" || instructionId == "closeContact")
				data.parentObject.contactCount++;
			}
			else if(!(data.blockOnRung === 7) && (instructionId == "openContact" || instructionId == "closeContact")) {
				instructionObject[instructionId](data);
				PLCSpace.currentProgramModel.runnableObject[data.parentObject._id] = 1;
				data.isOccupied = true;
				data.parentObject.contactCount++;
			}
			 else {
				alert("You can not place input at the last segment of rung");
			}
		} else if(instructionType(instructionId) == "OUTPUT" ) {
			PLCSpace.currentProgramModel.runnableObject[data.parentObject._id] = 1;
			PLCSpace.currentProgramModel.outputElement[data.parentObject._id] = 1;
			if(data.blockOnRung == 7) {
				if(data.parentObject.isLabelPresent == true){
					alert("Not allowed,as Label Block is present");
					return 0;
				}
				if(instructionId != "addOutput"){
					if(data.parentObject.blockFlag == true){
						alert("Two functional blocks on same rung ...not allowed");
						return 0;
					}
					data.parentObject.blockFlag = true;
				}
				PLCSpace.currentProgramModel.runmodeFlag = true;
				data.isOccupied = true ;
				instructionObject[instructionId](data);
			} else {
				alert("Place output at the last segment of rung");
			}
		} else {

		}

	}
	
	var getInLoopStatus = function(data) {
		//console.log(data.parentObject._collection)
		for(var i = 0 ; i < data.parentObject._collection.length ;i++)
		{
			var arr = data.parentObject._collection[i].occupiedPoint
			if( arr[0] <= data.blockOnRung && arr[arr.length-1] > data.blockOnRung)
			{
				return [1,data.parentObject._collection[i]];
			}

		}
		return false;
	}
	var instructionObject = {
		openContact : function(data, type ,isOld) {
		if (type == undefined) {
				type = 0;
			}

			data.id = PLCSpace.pageView.generateID(data.id);
			
			var id = "OPN-" + data.id + "-" + data.blockOnRung+"-" + PLCSpace.view.programID;

			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					label : "?",
					tagname : "?",
					x : data.coordinate.x,
					y : data.coordinate.y
				},
				_eleSet : paper.set(),
				inloop : -1,
				position : data.blockOnRung,
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?",
						label : "?"
				}
			}
			var arr = getInLoopStatus(data);
			if(!!arr){
				functionObject.inloop = arr[1]._id.charAt(arr[1]._id.length-1)
				
			}
			data.parentObject.blockOnRung = data.blockOnRung;
			if(!!data.parentObject.occupiedBlocks){				//i.e.if contact is on loop
				data.parentObject.occupiedBlocks.push(data.blockOnRung)
			}
			if(!!data.label)
			{
				var lbl = data.label;
			}
			else
			{
				var lbl = "?";
			}
			var label = paper.text(data.coordinate.x + 60, data.coordinate.y + 20, lbl);
			
			if(type == 0 ){
				
				url = "../assert/img/open_normal.png";
				functionObject.attr.type = 0;
			}
			else if(type == 1){
				
				url = "../assert/img/open_toggle.png";
				functionObject.attr.type = 1;
			} 
			var node = paper.image(url, data.coordinate.x + 40, data.coordinate.y - 15, 40, 30);
			node.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "contact";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			functionObject._body = node;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;

			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			
			node.attr("title", functionObject._value.label);	
			functionObject.type = 'contact';
			PLCSpace.currentProgramModel.undoStack.push(functionObject);	
			functionObject._eleSet.transform(functionObject.transformString);
			
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
				}
			/*
			 * 
			 */
			var loop = functionObject._parentObject.loops;
     	 	for (var key in loop) {
					 //console.log(loop[key].points)
					   if(functionObject.position  >= loop[key].points[0] && functionObject.position < loop[key].points[loop[key].points.length - 1]){
					   		
					   		PLCSpace.currentProgramModel.loopObject[key].contactCounts.push(functionObject._id);
					   		
					   }	  
			}
			
			PLCSpace.dataStore.InsertElement({
					id: id,
				tagname : '?',
				id : id,
				status : "0.0",
				hardwareMapper : "hEF",
				type : 'input',
				contactType : 'OPN',
				inLoop : functionObject.inloop,
			}, PLCSpace.view.programID);
		},
		closeContact : function(data, type) {
			if (type == undefined) {
				type = 1;
			}
			data.id = PLCSpace.pageView.generateID(data.id);
			var id = "CLS-" + data.id + "-" + data.blockOnRung+"-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					label : "?",
					tagname : "?",
					x : data.coordinate.x,
					y : data.coordinate.y
				},
				_eleSet : paper.set(),
				inloop : -1,
				position : data.blockOnRung,
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?",
					label : "?"
				}
			}
			var arr = getInLoopStatus(data);
			if(!!arr){
				functionObject.inloop = arr[1]._id.charAt(arr[1]._id.length-1)
			}
			data.parentObject.blockOnRung = data.blockOnRung;
			if(!!data.parentObject.occupiedBlocks){				//i.e.if contact is on loop
				data.parentObject.occupiedBlocks.push(data.blockOnRung)
			}
			if(!!data.label)
			{
				var lbl = data.label;
			}
			else
			{
				var lbl = "?";
			}
			var label = paper.text(data.coordinate.x + 60, data.coordinate.y + 20, lbl);
			if(type == 0 ){
				
				url = "../assert/img/close_normal.png";
				functionObject.attr.type = 0;
			}
			else if(type == 1){
				
				url = "../assert/img/close_toggle.png"
				functionObject.attr.type = 1;
			}
			var node = paper.image(url, data.coordinate.x + 40, data.coordinate.y - 15, 40, 30);
			node.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "contact";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id , data);
			functionObject._eleSet.push(node,label);
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			node.attr("title", functionObject._value.label);
			functionObject.type = 'contact';
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			var loop = functionObject._parentObject.loops;
     	 	for (var key in loop) {
					 //console.log(loop[key].points)
					   if(functionObject.position  >= loop[key].points[0] && functionObject.position < loop[key].points[loop[key].points.length - 1]){
					   		
					   		PLCSpace.currentProgramModel.loopObject[key].contactCounts.push(functionObject._id);
					   		
					   }	  
			}
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
				}
			PLCSpace.dataStore.InsertElement({
				tagname : '?',
				id : id,
				status : "1.0",
				hardwareMapper : "hEF",
				type : 'input',
				contactType : 'CLS',
				inLoop : functionObject.inloop,
			}, PLCSpace.view.programID);
		},
		addOutput : function(data) {
				
			data.id = PLCSpace.pageView.generateID(data.id);
			var id = "OUT-" + data.id + "-" + data.blockOnRung+"-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					x : data.coordinate.x,
					y : data.coordinate.y
				},
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				classname : "",
				_value : {
							tagname : "?",
							label : "?"
						}
				}
			if(!!data.label)
			{
				var lbl = data.label;
			}
			else
			{
				var lbl = "?";
			}
			
			var label = paper.text(data.coordinate.x + 60, data.coordinate.y + 20, lbl);
			var node = paper.image("../assert/img/output.png", data.coordinate.x + 40, data.coordinate.y - 15, 40, 30);
			node.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "contact";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			node.attr("title", functionObject._value.label);
			data.parentObject.opblock = functionObject._id;
			functionObject.type = 'contact';
			functionObject.attr.type = 0;
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				tagname : '?',
				id : id,
				status : "0.0",
				hardwareMapper : "",
				type : 'output',
				inLoop : -1
			}, PLCSpace.view.programID);
		},
		OLT : function(data) {
			
			if(!!data.parentObject.isBlockPresent){return 0 }
			var id = "OLT-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					x : data.coordinate.x,
					y : data.coordinate.y 
				},
				_eleSet : paper.set(),
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?",
					label : "?"
				}
			}
			if(!!data.label)
			{
				var lbl = data.label;
			}
			else
			{
				var lbl = "?";
			}
			var label = paper.text(data.coordinate.x + 60, data.coordinate.y + 20, lbl);
			var node = paper.image("../assert/img/latch.png", data.coordinate.x + 40, data.coordinate.y - 15, 40, 30);
			node.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			ContextMenu(functionObject.classname, id , data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			node.attr("title", functionObject._value.label);
			functionObject.type = 'contact';
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.currentProgramModel.latchCount++;
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "latch",
					functionBlock : {

						"output" : {
							"hardwareAddress" : "l1",
							"tagName" : "?",
							"type" : "latch",
							status : 0.0
						},
						"preOutput" : -1,
						"unlatchOutput" : -1,

					}
				}
			}, PLCSpace.view.programID);
		},
		OTU : function(data) {
		if(!!data.parentObject.isBlockPresent){return 0 }
			var id = "OTU-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					x : data.coordinate.x,
					y : data.coordinate.y 
				},
				_eleSet : paper.set(),
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?",
					label : "?"
				}
			}
			if(!!data.label)
			{
				var lbl = data.label;
			}
			else
			{
				var lbl = "?";
			}
			var label = paper.text(data.coordinate.x + 60, data.coordinate.y + 20, lbl);
			var node = paper.image("../assert/img/unlatch.png", data.coordinate.x + 40, data.coordinate.y - 15, 40, 30);
			node.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			ContextMenu(functionObject.classname, id , data);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			node.attr("title", functionObject._value.label);
			functionObject.type = 'contact';
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.currentProgramModel.unlatchCount++;
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "unlatch",
					functionBlock : {


					}
				}
			}, PLCSpace.view.programID);
		},

		RES : function(data) {
			//if(!!data.parentObject.isBlockPresent){return 0 }
		if(!!data.parentObject.isBlockPresent){return 0 }
			var id = "RES-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					x : data.coordinate.x,
					y : data.coordinate.y,
					type : 0 
				},
				_eleSet : paper.set(),
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?",
					label : "?"
				}
			}
			if(!!data.label)
			{
				var lbl = data.label;
			}
			else
			{
				var lbl = "?";
			}
			var label = paper.text(data.coordinate.x + 60, data.coordinate.y + 20, lbl);
			var node = paper.image("../assert/img/reset.png", data.coordinate.x + 40, data.coordinate.y - 15, 40, 30);
			node.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node,label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			//contactContext(functionObject.classname, id,data);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			ContextMenu(functionObject.classname, id , data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			node.attr("title", functionObject._value.label);
			functionObject.type = 'contact';
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "reset",
					functionBlock : {
						
					}
				}
			}, PLCSpace.view.programID);
		},
		
		PID : function(data,obj){
			var id = "PID-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				_value : {
					label : "?",
					input : "?",
					inputval : "?",
					output : "?",
					result : "?"
				}
			}
			if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						input :obj.input,
						result : 0
					}
				}
			var pidSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
						fill : '#C0C0C0',
						'fill-opacity': 1,
						stroke : 'black',
						strokeWidth : 4,
						r : 3
					});
			
			functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 40 , "PID:" + functionObject._value.label).attr({
				fill : 'black',
				"font-size" : 16,
				'font-weight' : 'bold'
			});
			functionObject._body.label = tagNameText;

				var inputText = paper.text(data.coordinate.x + 17, data.coordinate.y - 20, "Input").attr({
					fill : 'black',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.inputText = inputText;
				
				var inputRect = paper.rect(data.coordinate.x + 2, data.coordinate.y - 10  , 45, 15).attr({
					fill : '#DCDCDC',
					stroke : 'black',
					strokeWidth : 0
				});
				functionObject._body.inputBody = inputRect;
				
				var inputvalRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10  , 45, 15).attr({
					fill : '#DCDCDC',
					stroke : 'black',
					strokeWidth : 0
				});
				functionObject._body.inputvalBody = inputvalRect;
				
				var input = paper.text(data.coordinate.x + 25, data.coordinate.y-5  , functionObject._value.input).attr({
					fill : 'black', 
					"font-size" : 10
				});
				functionObject.attr.input = input;
				
				var inputval = paper.text(data.coordinate.x + 65, data.coordinate.y-5  , functionObject._value.inputval).attr({
					fill : 'black', 
					"font-size" : 10
				});
				functionObject.attr.inputval = inputval;
				
				var outputText = paper.text(data.coordinate.x + 17, data.coordinate.y + 15, "Output").attr({
					fill : 'black',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.outputText = outputText;
				
				var outputRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25  , 45, 15).attr({
					fill : '#DCDCDC',
					stroke : 'black',
					strokeWidth : 0
				});
				functionObject._body.outputBody = outputRect;
				
				var outputvalRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25  , 45, 15).attr({
					fill : '#DCDCDC',
					stroke : 'black',
					strokeWidth : 0
				});
				functionObject._body.outputvalBody = outputvalRect;
				
				var output = paper.text(data.coordinate.x + 25, data.coordinate.y + 30  , functionObject._value.output).attr({
					fill : 'black', 
					"font-size" : 10
				});
				functionObject.attr.output = output;
				
				var result = paper.text(data.coordinate.x + 70, data.coordinate.y + 30 , functionObject._value.result).attr({
					fill : 'black', 
					"font-size" : 10
				});
				functionObject.attr.result = result;
				pidSet.push(node, tagNameText,inputText,inputRect,input,inputval,inputvalRect,outputText,result,outputRect,outputvalRect,output);
				data.parentObject._eleSet.push(pidSet);
				
				pidSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id,data);
				data.parentObject.functionBlockObject[id] = functionObject;
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(pidSet)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			functionObject.type = 'FBlock';
			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "pid",
					functionBlock : {

					}
				}
			}, PLCSpace.view.programID);
		},

	
		ADD : function(data,obj){
			var id = "ADD-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {
						tagnameA : "?",
						tagnameB : "?",
						tagnameR : "?",
					},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						labelA : "?",
						labelB : "?",
						labelR : "?",
						valueA : "?",
						valueB : "?",
						valueResult : 0
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						labelA : obj.labelA,
						labelB : obj.labelB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.labelR,
						valueResult : 0
					}
				}
				var arithmeticSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "ADD:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var AText = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "A").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.AText = AText;
				
				var BText = paper.text(data.coordinate.x + 20, data.coordinate.y+13, "B").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.BText = BText;
				
				var ResultText = paper.text(data.coordinate.x + 20, data.coordinate.y+43, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.ResultText = ResultText;
				
				var AdressRectA = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressABody = AdressRectA;
				
				var adressA = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.labelA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelA = adressA;
				
				var AdressRectB = paper.rect(data.coordinate.x + 2, data.coordinate.y+20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressBBody = AdressRectB;
				
				var adressB = paper.text(data.coordinate.x + 20, data.coordinate.y + 27 , functionObject._value.labelB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelB = adressB;
				
				var AdressRectResult = paper.rect(data.coordinate.x + 2, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressResultBody = AdressRectResult;
				
				var adressResult = paper.text(data.coordinate.x + 20, data.coordinate.y + 57 , functionObject._value.labelR).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelR = adressResult;
				
				var valRectA = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueABody = valRectA;
				
				var valueA = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.valueA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueA = valueA;
				
				var valRectB = paper.rect(data.coordinate.x + 50, data.coordinate.y + 20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueBBody = valRectB;
				
				var valueB = paper.text(data.coordinate.x + 70, data.coordinate.y +27 , functionObject._value.valueB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueB = valueB;
				
				var ResultvalRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueResultBody = ResultvalRect;
				
				var valueResult = paper.text(data.coordinate.x + 70, data.coordinate.y + 57 , functionObject._value.valueResult).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueResult = valueResult;
				
				arithmeticSet.push(node, tagNameText, AText, BText, ResultText, AdressRectA, AdressRectB, AdressRectResult, valRectA, valRectB, ResultvalRect, valueResult,valueB ,valueA,adressResult,adressB,adressA);
				data.parentObject._eleSet.push(arithmeticSet);
				
				arithmeticSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "add", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		SUB : function(data,obj){
		var id = "SUB-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {
						tagnameA : "?",
						tagnameB : "?",
						tagnameR : "?",
					},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						labelA : "?",
						labelB : "?",
						labelR : "?",
						valueA : "?",
						valueB : "?",
						valueResult : 0
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						labelA : obj.labelA,
						labelB : obj.labelB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.labelR,
						valueResult : 0
					}
				}
				var arithmeticSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "SUB:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var AText = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "A").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.AText = AText;
				
				var BText = paper.text(data.coordinate.x + 20, data.coordinate.y+13, "B").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.BText = BText;
				
				var ResultText = paper.text(data.coordinate.x + 20, data.coordinate.y+43, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.ResultText = ResultText;
				
				var AdressRectA = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressABody = AdressRectA;
				
				var adressA = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.labelA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelA = adressA;
				
				var AdressRectB = paper.rect(data.coordinate.x + 2, data.coordinate.y+20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressBBody = AdressRectB;
				
				var adressB = paper.text(data.coordinate.x + 20, data.coordinate.y + 27 , functionObject._value.labelB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelB = adressB;
				
				var AdressRectResult = paper.rect(data.coordinate.x + 2, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressResultBody = AdressRectResult;
				
				var adressResult = paper.text(data.coordinate.x + 20, data.coordinate.y + 57 , functionObject._value.labelR).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelR = adressResult;
				
				var valRectA = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueABody = valRectA;
				
				var valueA = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.valueA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueA = valueA;
				
				var valRectB = paper.rect(data.coordinate.x + 50, data.coordinate.y + 20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueBBody = valRectB;
				
				var valueB = paper.text(data.coordinate.x + 70, data.coordinate.y +27 , functionObject._value.valueB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueB = valueB;
				
				var ResultvalRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueResultBody = ResultvalRect;
				
				var valueResult = paper.text(data.coordinate.x + 70, data.coordinate.y + 57 , functionObject._value.valueResult).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueResult = valueResult;
				
				arithmeticSet.push(node, tagNameText, AText, BText, ResultText, AdressRectA, AdressRectB, AdressRectResult, valRectA, valRectB, ResultvalRect,valueResult,valueB ,valueA,adressResult,adressB,adressA);
				data.parentObject._eleSet.push(arithmeticSet);
				
				arithmeticSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "sub", // add sub mul
					functionBlock : {
						sourceA : "?",
						sourceB : "?",
						valueA : -1,
						valueB : -1,
						destination : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},
					}

				}
			}, PLCSpace.view.programID);
		},

		MUL : function(data,obj){
			var id = "MUL-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					tagnameA : "?",
					tagnameB : "?",
					tagnameR : "?",
				},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				_value : {
					label : "?",
					labelA : "?",
					labelB : "?",
						labelR : "?",
					valueA : "?",
					valueB : "?",
					valueResult : 0
				}
			}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						labelA : obj.labelA,
						labelB : obj.labelB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.labelR,
						valueResult : 0
					}
				}
			var arithmeticSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "MUL:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var AText = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "A").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.AText = AText;
				
				var BText = paper.text(data.coordinate.x + 20, data.coordinate.y+13, "B").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.BText = BText;
				
				var ResultText = paper.text(data.coordinate.x + 20, data.coordinate.y+43, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.ResultText = ResultText;
				
				var AdressRectA = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressABody = AdressRectA;
				
				var adressA = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.labelA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelA = adressA;
				
				var AdressRectB = paper.rect(data.coordinate.x + 2, data.coordinate.y+20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressBBody = AdressRectB;
				
				var adressB = paper.text(data.coordinate.x + 20, data.coordinate.y + 27 , functionObject._value.labelB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelB = adressB;
				
				var AdressRectResult = paper.rect(data.coordinate.x + 2, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressResultBody = AdressRectResult;
				
				var adressResult = paper.text(data.coordinate.x + 20, data.coordinate.y + 57 , functionObject._value.labelR).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelR = adressResult;
				
				var valRectA = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueABody = valRectA;
				
				var valueA = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.valueA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueA = valueA;
				
				var valRectB = paper.rect(data.coordinate.x + 50, data.coordinate.y + 20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueBBody = valRectB;
				
				var valueB = paper.text(data.coordinate.x + 70, data.coordinate.y +27 , functionObject._value.valueB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueB = valueB;
				
				var ResultvalRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueResultBody = ResultvalRect;
				
				var valueResult = paper.text(data.coordinate.x + 70, data.coordinate.y + 57 , functionObject._value.valueResult).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueResult = valueResult;
				
				arithmeticSet.push(node, tagNameText, AText, BText, ResultText, AdressRectA, AdressRectB, AdressRectResult, valRectA, valRectB, ResultvalRect,valueResult,valueB ,valueA,adressResult,adressB,adressA);
				data.parentObject._eleSet.push(arithmeticSet);
				
				arithmeticSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "mul", // add sub mul
					functionBlock : {
						sourceA : "?",
						sourceB : "?",
						valueA : -1,
						valueB : -1,
						destination : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},
					}

				}
			}, PLCSpace.view.programID);
		},

		DIV : function(data,obj){
			var id = "DIV-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID; 
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {
						tagnameA : "?",
						tagnameB : "?",
						tagnameR : "?",
					},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						labelA : "?",
						labelB : "?",
						labelR : "?",
						valueA : "?",
						valueB : "?",
						valueResult : 0
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						labelA : obj.labelA,
						labelB : obj.labelB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.labelR,
						valueResult : 0
					}
				}
				var arithmeticSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "DIV:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var AText = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "A").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.AText = AText;
				
				var BText = paper.text(data.coordinate.x + 20, data.coordinate.y+13, "B").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.BText = BText;
				
				var ResultText = paper.text(data.coordinate.x + 20, data.coordinate.y+43, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.ResultText = ResultText;
				
				var AdressRectA = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressABody = AdressRectA;
				
				var adressA = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.labelA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelA = adressA;
				
				var AdressRectB = paper.rect(data.coordinate.x + 2, data.coordinate.y+20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressBBody = AdressRectB;
				
				var adressB = paper.text(data.coordinate.x + 20, data.coordinate.y + 27 , functionObject._value.labelB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelB = adressB;
				
				var AdressRectResult = paper.rect(data.coordinate.x + 2, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.AdressResultBody = AdressRectResult;
				
				var adressResult = paper.text(data.coordinate.x + 20, data.coordinate.y + 57 , functionObject._value.labelR).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.labelR = adressResult;
				
				var valRectA = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueABody = valRectA;
				
				var valueA = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.valueA).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueA = valueA;
				
				var valRectB = paper.rect(data.coordinate.x + 50, data.coordinate.y + 20 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueBBody = valRectB;
				
				var valueB = paper.text(data.coordinate.x + 70, data.coordinate.y +27 , functionObject._value.valueB).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueB = valueB;
				
				var ResultvalRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 50, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.ValueResultBody = ResultvalRect;
				
				var valueResult = paper.text(data.coordinate.x + 70, data.coordinate.y + 57 , functionObject._value.valueResult).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.valueResult = valueResult;
				
				arithmeticSet.push(node,tagNameText, AText, BText, ResultText, AdressRectA, AdressRectB, AdressRectResult, valRectA, valRectB, ResultvalRect,valueResult,valueB ,valueA,adressResult,adressB,adressA);
				data.parentObject._eleSet.push(arithmeticSet);
				
			arithmeticSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "div", // add sub mul
					functionBlock : {
						sourceA : "?",
						sourceB : "?",
						valueA : -1,
						valueB : -1,
						destination : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},
					}

				}
			}, PLCSpace.view.programID);
		},
		
		SRT : function(data,obj){
			var id = "SRT-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID; 
			var paper = PLCSpace.currentProgramModel.paper;
			
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						labelInput : "?",
						labelOutput : "?",
						valueInput : "?",
						valueOutput : 0,
					}
				}
				var SRTSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 31, 119, 106).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 23, "SRT:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var inputText = paper.text(data.coordinate.x + 17, data.coordinate.y - 1, "Input").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.inputText = inputText;
				
				var inputlblRect = paper.rect(data.coordinate.x + 3, data.coordinate.y+9 , 51, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.inputlblRect = inputlblRect;
				
				var inputlblText = paper.text(data.coordinate.x + 25, data.coordinate.y+17,functionObject._value.labelInput).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.inputlblText = inputlblText;
				
				var inputValueRect = paper.rect(data.coordinate.x + 62, data.coordinate.y+9 , 51, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.inputValueRect = inputValueRect;
				
				var inputValueText = paper.text(data.coordinate.x + 83, data.coordinate.y+17,functionObject._value.valueInput).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.inputValueText = inputValueText;
				
				var outText = paper.text(data.coordinate.x + 17, data.coordinate.y + 34, "Output").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.outText = outText;
				
				var outputlblRect = paper.rect(data.coordinate.x + 3, data.coordinate.y+43 , 51, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.outputlblRect = outputlblRect;
				
				var outputlblText = paper.text(data.coordinate.x + 25, data.coordinate.y+50,functionObject._value.labelOutput).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.outputlblText = outputlblText;
				
				var outputValueRect = paper.rect(data.coordinate.x + 62, data.coordinate.y+43 , 51, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.outputValueRect = outputValueRect;
				
			   var outputValueText = paper.text(data.coordinate.x + 83, data.coordinate.y+50,functionObject._value.valueOutput).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.outputValueText = outputValueText;
				
				SRTSet.push(node,tagNameText,inputText,inputlblRect,inputlblText,inputValueRect,inputValueText,outText,outputlblRect,outputlblText,outputValueRect,outputValueText);
				data.parentObject._eleSet.push(SRTSet);
				
				SRTSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(SRTSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
     			
     			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "srt", // add sub mul
					functionBlock : {
						input: "?",
						valueA : -1,
						output : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},
					}

				}
			}, PLCSpace.view.programID);
				
		},
		
		SCL : function(data,obj){
			var id = "SCL-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID; 
			var paper = PLCSpace.currentProgramModel.paper;
			
			var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						labelLI : "?",
						labelHI : "?",
						labelLO : "?",
						labelHO : "?",
						labelTI : "?",
						labelRes : "?",
						valueLI : "?",
						valueHI : "?",
						valueLO : "?",
						valueHO : "?",
						valueTI : "?",
						valueRes : 0
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						labelLI : obj.labelLI,
						labelHI : obj.labelHI,
						labelLO : obj.labelLO,
						labelHO : obj.labelHO,
						labelTI : obj.labelTI,
						labelRES : obj.labelRES,
						valueLI : obj.valueLI,
						valueHI : obj.valueHI,
						valueLO : obj.valueLO,
						valueHO : obj.valueHO,
						valueTI : obj.valueHO,
						valueRes : 0
					}
				}
				
			var SCLSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 33, 119, 131).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 25, "SCL:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var LIext = paper.text(data.coordinate.x + 5, data.coordinate.y - 8, "LI").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.LIext = LIext;
				
				var LI_lblRect = paper.rect(data.coordinate.x + 18, data.coordinate.y-14 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.LI_lblRect = LI_lblRect;
				
				var LI_lblText = paper.text(data.coordinate.x + 36, data.coordinate.y-5,functionObject._value.labelLI).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.labelLI = LI_lblText;
				
				var LI_valueRect = paper.rect(data.coordinate.x + 68, data.coordinate.y-14 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.LI_valueRect = LI_valueRect;
				
				var LI_valueText = paper.text(data.coordinate.x + 89, data.coordinate.y-5,functionObject._value.valueLI).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.valueLI = LI_valueText;////1
				
				var HIText = paper.text(data.coordinate.x + 6, data.coordinate.y + 14, "HI").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.HIText = HIText;
				
				var HI_lblRect = paper.rect(data.coordinate.x + 18, data.coordinate.y+5 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.HI_lblRect = HI_lblRect;
				
				var HI_lblText = paper.text(data.coordinate.x + 36, data.coordinate.y+15,functionObject._value.labelHI).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.labelHI = HI_lblText;
				var HI_valueRect = paper.rect(data.coordinate.x + 68, data.coordinate.y+5 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.HI_valueRect = HI_valueRect;
				var HI_valueText = paper.text(data.coordinate.x + 89, data.coordinate.y+15,functionObject._value.valueHI).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.valueHI = HI_valueText;////2
				
				var LOText = paper.text(data.coordinate.x + 7, data.coordinate.y + 36, "LO").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.LOText = LOText;
				
				var LO_lblRect = paper.rect(data.coordinate.x + 18, data.coordinate.y+24 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.LO_lblRect = LO_lblRect;
				var LO_lblText = paper.text(data.coordinate.x + 36, data.coordinate.y+35,functionObject._value.labelLO).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.labelLO = LO_lblText;
				var LO_valueRect = paper.rect(data.coordinate.x + 68, data.coordinate.y+24 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.LO_valueRect = LO_valueRect;
				var LO_valueText = paper.text(data.coordinate.x + 89, data.coordinate.y+35,functionObject._value.valueLO).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.valueLO = LO_valueText;////3
				
				var HOText = paper.text(data.coordinate.x + 7, data.coordinate.y + 56, "HO").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.HOText = HOText;
				
				var HO_lblRect = paper.rect(data.coordinate.x + 18, data.coordinate.y+43 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.HO_lblRect = HO_lblRect;
				var HO_lblText = paper.text(data.coordinate.x + 36, data.coordinate.y+55,functionObject._value.labelHO).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.labelHO = HO_lblText;
				var HO_valueRect = paper.rect(data.coordinate.x + 68, data.coordinate.y+43 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.HO_valueRect = HO_valueRect;
				var HO_valueText = paper.text(data.coordinate.x + 89, data.coordinate.y+55,functionObject._value.valueHO).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.valueHO = HO_valueText;////4
				
				var TIText = paper.text(data.coordinate.x + 7, data.coordinate.y + 76, "TI").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.TIText = TIText;
				
				var TI_lblRect = paper.rect(data.coordinate.x + 18, data.coordinate.y+63 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.TI_lblRect = TI_lblRect;
				var TI_lblText = paper.text(data.coordinate.x + 36, data.coordinate.y+73,functionObject._value.labelTI).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.labelTI = TI_lblText;
				var TI_valueRect = paper.rect(data.coordinate.x + 68, data.coordinate.y+63 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.TI_valueRect = TI_valueRect;
				var TI_valueText = paper.text(data.coordinate.x + 89, data.coordinate.y+73,functionObject._value.valueTI).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.valueTI = TI_valueText;////5
				var ResText = paper.text(data.coordinate.x + 7, data.coordinate.y + 91, "Res").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.ResText = ResText;
				
				var Res_lblRect = paper.rect(data.coordinate.x + 18, data.coordinate.y+82 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.Res_lblRect = Res_lblRect;
				var Res_lblText = paper.text(data.coordinate.x + 36, data.coordinate.y+92,functionObject._value.labelRes).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.labelRes = Res_lblText;
				var Res_valueRect = paper.rect(data.coordinate.x + 68, data.coordinate.y+82 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.Res_valueRect = Res_valueRect;
				var Res_valueText = paper.text(data.coordinate.x + 89, data.coordinate.y+92,functionObject._value.valueRes).attr({
					fill : '#ff0000',
					"font-size" : 12,
					
				});
				functionObject.attr.valueRes = Res_valueText;////6
				
				SCLSet.push(node,tagNameText,LIext,LI_lblRect,LI_lblText,LI_valueRect,LI_valueText,HIText,HI_lblRect,HI_lblText,HI_valueRect,HI_valueText,LOText,LO_lblRect,LO_lblText,LO_valueRect,LO_valueText,HOText,HO_lblRect,HO_lblText,HO_valueRect,HO_valueText,TIText,TI_lblRect,TI_lblText,TI_valueRect,TI_valueText,ResText,Res_lblRect,Res_lblText,Res_valueRect,Res_valueText);
				data.parentObject._eleSet.push(SCLSet);
				
				SCLSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
             
             	node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(SCLSet);
				
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			
     			if(!!obj){functionObject.f = obj;}
     			
     			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "scl", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		TON : function(data,obj) {
			var id = "TON-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
				var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						tagname : "?",
						preset : "?",
						acc : "?"
					}
				}

				if(!!obj)
				{
					functionObject._value = {
						label : obj.tagName,
						tagname : obj.tagName,
						preset : obj.preset,
						acc : obj.acc
					}
				}
				var timerSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				
				var labelText = paper.text(data.coordinate.x + 45, data.coordinate.y - 37, "TON:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = labelText;

				var presetRect = paper.rect(data.coordinate.x + 45, data.coordinate.y - 20, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.presetBody = presetRect;

				var presetText = paper.text(data.coordinate.x + 20, data.coordinate.y - 10, "Preset").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.presetText = presetText;

				var accRect = paper.rect(data.coordinate.x + 45, data.coordinate.y + 10, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.accRectBody = accRect;

				var accText = paper.text(data.coordinate.x + 20, data.coordinate.y + 18, "Accum\nulator").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.accText = accText;
	
				var preset = paper.text(data.coordinate.x + 60, data.coordinate.y - 12, functionObject._value.preset).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, 0).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.acc = acc
	
				var fOutText = paper.text(data.coordinate.x + 10, data.coordinate.y + 45, functionObject._value.tagname + "_en").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 50, data.coordinate.y + 45, functionObject._value.tagname + "_dn").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
	
				var tOutText = paper.text(data.coordinate.x + 85, data.coordinate.y + 45, functionObject._value.tagname + "_tt").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.tOutText = tOutText;
	
				var fOut = paper.image("../assert/img/output.png",data.coordinate.x + 3, data.coordinate.y + 55, 20, 20);
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("../assert/img/output.png",data.coordinate.x + 40, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
	
				var tOut = paper.image("../assert/img/output.png",data.coordinate.x + 77, data.coordinate.y + 55, 20, 20)
				functionObject._body.tOut = tOut;
				
				timerSet.push(node,  labelText , presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, tOutText, fOut, sOut, tOut);
				data.parentObject._eleSet.push(timerSet);
	
				timerSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(timerSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "timeron", // retentivetimeron // tomeroff
					functionBlock : {}
				}
			}, PLCSpace.view.programID);

		},
		TOF : function(data,obj) {
		var id = "TOF-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						tagname : "?",
						preset : "?",
						acc : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.tagName,
						tagname : obj.tagName,
						preset : obj.preset,
						acc : obj.acc
					}
				}
				var timerSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;

				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "TOF:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				var presetRect = paper.rect(data.coordinate.x + 45, data.coordinate.y - 20, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.presetBody = presetRect;

				var presetText = paper.text(data.coordinate.x + 20, data.coordinate.y - 10, "Preset").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.presetText = presetText;

				var accRect = paper.rect(data.coordinate.x + 45, data.coordinate.y + 10, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.accRectBody = accRect;

				var accText = paper.text(data.coordinate.x + 20, data.coordinate.y + 18, "Accum\nulator").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.accText = accText;
	
				var preset = paper.text(data.coordinate.x + 60, data.coordinate.y - 12, functionObject._value.preset).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, 0).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.acc = acc
	
				var fOutText = paper.text(data.coordinate.x + 10, data.coordinate.y + 45, functionObject._value.tagname + "_en").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 50, data.coordinate.y + 45, functionObject._value.tagname + "_dn").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
	
				var tOutText = paper.text(data.coordinate.x + 85, data.coordinate.y + 45, functionObject._value.tagname + "_tt").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.tOutText = tOutText;
	
				var fOut = paper.image("../assert/img/output.png",data.coordinate.x + 3, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("../assert/img/output.png",data.coordinate.x + 40, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
	
				var tOut = paper.image("../assert/img/output.png",data.coordinate.x + 77, data.coordinate.y + 55, 20, 20)
				functionObject._body.tOut = tOut;
				
				timerSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, tOutText, fOut, sOut, tOut);
				data.parentObject._eleSet.push(timerSet);
	
				timerSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(timerSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "timeroff", // retentivetimeron // tomeroff
					functionBlock : {}
				}
			}, PLCSpace.view.programID);
		},
		CTU : function(data,obj){
			var id = "CTU-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						tagname : "?",
						preset : "?",
						acc : 0
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						tagname : obj.label,
						preset : obj.preset,
						acc : 0
					}
				}
				var counterSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "CTU:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;

				var presetRect = paper.rect(data.coordinate.x + 45, data.coordinate.y - 20, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.presetBody = presetRect;
				var presetText = paper.text(data.coordinate.x + 20, data.coordinate.y - 10, "Preset").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.presetText = presetText;
				var accRect = paper.rect(data.coordinate.x + 45, data.coordinate.y + 10, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.accRectBody = accRect;

				var accText = paper.text(data.coordinate.x + 20, data.coordinate.y + 18, "Accum\nulator").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.accText = accText;
				var preset = paper.text(data.coordinate.x + 60, data.coordinate.y - 12, functionObject._value.preset).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, functionObject._value.acc).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.acc = acc;
				
				var fOutText = paper.text(data.coordinate.x + 25, data.coordinate.y + 45, functionObject._value.tagname + "_cu").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 65, data.coordinate.y + 45, functionObject._value.tagname + "_dn").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
				var fOut = paper.image("../assert/img/output.png",data.coordinate.x + 17, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("../assert/img/output.png",data.coordinate.x + 55, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
				
				counterSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, fOut, sOut);
				data.parentObject._eleSet.push(counterSet);
				//counterSet.attr("title", functionObject._value.tagname);
				counterSet.click(function () {
					PLCSpace.currentProgramModel.deleteOption = "block";
	        		PLCSpace.currentProgramModel.elementTodelete = data;
					PLCSpace.currentProgramModel.elementTodelete.id = id;
	             })
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(counterSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "countup",// countup
					functionBlock : {}
				}
			}, PLCSpace.view.programID);
		},
		CTD : function(data,obj){
				var id = "CTD-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						preset : "?",
						acc : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						tagname : obj.label,
						preset : obj.preset,
						acc : 0
					}
				}
				var counterSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "CTD:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;

				var presetRect = paper.rect(data.coordinate.x + 45, data.coordinate.y - 20, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.presetBody = presetRect;
				var presetText = paper.text(data.coordinate.x + 20, data.coordinate.y - 10, "Preset").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.presetText = presetText;
				var accRect = paper.rect(data.coordinate.x + 45, data.coordinate.y + 10, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.accRectBody = accRect;

				var accText = paper.text(data.coordinate.x + 20, data.coordinate.y + 18, "Accum\nulator").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.accText = accText;
				var preset = paper.text(data.coordinate.x + 60, data.coordinate.y - 12, functionObject._value.preset).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, functionObject._value.acc).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.acc = acc;
				
				var fOutText = paper.text(data.coordinate.x + 25, data.coordinate.y + 45, functionObject._value.label + "_cd").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 65, data.coordinate.y + 45, functionObject._value.label + "_dn").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
				var fOut = paper.image("../assert/img/output.png",data.coordinate.x + 17, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("../assert/img/output.png",data.coordinate.x + 55, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
				
				counterSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, fOut, sOut);
				data.parentObject._eleSet.push(counterSet);
				//counterSet.attr("title", functionObject._value.label);
				counterSet.click(function () {
					PLCSpace.currentProgramModel.deleteOption = "block";
	        		PLCSpace.currentProgramModel.elementTodelete = data;
					PLCSpace.currentProgramModel.elementTodelete.id = id;
	             })
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(counterSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "countdown",// countup
					functionBlock : {

						"tagName" : "?",
						"preset" : -1,
						acc : 0,
						"CU" : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},
						"DN" : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},

					}
				}
			}, PLCSpace.view.programID);
		},
		LIM : function(data,obj){
			var id = "LIM-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				    _parentObject : data.parentObject,
					_value : {
						label : "?",
						LLAdress : "?",
						TestAdress : "?",
						HLAdress : "?",
						LLValue : "?",
						TestValue : "?",
						HLValue : "?"
						
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						LLAdress : obj.LLlabel,
						TestAdress : obj.TestLabel,
						HLAdress : obj.HLLabel,
						LLValue : obj.LLValue,
						TestValue : obj.TestValue,
						HLValue : obj.HLValue
					}
				}
				var limitSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 130).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "LIMIT:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var LLText = paper.text(data.coordinate.x + 25, data.coordinate.y - 17, "Low Limit").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.LLText = LLText;
				
				var LLAdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.LLAdressBody = LLAdressRect;
				
				var LLValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.LLVlaueBody = LLValueRect;
				
				var LLAdress = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.LLAdress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.lowLevelLabel = LLAdress;
				
				var LLValue = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.LLValue).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.lowLevelValue = LLValue;
				
				var TestText = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "Test").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.TestText = TestText;
				
				var TestAdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.TestAdressBody = TestAdressRect;
				
				var TestValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.TestVlaueBody = TestValueRect;
				
				var TestAdress = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.TestAdress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.TestLabel = TestAdress;
				
				var TestValue = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.TestValue).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.TestValue = TestValue;
				
				var HLText = paper.text(data.coordinate.x + 25, data.coordinate.y + 50, "High Limit").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.HLText = HLText;
				
				var HLAdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 57 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.HLAdressBody = HLAdressRect;
				
				var HLValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 57, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.HLVlaueBody = HLValueRect;
				
				var HLAdress = paper.text(data.coordinate.x + 20, data.coordinate.y + 65 , functionObject._value.HLAdress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.highLevelLabel = HLAdress;
				
				var HLvalue = paper.text(data.coordinate.x + 70, data.coordinate.y + 65 , functionObject._value.HLValue).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.highLevelValue = HLvalue;
				
				
				limitSet.push(node, tagNameText,LLText,LLAdressRect,LLValueRect,LLAdress,LLValue,TestText,TestAdressRect,TestValueRect,TestAdress,TestValue,HLText,HLAdressRect,HLValueRect,HLAdress,HLvalue);
				data.parentObject._eleSet.push(limitSet);
				
				limitSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(limitSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "lim", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},LEQ : function(data,obj){
			var id = "LEQ-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						source1Adress : "?",
						source2Adress : "?",
						source1Value : "?",
						source2Value : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : obj.SrcBValue
					}
				}
				var leqSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "LEQ:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				leqSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(leqSet);
				
				leqSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				data.parentObject.functionBlockObject[id] = functionObject;
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(leqSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "leq", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},

		GEQ : function(data,obj){
			var id = "GEQ-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						source1Adress : "?",
						source2Adress : "?",
						source1Value : "?",
						source2Value : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : obj.SrcBValue
					}
				}
				var geqSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "GEQ:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				geqSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(geqSet);
				
				geqSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				
				data.parentObject.functionBlockObject[id] = functionObject;
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(geqSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			ContextMenu(classname, id , data );
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "geq", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},

		LES : function(data,obj){
			var id = "LES-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						source1Adress : "?",
						source2Adress : "?",
						source1Value : "?",
						source2Value : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : obj.SrcBValue
					}
				}
				var lesSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "LES:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				lesSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(lesSet);
				
				lesSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				
				data.parentObject.functionBlockObject[id] = functionObject;
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lesSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "les", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},

		GRT : function(data,obj){
			var id = "GRT-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						source1Adress : "?",
						source2Adress : "?",
						source1Value : "?",
						source2Value : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : obj.SrcBValue
					}
				}
				var grtSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "GRT:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				grtSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(grtSet);
				
				grtSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				data.parentObject.functionBlockObject[id] = functionObject;
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(grtSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "grt", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		NEQ : function(data,obj){
			var id = "NEQ-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						source1Adress : "?",
						source2Adress : "?",
						source1Value : "?",
						source2Value : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : obj.SrcBValue
					}
				}
				var neqSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "NEQ:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				neqSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(neqSet);
				
				neqSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				
				data.parentObject.functionBlockObject[id] = functionObject;
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(neqSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "neq", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		EQU : function(data,obj){
			var id = "EQU-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						source1Adress : "?",
						source2Adress : "?",
						source1Value : "?",
						source2Value : "?",
						outputAdress : "?"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : obj.SrcBValue
					}
				}
				var equSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "EQU:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				equSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(equSet);
				
				equSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				data.parentObject.ipblock = functionObject._id;
				if(!!data.parentObject.opblock){
					functionObject._value.outputAdress = data.parentObject.functionBlockObject[data.parentObject.opblock]._value.label;
				}
				data.parentObject.functionBlockObject[id] = functionObject;
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(equSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
				PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "equ", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		CPT : function(data,obj){
			var id = "CPT-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					tagname : "?"
				},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						expression : "?",
						destination : "?",
						result : 0,
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						expression :obj.expression,
						destination : obj.destination,
						result : 0
					}
				}
				var cptSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "CPT:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var expressionText = paper.text(data.coordinate.x + 30, data.coordinate.y - 17, "Expression").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.expressionText = expressionText;
				
				var expressionRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.expressionBody = expressionRect;
				
				var expression = paper.text(data.coordinate.x + 40, data.coordinate.y - 2 , functionObject._value.expression).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.expression = expression;
				
				var desinationText = paper.text(data.coordinate.x + 30, data.coordinate.y + 15, "Destination").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.desinationText = desinationText;
				
				var destinationRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 20 , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.destinationBody = destinationRect;
				
				var destination = paper.text(data.coordinate.x + 40, data.coordinate.y + 30 , functionObject._value.destination).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.destination = destination;
				
				var resultText = paper.text(data.coordinate.x + 15, data.coordinate.y + 45, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.resultText = resultText;
				
				var resultRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 50 , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.resultBody = resultRect;
				
				var result = paper.text(data.coordinate.x + 40, data.coordinate.y + 60 , functionObject._value.result).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.result = result;
				
				
				cptSet.push(node, tagNameText,expressionText,expressionRect,expression,desinationText,destinationRect,destination,resultText,resultRect,result);
				data.parentObject._eleSet.push(cptSet);
				
				cptSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(cptSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "compute",
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		MOV : function(data,obj){
			var id = "MOV-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				_value : {
					label : "?",
					source1Adress : "?",
					source2Adress : "?",
					source1Value : "?",
					source2Value : "?"
				}
			}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						source1Adress : obj.SrcALabel,
						source2Adress : obj.SrcBLabel,
						source1Value : obj.SrcAValue,
						source2Value : "?"
					}
				}
				var lesSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "MOV:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var source1Text = paper.text(data.coordinate.x + 20, data.coordinate.y - 17, "SourceA").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source1Text = source1Text;
				
				var source1AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1AdressBody = source1AdressRect;
				
				var source1ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y - 10, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source1VlaueBody = source1ValueRect;
				
				var adress1 = paper.text(data.coordinate.x + 20, data.coordinate.y - 2 , functionObject._value.source1Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label1 = adress1;
				
				var value1 = paper.text(data.coordinate.x + 70, data.coordinate.y - 2 , functionObject._value.source1Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value1 = value1;
				
				var source2Text = paper.text(data.coordinate.x + 20, data.coordinate.y + 15, "SourceB").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.source2Text = source2Text;
				
				var source2AdressRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 25 , 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2AdressBody = source2AdressRect;
				
				var source2ValueRect = paper.rect(data.coordinate.x + 50, data.coordinate.y + 25, 48, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.source2VlaueBody = source2ValueRect;
				
				var adress2 = paper.text(data.coordinate.x + 20, data.coordinate.y + 35 , functionObject._value.source2Adress).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.label2 = adress2;
				
				var value2 = paper.text(data.coordinate.x + 70, data.coordinate.y + 35 , functionObject._value.source2Value).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.value2 = value2;
				
				
				lesSet.push(node, tagNameText,source1Text,source1AdressRect,source1ValueRect,adress1,value1,source2Text,source2AdressRect,source2ValueRect,adress2,value2 );
				data.parentObject._eleSet.push(lesSet);
				
				lesSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lesSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "move", // add sub mul
					functionBlock : {
						dest : {
							"type" : "output",
							"tagName" : "?",
							"status" : 0.0
						},
						srcAddress : "?",
						srcValue : -1,
					}

				}
			}, PLCSpace.view.programID);
		},
		TOT : function(data,obj){
			var id = "TOT-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			
			var functionObject = {
					_id : id,
					_body : {},
					attr : {
						tagname : "?"
					},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						labelInput : "?",
						valueInput : "?",
						timebase:"SEC",
						labelOutput : "?",
						valueOuput : "?"
					}
				}
				
				var totSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 33, 119, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				
				var tagNameText = paper.text(data.coordinate.x + 59, data.coordinate.y - 23, "TOT:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var inputText = paper.text(data.coordinate.x + 16, data.coordinate.y , "Input").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.inputText = inputText;
				
				var inputRect = paper.rect(data.coordinate.x + 41, data.coordinate.y-6 , 37, 16).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.inputRect = inputRect;///
				
				var inputlabelText = paper.text(data.coordinate.x + 57, data.coordinate.y+1 , functionObject._value.labelInput).attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject.attr.inputlabelText = inputlabelText;
				
				var inputValueRect = paper.rect(data.coordinate.x + 80, data.coordinate.y-6 , 37, 16).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.inputValueRect = inputValueRect;
				
				var inputValueText = paper.text(data.coordinate.x + 97, data.coordinate.y+1 , functionObject._value.valueInput).attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject.attr.inputValueText = inputValueText;
				
				var gainText = paper.text(data.coordinate.x + 26, data.coordinate.y+20,"Gain = 1").attr({
					fill : '#ff0000',
					"font-size" : 12,
					'font-weight' : 'bold'
				});
				functionObject._body.gainText = gainText;
				
				var timebaseText = paper.text(data.coordinate.x + 22, data.coordinate.y+43,"Timebase").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.timebaseText = timebaseText;
				
				var TBRect = paper.rect(data.coordinate.x + 51, data.coordinate.y+36 , 65, 16).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.TBRect = TBRect;
				
				var TBValueText = paper.text(data.coordinate.x + 78, data.coordinate.y+45 , functionObject._value.timebase).attr({
					fill : '#ff0000',
					"font-size" : 11,
					'font-weight' : 'bold'
				});
				functionObject.attr.TBValueText = TBValueText;
				
				var outputText = paper.text(data.coordinate.x + 18, data.coordinate.y+64,"Output").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.outputText = outputText;
				
				var outputRect = paper.rect(data.coordinate.x + 3, data.coordinate.y+73 , 37, 16).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.outputRect = outputRect;
				
				var outputLabelText = paper.text(data.coordinate.x + 19, data.coordinate.y+81 , functionObject._value.labelOutput).attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject.attr.outputLabelText = outputLabelText;
				
				var outputValueText = paper.text(data.coordinate.x + 76, data.coordinate.y+80 , functionObject._value.valueOuput).attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject.attr.outputValueText = outputValueText;
				
				var outputValueRect = paper.rect(data.coordinate.x + 42, data.coordinate.y+73 , 74, 16).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.outputValueRect = outputValueRect;
				
				totSet.push(node,tagNameText,inputText,inputRect,gainText,timebaseText,TBRect,outputText,outputRect,inputValueText,TBValueText,outputValueText,inputlabelText,outputLabelText,outputValueRect,inputValueRect);
				data.parentObject._eleSet.push(totSet);
				
				totSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
             
            
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id, data );
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(totSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';	
     			if(!!obj){functionObject.f = obj}
     			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "totalizer", // add sub mul
					functionBlock : {
						input : "?",// grt(cpt,add) to refer any tga it
						// should not have tagname as t1 t2
						timebase : "?",
						output : "?"
					}

				}
			}, PLCSpace.view.programID);
		},
		LGC : function(data,obj){
			var id = "LGC-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
					_id : id,
					_body : {},
					attr : {
						tagname : "?"
					},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						expression : "?",
						op1:"?",
						op2:"?",
						result : "",
						operation:"none"
					}
				}
				
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						expression : obj.expression,
						result : obj.result
					}
				}
				var lgcSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 33, 119, 70).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 59, data.coordinate.y - 23, "LGC:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				var expressionText = paper.text(data.coordinate.x + 30, data.coordinate.y - 5, "Expression").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.expressionText = expressionText;
				
				var expressionRect = paper.rect(data.coordinate.x + 2, data.coordinate.y+5 , 90, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.expressionBody = expressionRect;
				data.parentObject._eleSet.push(lgcSet);
				
				var expression = paper.text(data.coordinate.x + 40, data.coordinate.y+15  , functionObject._value.expression).attr({
					fill : '#ff0000', 
					"font-size" : 15
				});
				functionObject.attr.expression = expression;
				
				lgcSet.push(node, tagNameText, expressionText, expressionRect, expression);
				lgcSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
             
             	node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id, data );
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lgcSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
     			PLCSpace.currentProgramModel.undoStack.push(functionObject);
     			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "compare", // add sub mul
					functionBlock : {
						expression : "?",// grt(cpt,add) to refer any tga it
						// should not have tagname as t1 t2
						result : 0.0,
						outputAddress : "?"
					}

				}
			}, PLCSpace.view.programID);
		},
		
		CMP : function(data,obj){
			var id = "CMP-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {
						tagname : "?"
					},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						expression : "?",
						op1:"?",
						op2:"?",
						result : "",
						operation:"none"
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						expression : obj.expression,
						result : obj.result
					}
				}
				var cmpSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 33, 100, 70).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 23, "CMP:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var expressionText = paper.text(data.coordinate.x + 30, data.coordinate.y - 5, "Expression").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.expressionText = expressionText;
				
				var expressionRect = paper.rect(data.coordinate.x + 2, data.coordinate.y+5 , 90, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.expressionBody = expressionRect;
				
				var expression = paper.text(data.coordinate.x + 40, data.coordinate.y+15  , functionObject._value.expression).attr({
					fill : '#ff0000', 
					"font-size" : 15
				});
				functionObject.attr.expression = expression;
				
				
				cmpSet.push(node, tagNameText, expressionText, expressionRect, expression);
				data.parentObject._eleSet.push(cmpSet);
				
				
				cmpSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id, data );
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(cmpSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
     			PLCSpace.currentProgramModel.undoStack.push(functionObject);
     			PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "compare", // add sub mul
					functionBlock : {
						expression : "?",// grt(cpt,add) to refer any tga it
						// should not have tagname as t1 t2
						result : 0.0,
						outputAddress : "?"
					}

				}
			}, PLCSpace.view.programID);

		},
		
		JMP : function(data,obj){
			var id = "JMP-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						inputParameter : "?",
						
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						
					}
				}
				var paper = PLCSpace.currentProgramModel.paper;
				var jmpSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 20, 100, 40).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y , "JMP:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				jmpSet.push(node, tagNameText);
				data.parentObject._eleSet.push(jmpSet);
				
				jmpSet.attr("title", functionObject._value.label);
				jmpSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(jmpSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
     			PLCSpace.dataStore.InsertElement({
     				id : id,
                    type : "function",
                    attr : {
                        type : "jump",
                         functionBlock : {           
                         "labelName" : "?"
                        }
                    }
                },PLCSpace.view.programID );
		},
		LBL : function(data,obj){
			
			var id = "LBL-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			data.parentObject.isLabelPresent = true;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						inputParameter : "?",
						
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.label,
						
					}
				}
				var lblSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 20, 100, 40).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y , "LBL:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				lblSet.push(node, tagNameText);
				data.parentObject._eleSet.push(lblSet);
				
				lblSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lblSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:0,
					label : null
			}
     			PLCSpace.dataStore.InsertElement({
     				id : id,
                    rungid : 1,
                    type : "function",
                    attr : {
                        type : "label",
                         functionBlock : {           
                         "labelName" : "?",
                         "rungAddress" : data.id,
                        }
                    }
                },PLCSpace.view.programID );
				
		},
		SBR : function(data,obj){
			/*
			if(PLCSpace.currentProgramModel._id == 'tabhead1'){
							data.parentObject.isBlockPresent = false;
							data.parentObject.blockFlag = false;
							alert("sbr not allowed here")
							return 0;
						}*/
			
			var id = "SBR-" + data.id + "-" + data.blockOnRung + "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				_value : {
					label : "?",
					inputParameter : "?",
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						
						label : obj.label,
						inputParameter : obj.inputParameter
					}
				}
				var sbrSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "SBR:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var inputParameterText = paper.text(data.coordinate.x + 40, data.coordinate.y - 10, "Input Parameter").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.inputParameterText = inputParameterText;
				
				var inputParameterRect = paper.rect(data.coordinate.x + 2, data.coordinate.y  , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.inputParameterBody = inputParameterRect;
				
				var inputParameter = paper.text(data.coordinate.x + 30, data.coordinate.y + 7 , functionObject._value.inputParameter).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.inputParameter = inputParameter;
				
				sbrSet.push(node, tagNameText,inputParameterText,inputParameterRect,inputParameter);
				data.parentObject._eleSet.push(sbrSet);
				
				sbrSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(sbrSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
				functionObject.type = 'FBlock';
				if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
     			PLCSpace.dataStore.InsertElement({
     				id : id,
                type : "function",
                attr : {
                    type : "sbr",
                     functionBlock : {
                         tagName : "?",
                         input : ["?","?"],
                        
                     }
                }
            },PLCSpace.view.programID );
		},
		RET : function(data,obj){
			var id = "RET-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				_value : {
					label : "?",
					returnParameter : "?",
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						
						label : obj.label,
						returnParameter : obj.returnParameter
					}
				}
				var retSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "RET:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;
				
				var returnParameterText = paper.text(data.coordinate.x + 45, data.coordinate.y - 10, "Return Parameter").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.returnParameterText = returnParameterText;
				
				var returnParameterRect = paper.rect(data.coordinate.x + 2, data.coordinate.y  , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.returnParameterBody = returnParameterRect;
				
				var returnParameter = paper.text(data.coordinate.x + 30, data.coordinate.y + 7 , functionObject._value.returnParameter).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.returnParameter = returnParameter;
				
				retSet.push(node, tagNameText,returnParameterText,returnParameterRect,returnParameter);
				data.parentObject._eleSet.push(retSet);
				
				retSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(retSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
				PLCSpace.currentProgramModel.undoStack.push(functionObject);
				PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
				}
     			PLCSpace.dataStore.InsertElement({
     				id : id,
                type : "function",
                attr : {
                    type : "ret",
                     functionBlock : {
                         output : "?"
                     }
                    
                }
            },PLCSpace.view.programID );
		},
		
		JSR : function(data,obj){
			var id = "JSR-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
			var paper = PLCSpace.currentProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				classname : "",
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				_value : {
					label : "?",
					routine : "?",
					inputParameter : "?",
					returnParameter : "?",
				}
			}
				if(!!obj)
				{
					functionObject._value = {
						
						label : obj.label,
						routine : obj.Subroutine,
						inputParameter : obj.inputParameter,
						returnParameter : obj.returnParameter,
						
					}
				}
			var jsrSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
				fill : 'white',
				stroke : 'blue',
				strokeWidth : 0,
				r : 1
			});
			functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "JSR:" + functionObject._value.label).attr({
				fill : '#ff0000',
				"font-size" : 16,
				'font-weight' : 'bold'
			});
			functionObject._body.label = tagNameText;

				var routineText = paper.text(data.coordinate.x + 30, data.coordinate.y - 17, "Routine").attr({
				fill : '#ff0000',
				"font-size" : 10,
				'font-weight' : 'bold'
			});
			functionObject._body.routineText = routineText;

				var routineRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 80, 15).attr({
				stroke : 'blue',
				strokeWidth : 0
			});
			functionObject._body.routineBody = routineRect;

				var routine = paper.text(data.coordinate.x + 40, data.coordinate.y - 2 , functionObject._value.routine).attr({
						fill : '#ff0000',
						"font-size" : 10
					});
			functionObject.attr.subroutine = routine;

				var inputParameterText = paper.text(data.coordinate.x + 40, data.coordinate.y + 15, "Input Parameter").attr({
				fill : '#ff0000',
				"font-size" : 10,
				'font-weight' : 'bold'
			});
			functionObject._body.inputParameterText = inputParameterText;

				var inputParameterRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 20 , 80, 15).attr({
				stroke : 'blue',
				strokeWidth : 0
			});
			functionObject._body.inputParameterBody = inputParameterRect;

				var inputParameter = paper.text(data.coordinate.x + 40, data.coordinate.y + 30 , functionObject._value.inputParameter).attr({
				fill : '#ff0000',
				"font-size" : 10
			});
			functionObject.attr.inputParameter = inputParameter;

				var returnParameterText = paper.text(data.coordinate.x + 45, data.coordinate.y + 45, "Return Parameter").attr({
				fill : '#ff0000',
				"font-size" : 10,
				'font-weight' : 'bold'
			});
			functionObject._body.returnParameterText = returnParameterText;

				var returnParameterRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 50 , 80, 15).attr({
				stroke : 'blue',
				strokeWidth : 0
			});
			functionObject._body.returnParameterBody = returnParameterRect;

				var returnParameter = paper.text(data.coordinate.x + 40, data.coordinate.y + 60 , functionObject._value.returnParameter).attr({
				fill : '#ff0000',
				"font-size" : 10
			});
			functionObject.attr.returnParameter = returnParameter;

				
				jsrSet.push(node, tagNameText,routineText,routineRect,routine,inputParameterText,inputParameterRect,inputParameter,returnParameterText,returnParameterRect,returnParameter);
				data.parentObject._eleSet.push(jsrSet);

				jsrSet.click(function () {
				PLCSpace.currentProgramModel.deleteOption = "block";
        		PLCSpace.currentProgramModel.elementTodelete = data;
				PLCSpace.currentProgramModel.elementTodelete.id = id;
             })

			node.node.className.baseVal = id;
			var classname = "." + id;
			functionObject.classname = classname;

			ContextMenu(classname, id, data);
			data.parentObject.functionBlockObject[id] = functionObject;

			functionObject._eleSet.push(jsrSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			functionObject.type = 'FBlock';
			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "jsr",
					functionBlock : {
						tagName : "jumpsubroutine",
						srname : "?",
						output : "?",
						input : [ "?", "?" ],
					}

				}
			}, PLCSpace.view.programID);
		},	
		RTO : function(data,obj) {
			var id = "RTO-" + data.id + "-" + data.blockOnRung+ "-" + PLCSpace.view.programID;
				var paper = PLCSpace.currentProgramModel.paper;
				var functionObject = {
					_id : id,
					_body : {},
					attr : {},
					classname : "",
					_eleSet : paper.set(),
				_parentObject : data.parentObject,
					_value : {
						label : "?",
						tagname : "?",
						preset : "?",
						acc : 0
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.tagName,
						tagname : obj.tagName,
						preset : obj.preset,
						acc : obj.acc
					}
				}
				var timerSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 125).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;

				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "RTO:" + functionObject._value.label).attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.label = tagNameText;

				var presetRect = paper.rect(data.coordinate.x + 45, data.coordinate.y - 20, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.presetBody = presetRect;

				var presetText = paper.text(data.coordinate.x + 20, data.coordinate.y - 10, "Preset").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.presetText = presetText;

				var accRect = paper.rect(data.coordinate.x + 45, data.coordinate.y + 10, 55, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.accRectBody = accRect;

				var accText = paper.text(data.coordinate.x + 20, data.coordinate.y + 18, "Accum\nulator").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.accText = accText;
	
				var preset = paper.text(data.coordinate.x + 60, data.coordinate.y - 12, functionObject._value.preset).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, functionObject._value.acc).attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.acc = acc
	
				var fOutText = paper.text(data.coordinate.x + 10, data.coordinate.y + 45, functionObject._value.tagname + "_EN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 50, data.coordinate.y + 45, functionObject._value.tagname + "_DN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
	
				var tOutText = paper.text(data.coordinate.x + 85, data.coordinate.y + 45, functionObject._value.tagname + "_TT").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.tOutText = tOutText;
	
				var fOut = paper.image("../assert/img/output.png",data.coordinate.x + 3, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("../assert/img/output.png",data.coordinate.x + 40, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
	
				var tOut = paper.image("../assert/img/output.png",data.coordinate.x + 77, data.coordinate.y + 55, 20, 20)
				functionObject._body.tOut = tOut;
				
				timerSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, tOutText, fOut, sOut, tOut);
				data.parentObject._eleSet.push(timerSet);
	
				//timerSet.attr("title", functionObject._value.tagname);
				timerSet.click(function () {
					PLCSpace.currentProgramModel.deleteOption = "block";
	        		PLCSpace.currentProgramModel.elementTodelete = data;
					PLCSpace.currentProgramModel.elementTodelete.id = id;
	             })
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id, data);
				//console.log(data.parentObject)
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(timerSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
     			functionObject.type = 'FBlock';
     			if(!!obj){functionObject.f = obj}
			PLCSpace.currentProgramModel.undoStack.push(functionObject);
			PLCSpace.currentProgramModel.labels[id] = {
					type:1,
					label : null
			}
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "retentivetimeron",
					functionBlock : {}
				}
			}, PLCSpace.view.programID);
		}
	};

	var configureTimer = function(id,objTemp,data,paper,f,v,type){
		
		
						 			if(v == false){return 0}
						 			var val;
									val = validate2(f.label);
									if(val == false){
										alert("Enter valid label");
										return 0;
									}
									val = validate2(f.preset);
									if(val == false){
										alert("Enter valid preset value");
										return 0;
									}
									var obj = PLCSpace.currentProgramModel.labels;
									if(id.split("-")[0]=="RTO"){
										for (var key in obj) {
											if(obj[key].type !=0 && obj[key].label == f.label  && key != id){
												if(key.split("-")[0] != 'RES'){
													alert("same label for output not allowed")
													return 0;
												}
												
											}	   
										}
									}else if(checkLabels(f.label,id)== 0 ) 
									return 0;
									/*
									 * following for loop checks for labels of "output contacts" that are same
									*/
						 			
									
								 data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
								 data.parentObject.functionBlockObject[id].attr.preset.attr("text",f.preset);
								 
								 data.parentObject.functionBlockObject[id].attr.fOutText.attr("text",f.label +"_en");
								 data.parentObject.functionBlockObject[id].attr.sOutText.attr("text",f.label +"_dn");
								 data.parentObject.functionBlockObject[id].attr.tOutText.attr("text",f.label +"_tt");
								 
								 data.parentObject.functionBlockObject[id]._value.label = f.label;
								 data.parentObject.functionBlockObject[id]._value.preset = f.preset;
								 data.parentObject.functionBlockObject[id]._value.tagEN = f.tagEN;
								 data.parentObject.functionBlockObject[id]._value.tagDN = f.tagDN;
								 data.parentObject.functionBlockObject[id]._value.tagTT = f.tagTT;
								 data.parentObject.functionBlockObject[id]._value.acc = 0;
								
							 	transformString = data.parentObject._eleSet[0].transform();
								data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
								objTemp.type = 'FBlock';
								objTemp.f = f;
								PLCSpace.currentProgramModel.undoStack.push(objTemp);	
								PLCSpace.currentProgramModel.labels[id].label = f.label;
								var obj = {};
								 var presentObj = PLCSpace.currentProgramModel.lableSet;
									if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
												obj[f.label+"_en"] = [id];
												obj[f.label+"_dn"] = [id];
												obj[f.label+"_tt"] = [id];
												obj[f.label+"_acc"] = [id];
												PLCSpace.currentProgramModel.lableSet.push(obj)
									}
									else{
										var eObj = presentObj[0][f.label];
										eObj.push(id);
										
									}
										
						//console.log(PLCSpace.currentProgramModel.lableSet)
						PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
						PLCSpace.view.programID, id, {
							"prevStatus" : 0,
							"tagName" : f.label,
							"preset" : f.preset,
							"type" : type,
							"en" : {
								hardwareAddress : f.tagEN,
								type : "output",
								tagName : f.label + "_en",
								status : 0.0
							},
							"dn" : {
								hardwareAddress : f.tagDN,
								type : "output",
								tagName : f.label + "_dn",
								status : 0.0
							},
							"tt" : {
								hardwareAddress : f.tagTT,
								type : "output",
								tagName : f.label + "_tt",
								status : 0.0
							},
							"acc":0,
						});
				
		
	}
		
	var configureCounter = function(id,objTemp,data,paper,f,v,type){
		
						 			if(v == false){return 0}
						 			var val;
									val = validate2(f.label);
									if(val == false){
										alert("Enter valid label");
										return 0;
									}
									val = validate2(f.preset);
									if(val == false){
										alert("Enter valid preset value");
										return 0;
									}
						 			/*
									 * following for loop checks for labels of "output contacts" that are same
									*/
						 			var obj = PLCSpace.currentProgramModel.labels;
									for (var key in obj) {
											if(obj[key].type !=0 && obj[key].label == f.label  && key != id){
												if(key.split("-")[0] != 'RES'){
													alert("same label for output not allowed")
													return 0;
												}
												
											}	   
										}
								
									 data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
									 objTemp.attr.preset.attr("text",f.preset);
									 
									 if(id.substring(0, 3) == "CTD"){
									 	data.parentObject.functionBlockObject[id].attr.acc.attr("text",f.preset)
									 	 data.parentObject.functionBlockObject[id].attr.fOutText.attr("text",f.label +"_cd");
									 }else{
										 data.parentObject.functionBlockObject[id].attr.fOutText.attr("text",f.label +"_cu"); 
									 }
									 data.parentObject.functionBlockObject[id].attr.sOutText.attr("text",f.label +"_dn");
									 
									 data.parentObject.functionBlockObject[id]._value.label = f.label;
									 data.parentObject.functionBlockObject[id]._value.preset = f.preset;
									 data.parentObject.functionBlockObject[id]._value.tagEN = f.tagEN;
									 data.parentObject.functionBlockObject[id]._value.tagDN = f.tagDN;
									 data.parentObject.functionBlockObject[id]._value.acc = 0;
									
							 		transformString = data.parentObject._eleSet[0].transform();
									data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
									objTemp.type = 'FBlock';
									objTemp.f = f;
									PLCSpace.currentProgramModel.undoStack.push(objTemp);	
									PLCSpace.currentProgramModel.labels[id].label = f.label;
									var obj = {};
									 var presentObj = PLCSpace.currentProgramModel.lableSet;
										if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
													if(id.substring(0, 3) == "CTD"){
														obj[f.label+"_cd"] = [id];
													}else{
														obj[f.label+"_cu"] = [id];
													}
													
													obj[f.label+"_dn"] = [id];
													obj[f.label+"_acc"] = [id];
													
													PLCSpace.currentProgramModel.lableSet.push(obj)
										}
										else{
											var eObj = presentObj[0][f.label];
											eObj.push(id);
											
										}
											
						//console.log(PLCSpace.currentProgramModel.lableSet)
						PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
						PLCSpace.view.programID, id, {
							"tagName" : f.label,
							"preset" : f.preset,
							"acc" : type=="CTD" ?  f.preset : 0,
							"type" : type,
							"dn" : {
								"type" : "output",
								"tagName" :f.label+"_dn",
								"status" : 0.0,
								"hardwareAddress" : f.tagDN
							},
							"prevStatus":0,
						    "cu" : {
											"type" : "output",
											"tagName" :type=="CTU" ? f.label+"_cu" : f.label+"_cd"  ,
											"status" : 0.0,
											"hardwareAddress" : f.tagEN
									}
							
						});
				
	
	}
	
	var configureRES = function(id,objTemp,data,paper,f,type){
		var obj = {};
		var obj3 = PLCSpace.currentProgramModel.labels;
									for (var key in obj3) {
											if(obj3[key].type !=0 && obj3[key].label == f.label  && key != id){
												if(key.split("-")[0] != "CTU" && key.split("-")[0] != "CTD" && key.split("-")[0] != "RTO"){
													alert("same label for output not allowed");
													return 0;
												}
											}	   
										}
									var t = objTemp.attr.label;
									t.attr("text" , f.label);
						 			objTemp._value.label  = f.label == ""? "?" : f.label;
						 			
									objTemp._value.tagname = f.tagname;
									
							 		transformString = data.parentObject._eleSet[0].transform();
									data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
									PLCSpace.currentProgramModel.labels[id].label = f.label;
									var presentObj = PLCSpace.currentProgramModel.lableSet;
									objTemp._eleSet.attr("title", f.label+" : "+objTemp.attr.type);
									if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
												obj[f.label+"_reset"] = id;
												PLCSpace.currentProgramModel.lableSet.push(obj)
									}
									else{
										var eObj = presentObj[0][f.label];
										eObj.push(id);
										
									}
										
									//console.log(PLCSpace.currentProgramModel.lableSet);
								PLCSpace.dataStore
								.UpdateFunctionBlockConfiguration(
										PLCSpace.view.programID,
										id,
										{						
											"rungAddress" : data.id,
											"output" : {
												"type" : "reset",
												"tagName" : f.label+"_reset",
												"status" : 0.0,
												"hardwareAddress" : "",
											}
										
										});
	}
	var configureTOT=function(id,objTemp,data,paper,f,v,type){
		if(v == false){return 0;}
		data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
		data.parentObject.functionBlockObject[id].attr.inputlabelText.attr("text",f.inputLabel);
		data.parentObject.functionBlockObject[id].attr.inputValueText.attr("text",f.inputValue);
		data.parentObject.functionBlockObject[id].attr.TBValueText.attr("text",f.operations);
		data.parentObject.functionBlockObject[id].attr.outputLabelText.attr("text",f.outputLabel);
		
		objTemp._value.label  = f.label == ""? "?" : f.label;
		objTemp._value.labelInput = f.inputLabel == ""? "?" : f.inputLabel;
		objTemp._value.valueInput = f.inputValue == ""? "?" : f.inputValue;
		objTemp._value.timebase = f.operations == ""? "?" : f.operations;
		objTemp._value.labelOutput = f.outputLabel == ""? "?" : f.outputLabel;
		
		var presentObj = PLCSpace.currentProgramModel.lableSet;
		var obj = {};
		if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
			obj[f.outputLabel] = [id+"_"+f.outputLabel];
			PLCSpace.currentProgramModel.lableSet.push(obj)
		}
		else{
					var eObj = presentObj[0][f.outputLabel];
					eObj.push(id);
											
		}
		PLCSpace.currentProgramModel.labels[id].label = f.label;
		var obj = {
			label : f.label,
			"tagName" : f.label,
			timebae : f.operations,
			"type" : type,
			"preOutput" : 0.0,
			input: {
							"type" : "output",
							"tagName" : f.inputLabel,
							"status" :f.inputValue,
							//"hardwareAddress": f.tagnameA
			},
			output:{
					"type" : "output",
					"tagName" : f.outputLabel,
					"status" :0.0,
					//"hardwareAddress": f.tagnameA	
			}
		};	
		
		PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, obj);
	}/////

	var configureSRT = function(id, objTemp, data, paper,f,v,type){
		if(v == false){return 0;}
		data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
		data.parentObject.functionBlockObject[id].attr.inputlblText.attr("text",f.inputLabel);
		data.parentObject.functionBlockObject[id].attr.inputValueText.attr("text",f.inputValue);
		data.parentObject.functionBlockObject[id].attr.outputlblText.attr("text",f.outputLabel);
		
		objTemp._value.label  = f.label == ""? "?" : f.label;
		objTemp._value.labelInput = f.inputLabel == ""? "?" : f.inputLabel;
		objTemp._value.valueInput = f.inputValue == ""? "?" : f.inputValue;
		objTemp._value.labelOutput = f.outputLabel == ""? "?" : f.outputLabel;
		
		var obj = {};
		var presentObj = PLCSpace.currentProgramModel.lableSet;
		if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
			obj[f.outputLabel] = [id+"_"+f.outputLabel];
			PLCSpace.currentProgramModel.lableSet.push(obj)
		}
		else{
					var eObj = presentObj[0][f.outputLabel];
					eObj.push(id);
											
		}
		PLCSpace.currentProgramModel.labels[id].label = f.label;
		
		var obj = {
			label : f.label,
			input: {
							"type" : "output",
							"tagName" : f.inputLabel,
							"status" :f.inputValue,
							//"hardwareAddress": f.tagnameA
			},
			output:{
					"type" : "output",
					"tagName" : f.outputLabel,
					"status" :0.0,
					//"hardwareAddress": f.tagnameA	
			}
		};	
		//console.log(obj)
		PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, obj);
	}///
	var configureSCL = function(id, objTemp, data, paper,f,v,type){
		if(v == false){return 0;}
		data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
		data.parentObject.functionBlockObject[id].attr.labelLI.attr("text",f.LI_Label);
		data.parentObject.functionBlockObject[id].attr.labelLO.attr("text",f.LO_Label);
		data.parentObject.functionBlockObject[id].attr.valueLO.attr("text",f.LO_Value);
		data.parentObject.functionBlockObject[id].attr.labelHI.attr("text",f.HI_Label);
		data.parentObject.functionBlockObject[id].attr.labelHO.attr("text",f.HO_Label);
		data.parentObject.functionBlockObject[id].attr.valueHO.attr("text",f.HO_Value);
		data.parentObject.functionBlockObject[id].attr.labelTI.attr("text",f.TI_Label);
		data.parentObject.functionBlockObject[id].attr.valueLI.attr("text",f.LI_Value);
		data.parentObject.functionBlockObject[id].attr.valueHI.attr("text",f.HI_Value);
		data.parentObject.functionBlockObject[id].attr.valueTI.attr("text",f.TI_Value);
		data.parentObject.functionBlockObject[id].attr.labelRes.attr("text",f.res);
		
		objTemp._value.label  = f.label == ""? "?" : f.label;
		objTemp._value.labelLI  = f.LI_Label == ""? "?" : f.LI_Label;
		objTemp._value.valueLI  = f.LI_Value == ""? "?" : f.LI_Value;
		objTemp._value.labelHI  = f.HI_Label == ""? "?" : f.HI_Label;
		objTemp._value.valueHI  = f.HI_Value == ""? "?" : f.HI_Value;
		objTemp._value.labelLO  = f.labelLO == ""? "?" : f.LO_Label;
		objTemp._value.valueLO  = f.LO_Value == ""? "?" : f.LO_Value;
		objTemp._value.labelHO  = f.HO_Label == ""? "?" : f.HO_Label;
		objTemp._value.valueHO  = f.HO_Value == ""? "?" : f.HO_Value;
		objTemp._value.labelTI  = f.TI_Label == ""? "?" : f.TI_Label;
		objTemp._value.valueTI  = f.TI_Value == ""? "?" : f.TI_Value;
		objTemp._value.labelRes  = f.res == ""? "?" : f.res;
		
		var obj = {};
		var presentObj = PLCSpace.currentProgramModel.lableSet;
		if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
			obj[f.res] = [id+"_"+f.res];
			PLCSpace.currentProgramModel.lableSet.push(obj)
		}
		else{
					var eObj = presentObj[0][f.res];
					eObj.push(id);
											
		}
		PLCSpace.currentProgramModel.labels[id].label = f.label;	
		var obj = {
			label : f.label,
			LI: {
							"type" : "output",
							"tagName" : f.LI_Label,
							"status" :f.LI_Value,
							//"hardwareAddress": f.tagnameA
			},
			HI:{
					"type" : "output",
					"tagName" : f.HI_Label,
					"status" :f.HI_Value,
					//"hardwareAddress": f.tagnameA
			},
			LO:{
					"type" : "output",
					"tagName" : f.LO_Label,
					"status" :f.LO_Value,
					//"hardwareAddress": f.tagnameA
			},
			HO:{
					"type" : "output",
					"tagName" : f.HO_Label,
					"status" :f.HO_Value,
					//"hardwareAddress": f.tagnameA
			},
			TI:{
					"type" : "output",
					"tagName" : f.TI_Label,
					"status" :f.TI_Value,
					//"hardwareAddress": f.tagnameA
			},
			res:{
					"type" : "output",
					"tagName" : f.res,
					"status" :0.0,
					//"hardwareAddress": f.tagnameA	
			}
			
			
		};
		
		PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, obj);
	}////

	var configureArithmeticBlocks = function(id, objTemp, data, paper,f,v,type) {
		
						 			if(v == false){return 0}
						 			var val;
						 			
						 			val = validate2(f.label);
									if(val == false){
										alert("Enter valid label ");
										return 0;
									}
									val = validate(f.labelA);
									if(val == false){
										alert("Enter valid label for source-A");
										return 0;
									}
									val = validate2(f.valueA);
									if(val == false){
										alert("Enter valid value for source-A");
										return 0;
									}
									val = validate(f.labelB);
									if(val == false){
										alert("Enter valid label for source-B");
										return 0;
									}
									val = validate2(f.valueB);
									if(val == false){
										alert("Enter valid value for source-B");
										return 0;
									}
									val = validate(f.labelR);
									if(val == false){
										alert("Enter valid label of Result");
										return 0;
									}
						 			
						 			if(checkLabels(f.label,id)== 0) 
									return 0;
						 			 
						 			
						 			 	
									data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
									 data.parentObject.functionBlockObject[id].attr.labelA.attr("text",f.labelA);
									 data.parentObject.functionBlockObject[id].attr.labelB.attr("text",f.labelB);
									 data.parentObject.functionBlockObject[id].attr.labelR.attr("text",f.labelR);
									 data.parentObject.functionBlockObject[id].attr.valueA.attr("text",f.valueA);
									 data.parentObject.functionBlockObject[id].attr.valueB.attr("text",f.valueB);
									 
									 data.parentObject.functionBlockObject[id]._value.label = f.label;
									 data.parentObject.functionBlockObject[id]._value.labelA = f.labelA ;
									 data.parentObject.functionBlockObject[id]._value.valueA = f.valueA ;
									 data.parentObject.functionBlockObject[id]._value.labelB = f.labelB ;
									 data.parentObject.functionBlockObject[id]._value.valueB = f.valueB ;
									 data.parentObject.functionBlockObject[id]._value.labelR = f.labelR ;
									var obj = {};
									 var presentObj = PLCSpace.currentProgramModel.lableSet;
										if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
													obj[f.labelR] = [id+"_"+f.labelR];
													PLCSpace.currentProgramModel.lableSet.push(obj)
										}
										else{
											var eObj = presentObj[0][f.labelR];
											eObj.push(id);
											
										}
											
										//console.log(PLCSpace.currentProgramModel.lableSet)
										
									
								objTemp.type = 'FBlock';
								objTemp.f = f;
								PLCSpace.currentProgramModel.undoStack.push(objTemp);
								PLCSpace.currentProgramModel.labels[id].label = f.label;	
										var obj = {
												label : f.label,
												sourceA : {
													"type" : "output",
													"tagName" : f.labelA,
													"status" :f.valueA,
													"hardwareAddress": f.tagnameA
												},
												sourceB :{
													"type" : "output",
													"tagName" : f.labelB,
													"status" :f.valueB,
													"hardwareAddress": f.tagnameB
												},
												destination : {
													"type" : "output",
													"tagName" : f.labelR,
													"status" : 0.0,
													"hardwareAddress": f.tagnameR
												},
											};
										PLCSpace.dataStore
										.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, obj);
								if(PLCSpace.PLCEditorSpace.isRun){
									var fbobj = {
											"functionType":type,
								            "functionBlock" :obj
									}
									
								}
							
		
	}
	var configureCMP = function(id,objTemp,data,paper,f,outputAddress,type){
									
						 			var val;
						 			var expression = "";
						 			val = validate2(f.label);
									if(val == false){
										alert("Enter valid label");
										return 0;
									} 
									val = validate2(f.op1);
									if(val == false){
										alert("Enter valid operator-1");
										return 0;
									} 
									if(f.operations != "NOT"){
										val = validate2(f.op2);
										if(val == false){
											alert("Enter valid operator-2");
											return 0;
										} 
									}else{
										f.op2 = 0;
									}
									
									switch(f.operations){
										case 'EQU':
											expression = f.op1+" = "+f.op2;
										break;
										case 'LES':
											expression = f.op1+" < "+f.op2;
										break;
										case 'GRT':
											expression = f.op1+" > "+f.op2;
										break;
										case 'LEQ':
											expression = f.op1+" <= "+f.op2;
										break;
										case 'GEQ':
											expression = f.op1+" >= "+f.op2;
										break;
										case 'AND':
											expression = f.op1+" AND "+f.op2;
										break;
										case 'OR':
											expression = f.op1+" OR "+f.op2;
										break;
										case 'XOR':
											expression = f.op1+" XOR "+f.op2;
										break;
										case 'NOT':
											expression = " NOT "+f.op1;
										break;
									}
						 			data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
									data.parentObject.functionBlockObject[id].attr.expression.attr("text",expression);
									
									objTemp._value.label  = f.label == ""? "?" : f.label;
									objTemp._value.expression  = expression == ""? "?" : expression;
									objTemp._value.op1  = f.op1 == ""? "?" : f.op1;
									objTemp._value.op2  = f.op2 == ""? "?" : f.op2;
									objTemp._value.operation = f.operations;
									objTemp.type = 'FBlock';
									objTemp.f = f;
									PLCSpace.currentProgramModel.undoStack.push(objTemp);
									PLCSpace.currentProgramModel.labels[id].label = f.label;	
									
											var obj = {
											operation : f.operations,
											op1 : f.op1,
											op2 : f.op2,
											lable : f.label,
											outputAddress :outputAddress ,
											result : 0
										}
										PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,obj);
										
	}
	
	var configureLIM = function(id,objTemp,data,paper,f,outputAddress,type){
					var val;
						 			
						 			val = validate2(f.label);
									if(val == false){
										alert("Enter valid label");
										return 0;
									} 
									val = validate(f.LLlabel);
									if(val == false){
										alert("Enter valid label for Low Limit");
										return 0;
									}
									val = validate2(f.LLValue);
									if(val == false){
										alert("Enter valid value for Low Limit");
										return 0;
									} 
									val = validate(f.HLLabel);
									if(val == false){
										alert("Enter valid label for High Limit");
										return 0;
									}
									val = validate2(f.HLValue);
									if(val == false){
										alert("Enter valid value for High Limit");
										return 0;
									} 
									val = validate(f.TestLabel);
									if(val == false){
										alert("Enter valid label for Test ");
										return 0;
									}
						 			val = validate2(f.TestValue);
									if(val == false){
										alert("Enter valid value for Test");
										return 0;
									} 
						 			
						 			objTemp._value.label  = f.label == ""? "?" : f.label;
						 			data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
									objTemp._value.LLAdress  = f.LLlabel == ""? "?" : f.LLlabel;
									data.parentObject.functionBlockObject[id].attr.lowLevelLabel.attr("text",f.LLlabel);
									objTemp._value.HLAdress   = f.HLLabel == ""? "?" : f.HLLabel;
									data.parentObject.functionBlockObject[id].attr.highLevelLabel.attr("text",f.HLLabel);
									objTemp._value.TestAdress = f.TestLabel == ""? "?" : f.TestLabel;
									data.parentObject.functionBlockObject[id].attr.TestLabel.attr("text",f.TestLabel);
									objTemp._value.LLValue = f.LLValue == ""? "?" : f.LLValue;
									data.parentObject.functionBlockObject[id].attr.lowLevelValue.attr("text",f.LLValue);
									objTemp._value.HLValue = f.HLValue == ""? "?" : f.HLValue;
									data.parentObject.functionBlockObject[id].attr.highLevelValue.attr("text",f.HLValue);
									objTemp._value.TestValue = f.TestValue == ""? "?" : f.TestValue;
									data.parentObject.functionBlockObject[id].attr.TestValue.attr("text",f.TestValue);
									
									objTemp.type = 'FBlock';
									objTemp.f = f;
									PLCSpace.currentProgramModel.undoStack.push(objTemp);
									PLCSpace.currentProgramModel.labels[id].label = f.label;
										var obj = {
											label : f.label,
											lowValue : f.LLValue,
											lowLabel : f.LLlabel,
											highValue : f.HLValue,
											highLabel : f.HLLabel,
											testValue : f.TestValue,
											testLabel : f.TestLabel,
											result : 0.0,
											outputAddress : outputAddress
										}
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,obj);
											
	}
	
	var configureComparativeBlocks = function(id,objTemp,data,paper,f,outputAddress,type){
				var val;
				val = validate2(f.label);
				if(val == false){
					alert("Enter valid label ");
					return 0;
				}
				val = validate(f.SrcALabel);
				if(val == false){
					alert("Enter valid label of source-A");
					return 0;
				}
				val = validate2(f.SrcAValue);
				if(val == false){
					alert("Enter valid value of source-A");
					return 0;
				}
				val = validate(f.SrcBLabel);
				if(val == false){
					alert("Enter valid label of source-B");
					return 0;
				}
				val = validate2(f.SrcBValue);
				if(val == false){
					alert("Enter valid value of source-B");
					return 0;
				}
				data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
				data.parentObject.functionBlockObject[id].attr.label1.attr("text",f.SrcALabel);
				data.parentObject.functionBlockObject[id].attr.label2.attr("text",f.SrcBLabel);
				data.parentObject.functionBlockObject[id].attr.value1.attr("text",f.SrcAValue);
				data.parentObject.functionBlockObject[id].attr.value2.attr("text",f.SrcBValue);
				
				objTemp._value.label  = f.label == ""? "?" : f.label;
				objTemp._value.source1Adress  = f.SrcALabel == ""? "?" : f.SrcALabel;
				objTemp._value.source2Adress  = f.SrcBLabel == ""? "?" : f.SrcBLabel;
				objTemp._value.source1Value  = f.SrcAValue == ""? "?" : f.SrcAValue;
				objTemp._value.source2Value  = f.SrcBValue == ""? "?" : f.SrcBValue;
									
				objTemp.type = 'FBlock';
				objTemp.f = f;
				PLCSpace.currentProgramModel.undoStack.push(objTemp);
				
				PLCSpace.currentProgramModel.labels[id].label = f.label;
				var obj = {
									lable : f.label,
									result : 0.0,
									outputAddress :outputAddress,
									sourceA :{
												tagName : f.SrcALabel,
												id : id,
												status : parseFloat(f.SrcAValue),
												hardwareAddress : "hEF",
									},
									
									sourceB : {
											tagName : f.SrcBLabel,
												id : id,
												status : parseFloat(f.SrcBValue),
												hardwareAddress : "hEF",
												type : 'fb',
									},
									}
									PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, obj);
									if(PLCSpace.PLCEditorSpace.isRun){
										var fbobj = {
												rungId :  id.slice(4, 5),
												 fb : {}	
										};
										type  = type.toLocaleLowerCase();
										fbobj.fb[type] = obj;
										configureFBBlock(fbobj);
									}
	}
	
	var configureCPT = function(id, objTemp, data, paper,f,v,type) {
		if(v == false){return 0}
						 			var val;
						 			
						 			val = validate2(f.label);
									if(val == false){
										alert("Enter valid label");
										return 0;
									} 
							//check for valid expression-----------------------------------------------------------------
									val = validate2(f.expression);
									
									if(val == false){
										alert("Enter valid Expression");
										return 0;
									}
									var exp = f.expression ;
									var cnt1 = 0;
									var cnt2 = 0;
									for (var i=0; i<exp.length; i++) {
											var  c = exp.charAt(i);
											if(c == "(")
												cnt1++;
											else if(c == ")")
												cnt2++;
										}
									if(cnt1 != cnt2){
										alert("Enter valid Expression");
										return 0;
									}
									for (var j=0; j<exp.length; j++) {
											var  d = exp.charAt(j);
											if(d.match(/[a-zA-Z0-9()-+*/.]|-/g)==null){
												
												val = false;
												break;
											}
											if(d.match(/[a-zA-Z0-9]/) != null && exp.charAt(j+1) == "("){
												val = false;
												break;
											}
											
											if(d == ")" && (exp.charAt(j+1) != "+" && exp.charAt(j+1) != "-" && exp.charAt(j+1) != "*" && exp.charAt(j+1) != "/") && exp.charAt(j+1) != ""){
												val = false;
												break;											
											}
											
												
										}
										var z = exp.charAt(exp.length-1);
										var a = exp.charAt(0);
									if(val == false || z == "+" || z == "-" || z == "*" || z == "/" || a == "*" || a == "/"){
										alert("Enter valid Expression");
												return 0;
									}
					//----------------------------------------------------------------------------------------------------
									val = validate2(f.destination);
									if(val == false){
										alert("Enter valid destination");
										return 0;
									}
									 
						 			if(checkLabels(f.label,id)== 0) 
									return 0;
						 			objTemp._value.label  = f.label == ""? "?" : f.label;
									data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
									objTemp._value.expression  = f.expression == ""? "?" : f.expression;
									data.parentObject.functionBlockObject[id].attr.expression.attr("text",f.expression);
									objTemp._value.destination  = f.destination == ""? "?" : f.destination;
									data.parentObject.functionBlockObject[id].attr.destination.attr("text",f.destination);
									
									var obj = {};
									 var presentObj = PLCSpace.currentProgramModel.lableSet;
										if(presentObj.length == 0 ||presentObj[0][f.destination] == null  ){ 
													obj[f.destination] = [id+"_"+f.destination];
													obj[f.label] = [id];
													PLCSpace.currentProgramModel.lableSet.push(obj)
										}
										else{
											var eObj = presentObj[0][f.destination];
											eObj.push(id);
											
										}
									objTemp.type = 'FBlock';
									objTemp.f = f;
									PLCSpace.currentProgramModel.undoStack.push(objTemp);
									PLCSpace.currentProgramModel.labels[id].label = f.label;
									var obj = {
											label : f.label,
											expression : f.expression,
											destination : {
												"type" : "output",
												"tagName" : f.destination,
												"status" : 0.0
											},
											result : 0.0,
											tagName : f.label
										}
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,obj);
		
	}
	
	var configureOLT = function(id,objTemp,data,paper,f,type){
									var obj = {};
									var flag = false;
						 			for(var i=0;i < PLCSpace.currentProgramModel.latchlabels.length ;i++)
									{
										if(f.label == PLCSpace.currentProgramModel.latchlabels[i])
										{
											flag = true;
											break;
										}
										
									}
									if(!!flag){
										var t = objTemp.attr.label;
										t.attr("text" , f.label);
										objTemp._value.label  = f.label == ""? "?" : f.label;
										objTemp._value.tagname = f.tagname;
										data.parentObject.functionBlockObject[id]._value.label = f.label;
										transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.attr("title",f.label+" : "+0);
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										PLCSpace.currentProgramModel.latchlabels.push(f.label);	
									}
									else if(checkLabels(f.label) != 0){
										var t = objTemp.attr.label;
										t.attr("text" , f.label);
										objTemp._value.label  = f.label == ""? "?" : f.label;
										objTemp._value.tagname = f.tagname;
										data.parentObject.functionBlockObject[id]._value.label = f.label;
										transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.attr("title",f.label+" : "+0);
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										PLCSpace.currentProgramModel.latchlabels.push(f.label);	
									}
									var presentObj = PLCSpace.currentProgramModel.lableSet;
									if(presentObj.length == 0 ||presentObj[0][f.destination] == null  ){ 
												obj[f.label] = [id];
												PLCSpace.currentProgramModel.lableSet.push(obj)
									}
									else{
										var eObj = presentObj[0][f.label];
										eObj.push(id);
										
									}
									PLCSpace.dataStore
									.UpdateFunctionBlockConfiguration(
											PLCSpace.view.programID,
											id,
											{						
												"output" : {
														"hardwareAddress" : "l1",
														"tagName" : f.label,
														"type" : "latch",
														status : 0.0,
														"unLatchstatus" :0
												}
											});
	}
	
	var configureOTU = function(id,objTemp,data,paper,f,type){
								var obj = {};
								var flag = false;
						 			for(var i=0;i < PLCSpace.currentProgramModel.latchlabels.length ;i++)
									{
										if(f.label == PLCSpace.currentProgramModel.latchlabels[i])
										{
											flag = true;
											break;
										}
										
									}
									if(!!flag){
										var t = objTemp.attr.label;
										t.attr("text" , f.label);
										objTemp._value.label  = f.label == ""? "?" : f.label;
										objTemp._value.tagname = f.tagname;
										data.parentObject.functionBlockObject[id]._value.label = f.label;
										transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.attr("title",f.label+" : "+0);
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										PLCSpace.currentProgramModel.latchlabels.push(f.label);	
									}
									else if(checkLabels(f.label) != 0){
										var t = objTemp.attr.label;
										t.attr("text" , f.label);
										objTemp._value.label  = f.label == ""? "?" : f.label;
										objTemp._value.tagname = f.tagname;
										data.parentObject.functionBlockObject[id]._value.label = f.label;
										transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.attr("title",f.label+" : "+0);
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										PLCSpace.currentProgramModel.latchlabels.push(f.label);	
									}
									var presentObj = PLCSpace.currentProgramModel.lableSet;
									if(presentObj.length == 0 ||presentObj[0][f.destination] == null  ){ 
												obj[f.label] = [id];
												PLCSpace.currentProgramModel.lableSet.push(obj)
									}
									else{
										var eObj = presentObj[0][f.label];
										eObj.push(id);
										
									}
						PLCSpace.dataStore
						.UpdateFunctionBlockConfiguration(
								PLCSpace.view.programID,
								id,
								{						
									"output" : {
											"hardwareAddress" : "l1",
											"tagName" : f.label,
											"type" : "unlatch",
											status : 0.0
									}
								});		
	}
	
	var configureMOV = function(id,objTemp,data,paper,f,type){
										var val;
						 				var obj={};
							 			val = validate2(f.label);
										if(val == false){
											alert("Enter valid label");
											return 0;
										} 
										val = validate(f.SrcALabel);
										if(val == false){
											alert("Enter valid label for Source-A");
											return 0;
										}
										val = validate2(f.SrcAValue);
										if(val == false){
											alert("Enter valid value for Source-A");
											return 0;
										}
										val = validate(f.SrcBLabel);
										if(val == false){
											alert("Enter valid label for Source-B");
											return 0;
										}
										
							 			if(checkLabels(f.label,id)== 0) 
										return 0;
							 			objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
										data.parentObject.functionBlockObject[id]._body.label = label;
										
										objTemp._value.source1Adress  = f.SrcALabel == ""? "?" : f.SrcALabel;
										SrcALabel =  paper.text(objTemp.attr.label1.attrs.x , objTemp.attr.label1.attrs.y ,objTemp._value.source1Adress);
										objTemp.attr.label1.remove();
										data.parentObject.functionBlockObject[id].attr.label1 = SrcALabel ;
										
										objTemp._value.source2Adress  = f.SrcBLabel == ""? "?" : f.SrcBLabel;
										SrcBLabel =  paper.text(objTemp.attr.label2.attrs.x , objTemp.attr.label2.attrs.y ,objTemp._value.source2Adress);
										objTemp.attr.label2.remove();
										data.parentObject.functionBlockObject[id].attr.label2 = SrcBLabel ;
										
										objTemp._value.source1Value  = f.SrcAValue == ""? "?" : f.SrcAValue;
										SrcAValue =  paper.text(objTemp.attr.value1.attrs.x , objTemp.attr.value1.attrs.y ,objTemp._value.source1Value);
										objTemp.attr.value1.remove();
										data.parentObject.functionBlockObject[id].attr.value1 = SrcAValue ;
										
										data.parentObject.functionBlockObject[id].attr.tagname = f.sourceBTag ;
										objTemp._eleSet.push(label,SrcALabel,SrcBLabel,SrcAValue);	
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.undoStack.push(objTemp);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										var obj = {};
										 var presentObj = PLCSpace.currentProgramModel.lableSet;
											if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
														obj[f.SrcBLabel] = [id];
														
														PLCSpace.currentProgramModel.lableSet.push(obj)
											}
											else{
												var eObj = presentObj[0][f.label];
												eObj.push(id);
												
											}
												
										PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,{
																label : f.label,
															dest : {
																	"type" : "output",
																	"tagName" : f.SrcBLabel,
																	"status" : 0.0,
																	hardwareAddress : f.sourceBTag
																},
															source : {
																"type" : "output",
																"tagName" : f.SrcALabel,
																"status" :f.SrcAValue,
																hardwareAddress : f.sourceATag
															
															},
															
														});
	}//configureMOV ends
	
	var configureJMP = function(id,objTemp,data,paper,f,type){
									if(checkLabels(f.label,id)== 0) 
										return 0;
							 			objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
							 			objTemp._eleSet.push(label);
										data.parentObject.functionBlockObject[id]._body.label = label;
										data.parentObject._eleSet.push(label);
							 			transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.undoStack.push(objTemp);
										PLCSpace.currentProgramModel.labels[id].label = f.label;	
										
										data.parentObject.functionBlockObject[id]._eleSet.attr("title", f.label);
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																labelName : f.label
															});
	}//configureJMP ends
	var configureLBL= function(id,objTemp,data,paper,f,type){
		objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
							 			objTemp._eleSet.push(label)
							 			data.parentObject._eleSet.push(label);
							 			transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										data.parentObject.functionBlockObject[id]._body.label = label;
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.undoStack.push(objTemp);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										PLCSpace.currentProgramModel.lbl.push(data.parentObject._id);
										data.parentObject.functionBlockObject[id]._eleSet.attr("title", f.label);
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																labelName : f.label,
																rungAddress : objTemp._parentObject._id
															});
	}//configureLBL ends
	
	var configurePID = function(id,objTemp,data,paper,f,type){
										data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
										
										data.parentObject.functionBlockObject[id].attr.input.attr("text",f.input)
										data.parentObject.functionBlockObject[id].attr.inputval.attr("text",f.inputval)
										data.parentObject.functionBlockObject[id].attr.output.attr("text",f.output)
										
										objTemp._value.label  = f.label == ""? "?" : f.label;
										objTemp._value.input  = f.input == ""? "?" : f.input;
										objTemp._value.output  = f.output == ""? "?" : f.output;
										objTemp._value.inputval  = f.inputval == ""? "?" : f.inputval;
										objTemp._value.inputTag  = f.inputTag == ""? "?" : f.inputTag;
										objTemp._value.outputTag  = f.outputTag == ""? "?" : f.outputTag;
										
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										var obj = {};
										var presentObj = PLCSpace.currentProgramModel.lableSet;
										
										if(presentObj.length == 0 ||presentObj[0][f.output] == null  ){ 
													obj[f.output] = id;
													PLCSpace.currentProgramModel.lableSet.push(obj);

										}
				var pidObject = {};		
			
				pidObject.action = f.action;
		    	pidObject.control = f.control;
		    	pidObject.type = f.type;
		    	pidObject.setPiont = f.setPiont;
		    	pidObject.maxInput = f.maxInput;
		    	pidObject.minInput = f.minInput;
		    	pidObject.kp = f.kp;
		    	pidObject.P0 = f.P0;
		    	pidObject.Time = f.Time;
		    	pidObject.ki = f.ki;
		    	pidObject.kd =f.kd;
		    	pidObject.intialControlOp = 50;
		    	pidObject.preE = 0;	
		    	pidObject.mode = f.mode;	
		    	
		    	pidObject.Input = f.input;
		    	pidObject.inputVal = f.inputval;
		    	pidObject.outputLbl = f.output;
		    	pidObject.label = f.label;
		    	pidObject.outputVal = 0;
		    	
		    	
		    	
		    	PLCSpace.sarvaGlobal[pidObject.label] = pidObject;
		    	
		    	
		    	PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID,
												id,pidObject);
		    	PLCSpace.pidObject = pidObject ; 
		    	
		    	//configure poc object
		    	poc[id] = {};
				poc[id].mode = pidObject.mode;
				poc[id].action = pidObject.action;
				poc[id].control = pidObject.control;
				poc[id].type = pidObject.type;
				poc[id].setPiont = pidObject.setPiont;
				poc[id].maxInput = pidObject.maxInput;
				poc[id].minInput = pidObject.minInput;
				poc[id].kp = pidObject.kp;
				poc[id].p0 = pidObject.P0;
				poc[id].ki = pidObject.ki;
				poc[id].kd = pidObject.kd;
				poc[id].Time = pidObject.Time;
				
				$( "#pControl" ).show();
	}
	
	var configureJSR = function(id,objTemp,data,paper,f,type){
		
		data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
		data.parentObject.functionBlockObject[id].attr.subroutine.attr("text",f.Subroutine); 
		data.parentObject.functionBlockObject[id].attr.inputParameter.attr("text",f.inputParameter);
		data.parentObject.functionBlockObject[id].attr.returnParameter.attr("text",f.returnParameter);
										
		objTemp._value.label  = f.label == ""? "?" : f.label;
		objTemp._value.routine  = f.Subroutine == ""? "?" : f.Subroutine;
		objTemp._value.inputParameter  = f.inputParameter == ""? "?" : f.inputParameter;
		objTemp._value.returnParameter  = f.returnParameter == ""? "?" : f.returnParameter;
									
		objTemp.type = 'FBlock';
		objTemp.f = f;
		PLCSpace.currentProgramModel.undoStack.push(objTemp);
		PLCSpace.currentProgramModel.labels[id].label = f.label;
		PLCSpace.dataStore
						.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																tagName : f.label,
																srname : f.Subroutine,
																output : f.returnParameter,
																inputParam : f.inputParameter
						});
	}//configureJSR ends
	
	var configureSBR = function(id,objTemp,data,paper,f,type){
		
		objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
										data.parentObject.functionBlockObject[id]._body.label = label;
										
										objTemp._value.inputParameter  = f.inputParameter == ""? "?" : f.inputParameter;
										inputParameter =  paper.text(objTemp.attr.inputParameter.attrs.x , objTemp.attr.inputParameter.attrs.y ,objTemp._value.inputParameter);
										objTemp.attr.inputParameter.remove();
										data.parentObject.functionBlockObject[id].attr.inputParameter = inputParameter ;
										objTemp._eleSet.push(label,inputParameter);
										data.parentObject._eleSet.push(label,inputParameter);
							 			transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.undoStack.push(objTemp);
										
										PLCSpace.currentProgramModel.labels[id].label = f.label;
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																tagName : f.label,
																inputParam : f.inputParameter
															});
	}//configureSBR ends
	
	var configureRET = function(id,objTemp,data,paper,f,type){
		
		objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
										data.parentObject.functionBlockObject[id]._body.label = label;
										
										objTemp._value.returnParameter  = f.returnParameter == ""? "?" : f.returnParameter;
										returnParameter =  paper.text(objTemp.attr.returnParameter.attrs.x , objTemp.attr.returnParameter.attrs.y ,objTemp._value.returnParameter);
										objTemp.attr.returnParameter.remove();
										data.parentObject.functionBlockObject[id].attr.returnParameter = returnParameter;
										objTemp._eleSet.push(label,returnParameter);
										data.parentObject._eleSet.push(label,returnParameter);
							 			transformString = data.parentObject._eleSet[0].transform();
										data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.undoStack.push(objTemp);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										data.parentObject.functionBlockObject[id]._eleSet.attr("title", f.label);
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																output : f.returnParameter,
																label : f.label
															});
	}//configureRET ends
	
	var ContextMenu = function(sel, id, data) {
	var paper = PLCSpace.currentProgramModel.paper;
		$.contextMenu({
			selector : sel,
			className : 'data-title',
			callback : function(key, options) {
				// based on callback we will going to call various function
				var m = "clicked: " + key;
				if (!(key == "quit"))
					optionObject[key](id, data);
				// window.console && console.log(m) || alert(m);
			},
			items : {

				"configure" : {
					name : "Configure",
					icon : "edit"
				},
				
				"deleteb" : {
					name : "Delete",
					icon : "delete"
				},
				"sep1" : "---------",
				"quit" : {
					name : "Quit",
					icon : "quit"
				}
			}
		});

		$('.data-title').attr('data-menutitle', "Choose Option");

		$(sel).on('click', function(e) {
			//console.log('clicked', this);
		});
		var optionObject = {

			configure : function() {
				if(!!PLCSpace.currentProgramModel.runmode){return 0};
				var objTemp = data.parentObject.functionBlockObject[id];
			 	type = id.substring(0, 3);
				switch(type)
					{
					case 'TON':
					case 'TOF':
					case 'RTO':
					
						var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="tmrlabel" value='+ objTemp._value.label +' /></div><div class="field"><label for="preset">Preset</label><input type="text" name="preset" id="preset" class = "checkNumeric" title = "Enter only digits"  value= '+ objTemp._value.preset +' ></div> '
						$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			configureTimer(id, objTemp, data, paper,f,v,type);
						 		}
						 })
						$("#tmrlabel").focus();
						$("#tmrlabel").select();
					break;
				case 'CTU':
				case 'CTD':
						var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="ctrlabel" value='+ objTemp._value.label +' /> </div><div class="field"><label for="preset">Preset</label><input type="text" name="preset" id="preset" value='+ objTemp._value.preset +' class = "checkNumeric" title = "Enter only digits"/></div> '
						$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			configureCounter(id,objTemp,data,paper,f,v,type);
						 		}
						 })
						 $("#ctrlabel").focus();
						$("#ctrlabel").select();
						
						break;
				case 'ADD':
				case 'SUB':
				case 'MUL':
				case 'DIV':
				
				var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label1" value='+ objTemp._value.label +' ></div><div class="field"><label for="Label-A">Label-A</label><input type="text" name="labelA" id="LabelA" value = '+ objTemp._value.labelA +' title = "should start with letter" /></div><div class="field"><label for="valueA">Value-A</label><input type="text" name="valueA" id="valueA" value='+ objTemp._value.valueA +' class = "checkNumeric" title = "Enter only digits"/></div><div class="field"><label for="LabelB">Label-B</label><input type="text" name="labelB" id="LabelB" value = '+ objTemp._value.labelB +' title = "should start with letter" /></div><div class="field"><label for="valueB">ValueB</label><input type="text" name="valueB" id="valueB" value='+ objTemp._value.valueB +' class = "checkNumeric" title = "Enter only digits"/></div><div class="field"><label for="LabelR">Label-Result</label><input type="text" name="labelR" id="labelR" value = '+ objTemp._value.labelR +' title = "should start with letter" /></div>'
						$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
									configureArithmeticBlocks(id,objTemp,data,paper,f,v,type);
								}
								})
								$("#label1").focus();
								$("#label1").select();
						break;
				case 'RES':
					var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="reslabel" value='+ objTemp._value.label +' /></div> ';
					var obj = {};
					$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			configureRES(id,objTemp,data,paper,f,type);
						 			
							}
						});
						$("#reslabel").focus();
						$("#reslabel").select();
					break;
				case 'OLT':
				var obj = {};
				var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="latchlabel" value='+ objTemp._value.label +' /></div> ';
					$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			configureOLT(id,objTemp,data,paper,f,type);
						 			
									}
							});
							$("#latchlabel").focus();
							$("#latchlabel").select();
					break;
					case 'OTU':
					var obj = {};
					var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="unlatchlabel" value='+ objTemp._value.label +' /></div> ';
					$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			configureOTU(id,objTemp,data,paper,f,type);
						 			
					}//////
			});
			$("#unlatchlabel").focus();
			$("#unlatchlabel").select();
			
			break;
			case 'PID':
				var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="pidlabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="Input">Input</label><input type="text" name="input" id="input" value = '+ objTemp._value.input +'></div>  <div class="field"><label for="Inputval">Input value</label><input type="text" name="inputval" id="inputval" value = '+ objTemp._value.inputval +'></div> <div class="field"><label for="Output">Output</label><input type="text" name="output" id="output" value = '+ objTemp._value.output +'></div>' 
						$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true, Cancel: false  },
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			if(checkLabels(f.label,id)== 0) 
										return 0;
							 			
							 			//configurePID(id,objTemp,data,paper,f,type);
										data.parentObject.functionBlockObject[id]._body.label.attr("text",type+":"+f.label);
										
										data.parentObject.functionBlockObject[id].attr.input.attr("text",f.input)
										data.parentObject.functionBlockObject[id].attr.inputval.attr("text",f.inputval)
										data.parentObject.functionBlockObject[id].attr.output.attr("text",f.output)
										
										objTemp._value.label  = f.label == ""? "?" : f.label;
										objTemp._value.input  = f.input == ""? "?" : f.input;
										objTemp._value.output  = f.output == ""? "?" : f.output;
										objTemp._value.inputval  = f.inputval == ""? "?" : f.inputval;
										objTemp._value.inputTag  = f.inputTag == ""? "?" : f.inputTag;
										objTemp._value.outputTag  = f.outputTag == ""? "?" : f.outputTag;
										
										//pid-window configuration
										if(poc[id] == undefined)
										{
											poc[id] = {};
											$( "#pControl" ).hide();
											$( ".innerControls" ).hide();
											$( "#typeset" ).hide();
											$( "#innerPIDdialog" ).hide();
										}
										else{
											var pidblk = poc[id]
											if( pidblk.mode == "auto"){
												$('input[name="mode"]')[0].checked = true ;
												if(pidblk.action == "direct"){
													$('input[name="mode2"]')[0].checked = true ;
												}else{
													$('input[name="mode2"]')[1].checked = true ;
												}
												
												if(pidblk.type == "parallel"){
													$('input[name="mode4"]')[1].checked = true ;
												}else{
													$('input[name="mode4"]')[0].checked = true ;
												}
												
												$( "#innerPIDdialog" ).show();
												
					
												if(pidblk.control =="p"){
													$( "#typeset" ).hide();
													$( "#innerpControl" ).show();
													$( "#innerpiControl" ).hide();
													$( "#innerpdControl" ).hide();
													$( "#innerpidControl" ).hide();
													
													$("#p_SetPoint").val(pidblk.setPiont);
													$("#p_MaxInput").val(pidblk.maxInput);
													$("#p_MinInput").val(pidblk.minInput);
													$("#p_kp").val(pidblk.kp);
													$("#p_Po").val(pidblk.p0);
												
													$('input[name="mode3"]')[0].checked = true ;
												}else if(pidblk.control == "pi"){
													$( "#typeset" ).show();
													$( "#innerpControl" ).hide();
													$( "#innerpiControl" ).show();
													$( "#innerpdControl" ).hide();
													$( "#innerpidControl" ).hide();
													$("#pi_ki").val(pidblk.ki) ;
													$("#pi_time").val(pidblk.Time);
													
													$("#pi_SetPoint").val(pidblk.setPiont);
													$("#pi_MaxInput").val(pidblk.maxInput);
													$("#pi_MinInput").val(pidblk.minInput);
													$("#pi_kp").val(pidblk.kp);
													$("#pi_Po").val(pidblk.p0);
													
													$('input[name="mode3"]')[1].checked = true ;
												}
												else if(pidblk.control == "pd"){
													$( "#typeset" ).show();
													$( "#innerpControl" ).hide();
													$( "#innerpiControl" ).hide();
													$( "#innerpdControl" ).show();
													$( "#innerpidControl" ).hide();
													$("#pd_kd").val(pidblk.kd) ;
													$("#pd_time").val(pidblk.Time);
													
													$("#pd_SetPoint").val(pidblk.setPiont);
													$("#pd_MaxInput").val(pidblk.maxInput);
													$("#pd_MinInput").val(pidblk.minInput);
													$("#pd_kp").val(pidblk.kp);
													$("#pd_Po").val(pidblk.p0);
													
													
													$('input[name="mode3"]')[2].checked = true ;
												}else if(pidblk.control == "pid"){
													$( "#typeset" ).show();
													$( "#innerpControl" ).hide();
													$( "#innerpiControl" ).hide();
													$( "#innerpdControl" ).hide();
													$( "#innerpidControl" ).show();
													$("#pid_ki").val(pidblk.ki) ;
													$("#pid_kd").val(pidblk.kd) ;
													$("#pid_time").val(pidblk.Time);
													
													$("#pid_SetPoint").val(pidblk.setPiont);
													$("#pid_MaxInput").val(pidblk.maxInput);
													$("#pid_MinInput").val(pidblk.minInput);
													$("#pid_kp").val(pidblk.kp);
													$("#pid_Po").val(pidblk.p0);
													
													$('input[name="mode3"]')[3].checked = true ;
												}
											}else if(pidblk.mode == "manual"){
													$('input[name="mode"]')[1].checked = true ;
													$( "#innerPIDdialog" ).hide();
													$( "#pControl" ).hide();
													$( "#manualDiv" ).show();
													$( "#innerpControl" ).hide();
													$( "#innerpiControl" ).hide();
													$( "#innerpdControl" ).hide();
													$( "#innerpidControl" ).hide();
											}
										}
			
		
										$("#PIDdialog").css({"display":"block"}).dialog('open');
										objTemp.type = 'FBlock';
										objTemp.f = f;
										PLCSpace.currentProgramModel.undoStack.push(objTemp);
										PLCSpace.currentProgramModel.labels[id].label = f.label;
										PLCSpace.PLCEditorSpace.pidId = id+"&"+f.inputval+"&"+f.output+"&"+f.label+"&"+f.input;
										var obj = {};
										var presentObj = PLCSpace.currentProgramModel.lableSet;
										
										if(presentObj.length == 0 ||presentObj[0][f.output] == null  ){ 
													obj[f.output] = id;
													PLCSpace.currentProgramModel.lableSet.push(obj);

										}
										/*else{
											var eObj = presentObj[0][f.output];
											eObj.push(id);
											
										}*/
							 			}//////////////
									});
									$("#pidlabel").focus();
									$("#pidlabel").select();
									
								break;
				case 'CMP':
					var rungid = id.slice(4,5);
					
					if(PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID]== undefined || PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label==undefined){
											alert("Plz place an output/label on rung - "+rungid)
											return 0 ;
										}
										else{
											outputAddress = PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label;
										}
					var operationsList = ["EQU","LES","GRT","LEQ","GEQ","AND","OR","XOR","NOT"];					
					var htmlText=createTagList(operationsList,objTemp._value.operation);
					var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="cmpLabel" value = '+ objTemp._value.label +'></div><div class="field"><label for="operation">Operation</label><select  name="operations">'+htmlText+'</select></div><div class="field"><label for="op1">Operator-1</label><input type="text" name="op1" id="op1" value = '+ objTemp._value.op1 +' ></div> <div class="field"><label for="op2">Operator-2</label><input type="text" name="op2" id="op2" value = '+ objTemp._value.op2 +'></div>'
				
					 	$.prompt(str,{						
								focus : 1,
						 		buttons: { Submit: true , Cancel: false},
									
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			configureCMP(id,objTemp,data,paper,f,outputAddress,type,operationsList)
						 		}
						});
						$("#cmpLabel").focus();
						$("#cmpLabel").select();
									
					break;
					case 'LGC':
					var rungid = id.slice(4,5);
					
					if(PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID]== undefined || PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label==undefined){
											alert("Plz place an output/label on rung - "+rungid)
											return 0 ;
										}
										else{
											outputAddress = PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label;
										}
					var operationsList = ["AND","OR","XOR","NOT"];					
					var htmlText=createTagList(operationsList,objTemp._value.operation);
					var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="lgcLabel" value = '+ objTemp._value.label +'></div><div class="field"><label for="operation">Operation</label><select id="lgcSelectBox"  name="operations">'+htmlText+'</select></div><div class="field"><label for="op1">Operator-1</label><input type="text" name="op1" id="op1" value = '+ objTemp._value.op1 +' ></div> <div id = "op2Div" class="field"><label for="op2">Operator-2</label><input type="text" name="op2" id="op2" value = '+ objTemp._value.op2 +'></div>'
				
					 	$.prompt(str,{						
								focus : 1,
						 		buttons: { Submit: true , Cancel: false},
									
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			configureCMP(id,objTemp,data,paper,f,outputAddress,type,operationsList)
						 		}
						});
						$("#lgcLabel").focus();
						$("#lgcLabel").select();
						
						var val = $("#lgcSelectBox option:selected").text();
						if(val == "NOT"){
							 $("#op2Div").hide();
						}
						$("#lgcSelectBox").change(function(){
							var val = $("#lgcSelectBox option:selected").text();
							if(val == "NOT"){
								//$("#op2").attr("disabled", "disabled");
								 $("#op2Div").hide();
							}else{
								//$("#op2").removeAttr("disabled"); 
								$("#op2Div").show();
							}
							
					  		
						});
									
					break;
					case 'CPT':
						
					  	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="cptlabel"  value = '+ objTemp._value.label +'></div> <div class="field"><label for="expression">Expression</label><input type="text" name="expression" id="expression"  value = '+ objTemp._value.expression +'></div> <div class="field"><label for="destination">Destination-Lbl</label><input type="text" name="destination" id="destination" value = '+ objTemp._value.destination +'></div>'
					  	$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			
						 			configureCPT(id, objTemp, data, paper,f,v,type);
						 			
								}
						});
					  	$("#cptlabel").focus();
						$("#cptlabel").select();
		
				if(PLCSpace.PLCEditorSpace.isRun){
					var fbobj = {
							rungId :  id.slice(4, 5),
							 fb : {}	
					};
					type  = type.toLocaleLowerCase();
					fbobj.fb[type] = obj;
					configureFBBlock(fbobj);
				}
					break;
				case 'EQU':
	
				case 'NEQ':
				case 'GRT':
				
				case 'LES':
				
				case 'GEQ':
					
				case 'LEQ':
					var rungid = id.split("-")[1];
					if(PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID]== undefined || PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID ].label==undefined){
						alert("Please place an output/label on rung - "+rungid)
						return 0 ;
					}
					else{
						outputAddress = PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label;
					}
					var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="cmplabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="SrcA-Label">SourceA-Label</label><input type="text" name="SrcALabel" id="SrcALabel" value = '+ objTemp._value.source1Adress +' title = "should start with letter" /></div> <div class="field"><label for="SrcA-value">SourceA-Value</label><input type="text" name="SrcAValue" id="SrcAValue" value = '+ objTemp._value.source1Value +' class = "checkNumeric" title = "Enter only digits" /></div> <div class="field"><label for="SrcB-Label">SourceB-Label</label><input type="text" name="SrcBLabel" id="SrcBLabel" value = '+ objTemp._value.source2Adress +' title = "should start with letter" /></div> <div class="field"><label for="SrcB-value">SourceB-Value</label><input type="text" name="SrcBValue" id="SrcBValue" value = '+ objTemp._value.source2Value +' class = "checkNumeric" title = "Enter only digits" /></div> '
					$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			
									configureComparativeBlocks(id,objTemp,data,paper,f,outputAddress,type);
								}
								
							})
							$("#cmplabel").focus();
							$("#cmplabel").select();
				break;
				case 'LIM':
					var rungid = id.slice(4,5);
					
					if(PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID]== undefined || PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label==undefined){
						alert("Plz place an output/label on rung - "+rungid)
						return 0 ;
					}
					else{
						outputAddress = PLCSpace.currentProgramModel.labels["OUT-"+rungid+"-7-"+PLCSpace.view.programID].label;
					}
					  	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="limlabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="LLlabel">Lowlimit-Label</label><input type="text" name="LLlabel" id="LLlabel" value = '+ objTemp._value.LLAdress +' title = "should start with letter" /></div> <div class="field"><label for="LLvalue">LowLimit-Value</label><input type="text" name="LLValue" id="LLValue" value = '+ objTemp._value.LLValue +' class = "checkNumeric" title = "Enter only digits" /></div> <div class="field"><label for="Test-Label">Test-Label</label><input type="text" name="TestLabel" id="TestLabel" value = '+ objTemp._value.TestAdress +' title = "should start with letter" /></div> <div class="field"><label for="Test-value">Test-Value</label><input type="text" name="TestValue" id="TestValue" value = '+ objTemp._value.TestValue +' class = "checkNumeric" title = "Enter only digits" /></div> <div class="field"><label for="HL-Label">HighLimit-Label</label><input type="text" name="HLLabel" id="HLLabel"value = '+ objTemp._value.HLAdress +' title = "should start with letter" /></div> <div class="field"><label for="HL-value">HighLimit-Value</label><input type="text" name="HLValue" id="HLValue" value = '+ objTemp._value.HLValue +' class = "checkNumeric" title = "Enter only digits" /></div> '
					 	$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			
						 			if(v == false){return 0}
						 			configureLIM(id,objTemp,data,paper,f,outputAddress,type);
						 	}
						});
							$("#limlabel").focus();
							$("#limlabel").select();
							if(PLCSpace.PLCEditorSpace.isRun){
								var fbobj = {
										rungId :  id.slice(4, 5),
										 fb : {}	
								};
								type  = type.toLocaleLowerCase();
								fbobj.fb[type] = obj;
								configureFBBlock(fbobj);
							}
					  	
					break;
					case 'JSR':
						  	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="jsrlabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="Subroutine">Subroutine</label><input type="text" name="Subroutine" id="Subroutine" value = '+ objTemp._value.routine +'></div> <div class="field"><label for="InputParameter">Input</label><input type="text" name="inputParameter" id="inputParameter" value = '+ objTemp._value.inputParameter +'><p>(Enter Input parameter seperated with comma)</p></div> <div class="field"><label for="ReturnParameter">Return</label><input type="text" name="returnParameter" id="returnParameter" value = '+ objTemp._value.returnParameter +'></div> '
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			if(checkLabels(f.label,id)== 0) 
										return 0;
							 			configureJSR(id,objTemp,data,paper,f,type);
										
										}
									});
									$("#jsrlabel").focus();
									$("#jsrlabel").select();
					break;
				case 'SBR':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="sbrlabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="InputParameter">Input</label><input type="text" name="inputParameter" id="inputParameter" value = '+ objTemp._value.inputParameter +'><p>(Enter Input parameter seperated with comma)</p></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			
							 			configureSBR(id,objTemp,data,paper,f,type);
							 			
										}
									});
									$("#sbrlabel").focus();
									$("#sbrlabel").select();
					break;
				case 'RET':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="retlabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="ReturnParameter">Return</label><input type="text" name="returnParameter" id="returnParameter" value = '+ objTemp._value.returnParameter +'></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			if(checkLabels(f.label,id)== 0) 
										return 0;
										
										configureRET(id,objTemp,data,paper,f,type);
										
										}
									});
								$("#retlabel").focus();
								$("#retlabel").select();	
					break;

				case 'JMP':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="jmplabel" value = '+ objTemp._value.label +'></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			configureJMP(id,objTemp,data,paper,f,type);
							 			
										}
									});
							$("#jmplabel").focus();
							$("#jmplabel").select();		
					break;
				case 'LBL':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="lblabel" value = '+ objTemp._value.label +'></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			configureLBL(id,objTemp,data,paper,f,type);
							 			
									}
							});
							$("#lblabel").focus();
							$("#lblabel").select();
					break;

				case 'MOV':
							var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="movlabel" value = '+ objTemp._value.label +'></div> <div class="field"><label for="SrcA-Label">SourceA-Label</label><input type="text" name="SrcALabel" id="SrcALabel" value = '+ objTemp._value.source1Adress +' title = "should start with letter" /></div>  <div class="field"><label for="SrcA-value">SourceA-Value</label><input type="text" name="SrcAValue" id="SrcAValue" value = '+ objTemp._value.source1Value +' class = "checkNumeric" title = "Enter only digits" /></div> <div class="field"><label for="SrcB-Label">SourceB-Label</label><input type="text" name="SrcBLabel" id="SrcBLabel" value = '+ objTemp._value.source2Adress +' title = "should start with letter" ></div> '
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			configureMOV(id,objTemp,data,paper,f,type);
							 			
							 		}
							});
							$("#movlabel").focus();
							$("#movlabel").select();
					break;
					
				case 'SCL':
					var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="sclabel" value = '+ objTemp._value.label +'></div><div class="field"><label for="LI-Label">LI-Label</label><input type="text" name="LI_Label" id="LI_Label" value = '+ objTemp._value.labelLI +' title = "should start with letter" /></div><div class="field"><label for="LI-Value">LI-Value</label><input type="text" name="LI_Value" id="LI_Label" value = '+ objTemp._value.valueLI +' title = "should start with letter" /></div><div class="field"><label for="HI-Label">HI-Label</label><input type="text" name="HI_Label" id="HI_Label" value = '+ objTemp._value.labelHI +' title = "should start with letter" /></div><div class="field"><label for="HI-Value">HI-Value</label><input type="text" name="HI_Value" id="HI_Label" value = '+ objTemp._value.valueHI +' title = "should start with letter" /></div><div class="field"><label for="LO-Label">LO-Label</label><input type="text" name="LO_Label" id="LO_Label" value = '+ objTemp._value.labelLO +' title = "should start with letter" /></div><div class="field"><label for="LO-Value">LO-Value</label><input type="text" name="LO_Value" id="LO_Value" value = '+ objTemp._value.valueLO +' title = "should start with letter" /></div><div class="field"><label for="HO-Label">HO-Label</label><input type="text" name="HO_Label" id="HO_Label" value = '+ objTemp._value.labelHO +' title = "should start with letter" /></div><div class="field"><label for="HO-Value">HO-Value</label><input type="text" name="HO_Value" id="HO_Value" value = '+ objTemp._value.valueHO +' title = "should start with letter" /></div><div class="field"><label for="TI-Label">TI-Label</label><input type="text" name="TI_Label" id="TI_Label" value = '+ objTemp._value.labelTI +' title = "should start with letter" /></div><div class="field"><label for="TI-Value">TI-Value</label><input type="text" name="TI_Value" id="TI_Value" value = '+ objTemp._value.valueTI +' title = "should start with letter" /></div><div class="field"><label for="res">Result-Label</label><input type="text" name="res" id="res" value = '+ objTemp._value.labelRes +' title = "should start with letter" /></div>'  
					$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			
							 		if(v == false){return 0}
						 				configureSCL(id,objTemp,data,paper,f,v,type);
							 		}
							});
							$("#sclabel").focus();
							$("#sclabel").select();
				break;
				case 'SRT':
					var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="srtlabel" value = '+ objTemp._value.label +'></div><div class="field"><label for="inputLabel">Input-Label</label><input type="text" name="inputLabel" id="inputLabel" value = '+ objTemp._value.labelInput +' title = "should start with letter" /></div><div class="field"><label for="Input-Value">Input-Value</label><input type="text" name="inputValue" id="inputValue" value = '+ objTemp._value.valueInput +' title = "should start with letter" /></div><div class="field"><label for="outputLabel">Output-Label</label><input type="text" name="outputLabel" id="inputLabel" value = '+ objTemp._value.labelOutput +' title = "should start with letter" /></div>'  
					$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			
							 		if(v == false){return 0}
						 				configureSRT(id,objTemp,data,paper,f,v,type);
							 		}
							});
							$("#srtlabel").focus();
							$("#srtlabel").select();
				break;
				
				case 'TOT':
				var operationsList = ["SEC","MIN","HRS"];					
				var htmlText=createTagList(operationsList,objTemp._value.timebase);
					var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="srtlabel" value = '+ objTemp._value.label +'></div><div class="field"><label for="inputLabel">Input-Label</label><input type="text" name="inputLabel" id="inputLabel" value = '+ objTemp._value.labelInput +' title = "should start with letter" /></div><div class="field"><label for="Input-Value">Input-Value</label><input type="text" name="inputValue" id="inputValue" value = '+ objTemp._value.valueInput +' title = "should start with letter" /></div><div class="field"><label for="Timebase">Timebase</label><select  name="operations">'+htmlText+'</select></div><div class="field"><label for="outputLabel">Output-Label</label><input type="text" name="outputLabel" id="outputLabel" value = '+ objTemp._value.labelOutput +' title = "should start with letter" /></div>'  
					$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			
							 		if(v == false){return 0}
						 				configureTOT(id,objTemp,data,paper,f,v,type);
							 		}
							});
							$("#srtlabel").focus();
							$("#srtlabel").select();
				break;
				
				default:
					alert("no match")
				}
			},
			deleteb : function(id, data) {
				if(!!PLCSpace.currentProgramModel.runmode){return 0}
				
				$.prompt("Do you want to delete a Block/element ? ",{
					 focus: 1,
					 show:'slideDown',
					 buttons: {  Confirm: true,Cancel: false },
					 submit: function(e, v, m, f){
					 	var type = id.slice(0,3);
					 	if(v==false){return 0}
					 	else{
					 		PLCSpace.dataStore.deleteElement(id,PLCSpace.view.programID);
					 			data.parentObject.functionBlockObject[id]._eleSet.remove();
								data.parentObject.isBlockPresent = false ;
								if(!!data.parentObject.blockFlag){
									data.parentObject.blockFlag = false;
								}
								data.isOccupied = false ;	
								delete PLCSpace.currentProgramModel.labels[id];
								if(id.charAt(id.length-1)== "7"){
									PLCSpace.currentProgramModel.outputElement[data.parentObject._id] = 0
									} 
								
								if(type == "LBL"){
									data.parentObject.isLabelPresent = false;
								}
								if(type == "OLT"){
									PLCSpace.currentProgramModel.latchCount--;
								}else if(type == "OTU"){
									PLCSpace.currentProgramModel.unlatchCount--;
								}	
								for( i=0;i<PLCSpace.currentProgramModel._collection.length; i++){
									var elem = PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]
									if(!!elem)
									delete PLCSpace.currentProgramModel._collection[i].functionBlockObject[id];
								}			 		
					 		}
				}})
			}
		}
	}

	var contactContext = function(sel, id, data) {

		$.contextMenu({
			selector : sel,
			className : 'data-title',
			callback : function(key, options) {
				// based on callback we will going to call various function
				var m = "clicked: " + key;
				if (!(key == "quit"))
					optionObject[key](id, data);
				// window.console && console.log(m) || alert(m);
			},
			items : {
				
				"tag" : {
					name : "Tag",
					icon : "edit"
				},
				"toggle" : {
					name : "Toggle",
					icon : "edit"
				},
				"deleteb" : {
					name : "Delete",
					icon : "delete"
				},
				"sep1" : "---------",
				"quit" : {
					name : "Quit",
					icon : "quit"
				}
			}
		});
		$('.data-title').attr('data-menutitle', "Choose Option");

		$(sel).on('click', function(e) {
			//console.log('clicked', this);
		});
		var optionObject = {
			toggle : function() {
				if(PLCSpace.PLCEditorSpace.flagRun=1){
					PLCSpace.PLCEditorSpace.flagRun=0;
				}
				if(!PLCSpace.PLCEditorModel._collection[0].runmode)
				{
					alert("You can not toggle Input Contacts in Developement mode")
					return 0
				}
				if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(id.split("-")[1])) != -1){
						return 0		
				}
				var rungID = id.slice(4, 5);
				var instructionType;
				var x = id.slice(0, 3);
				var objTemp = data.parentObject.functionBlockObject[id];
				var label = objTemp._value.label;
				var status = objTemp.attr.type;
				
				if(id.slice(0,3)== 'OUT'){return 0 }
				var obj1 = {};
				
				
				var obj = PLCSpace.currentProgramModel.labels;
				/*
				 * following for-loop check whether current contact is referenced with o/p 
				 */
				for (var key in obj) {
						if(obj[key].type == 1 && (label == obj[key].label || label.split("_")[0] == obj[key].label)){
							if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) != -1){
								break;
							}else{
								alert("Reference with output can not be toggled")
								return 0;
							}
							
						}
						  
				}
				
				var i=0;
				for( i=0;i<PLCSpace.currentProgramModel._collection.length; i++){
					var elem = PLCSpace.currentProgramModel._collection[i].functionBlockObject[id];
					if(elem != undefined && elem._id == id ){
					break;	
					}
				}

				var toggledStatus ;
				
				
				if (x == 'OPN' ){
					
					for (var key in obj){
						if(label == obj[key].label && key.slice(0,3) == "CLS"){
							if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) != -1){
								 
							}
							else{
								collection1 =  PLCSpace.currentProgramModel._collection;
								for(var k = 0 ; k < collection1.length ; k++){
									var elem1 = PLCSpace.currentProgramModel._collection[k].functionBlockObject[key];
									if(elem1 != undefined && elem1._id == key ){
										if(status == 1){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/close_toggle.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 1;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 1;
										}else if(status == 0){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/close_normal.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 0;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 0;
										}
										
									}
								}
							}
							
						}else if(label == obj[key].label && key.slice(0,3) == "OPN"){
							if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) != -1){
								 
							}
							else{
								collection1 =  PLCSpace.currentProgramModel._collection;
								for(var k = 0 ; k < collection1.length ; k++){
									var elem1 = PLCSpace.currentProgramModel._collection[k].functionBlockObject[key];
									if(elem1 != undefined && elem1._id == id ){
										if(status == 1){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/open_normal.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 0;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 0;
										}else if(status == 0){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/open_toggle.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 1;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 1;
										}
										
										
									}
								}
							}
							
						}
					}
					if(status == 0){
						
						//PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/open_toggle.png"
						 objTemp._eleSet.attr("title", objTemp._value.label+" : "+1);
					}else{
						
						//PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/open_normal.png"
						 objTemp._eleSet.attr("title", objTemp._value.label+" : "+0); 
					}
					
					
				}
				else if(x == 'CLS'){
					for (var key in obj){
						if(label == obj[key].label && key.slice(0,3) == "OPN"){
							if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) != -1){
								 
							}
							else{
								collection1 =  PLCSpace.currentProgramModel._collection;
								for(var k = 0 ; k < collection1.length ; k++){
									var elem1 = PLCSpace.currentProgramModel._collection[k].functionBlockObject[key];
									if(elem1 != undefined && elem1._id == key ){
										if(status == 1){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/open_toggle.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 1;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 1;
										}else if(status == 0){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/open_normal.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 0;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 0;
										}
										
										
									}
								}
							}
							
						}else if(label == obj[key].label && key.slice(0,3) == "CLS"){
							if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) != -1){
								 
							}
							else{
								collection1 =  PLCSpace.currentProgramModel._collection;
								for(var k = 0 ; k < collection1.length ; k++){
									var elem1 = PLCSpace.currentProgramModel._collection[k].functionBlockObject[key];
									if(elem1 != undefined && elem1._id != id ){
										if(status == 1){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/close_normal.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 0;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 0;
										}else if(status == 0){
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key]._eleSet[0][0].href.baseVal  =  "../assert/img/close_toggle.png"
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].attr.type = 1;
											PLCSpace.currentProgramModel._collection[k].functionBlockObject[key].status = 1;
										}
										
										
									}
								}
							}
							
						}
					}
					if(status == 1){
						
						PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  =  "../assert/img/close_normal.png"
						 objTemp._eleSet.attr("title", objTemp._value.label+" : "+0);
					}else{
						
						PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  =  "../assert/img/close_toggle.png";
						 objTemp._eleSet.attr("title", objTemp._value.label+" : "+1);
					}
					
				}
				toggledStatus = status == 0 ? 1:0;
				objTemp.attr.type = toggledStatus;
				objTemp.status = toggledStatus;
				
				if(PLCSpace.PLCEditorSpace.isRun){
	    			
	    			  	PLCSpace.scanCycle.setStatusOfToggledObject({
	    			  		tagName :objTemp._value.label+"-"+x,
	    			  		status :toggledStatus,
	    			  		type : "contact"
	    			  	});
					}
				
			},
			tag : function() {
				if(!!PLCSpace.currentProgramModel.runmode)
				{
					alert("You can not add tag in Run mode")
					return 0
				}
				var rungID = id.slice(4,5);
				var paper = PLCSpace.currentProgramModel.paper;
				var objTemp = data.parentObject.functionBlockObject[id];
				var type = id.slice(0,3);
				if(type == 'OPN' || type == 'CLS' || type == 'OUT')
				{
					var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="label" value='+ objTemp._value.label +' class = "nospace" title = "Label for contact" /></div> ';
				}
				else
				{
					var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="label" value='+ objTemp._value.label +' /></div> ';
				}
					$.prompt(str,{
			 		focus: 1,
			 		 show:'slideDown',
			 		 persistent : false,
			 		buttons: {  Submit: true,Cancel: false },
			 		submit: function(e, v, m, f){
			 				if(v==false){return 0}
			 				
							if(type == 'OUT'){
								if(checkLabels(f.label,id)== 0) 
								return 0;
							}
			 				
			 				var obj = {};
			 				var t = objTemp.attr.label;
							t.attr("text" , f.label);
			 				/*
			 				 * following 3 lines push "id" to respective object of perticular label
			 				 */
							var presentObj = PLCSpace.currentProgramModel.lableSet;
							
							obj[f.label] = [id];
							PLCSpace.currentProgramModel.lableSet.push(obj);
							
							data.parentObject.functionBlockObject[id].attr.tagName = f.tagname;
							data.parentObject.functionBlockObject[id]._value.label = f.label;
							if(!!data.parentObject.ipblock){
								data.parentObject.functionBlockObject[data.parentObject.ipblock]._value.outputAdress = f.label;
							}
							transformString = data.parentObject._eleSet[0].transform();
							data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
							data.parentObject.functionBlockObject[id]._eleSet.attr("title", f.label+" : "+objTemp.attr.type);
							
							PLCSpace.currentProgramModel.labels[id].label = f.label;
							
										PLCSpace.dataStore.UpdateElementLable(
												PLCSpace.view.programID,
												objTemp._id,
												objTemp._value.label+"-"+type , f.tagname)
									}
								});
								$("#label").focus();
								$("#label").select();

			
			},
			deleteb : function(id,data) {
				if(!!PLCSpace.currentProgramModel.runmode){return 0}
					$.prompt("Do you want to delete an element? ",{
				 focus: 1,
				 show:'slideDown',
				 buttons: {  Confirm: true,Cancel: false },
				 submit: function(e, v, m, f){
				 	if(v==false){return 0}
				 	else{
					 		PLCSpace.dataStore.deleteElement(id,PLCSpace.view.programID);
							data.parentObject.functionBlockObject[id]._eleSet.remove();
							onLoop = data.parentObject._id.length >= 2 ? true : false;
							if (!!onLoop) {
								var temp = id[id.length - 1];
								data.parentObject.occupiedBlocks.sort();
								var arr = data.parentObject.occupiedBlocks; // [1,2,3,4]
								arr = arr.toString(); // 1,2,3,4
								arr = arr.split(",") // ["1","2","3","4"]
								var index = arr.indexOf(temp)
								data.parentObject.occupiedBlocks.splice(index, 1)
								if(data.parentObject.occupiedBlocks.length == 0){
									PLCSpace.currentProgramModel.runnableObject[data.parentObject._id] = 0;
								}
						
							}
							data.parentObject.blockOnRung = null;
							data.isOccupied = false;
							var str = data.id.toString()
	      					var onRung = (str.indexOf("-") == -1) ? true : false;
	      					if(!!onRung){
	      							data.parentObject.contactCount--;
	      					}
      					
				 	}
				delete PLCSpace.currentProgramModel.labels[id];
				if(!onLoop && id.charAt(id.length-1)== "7"){
					PLCSpace.currentProgramModel.outputElement[data.parentObject._id] = 0	
				}
				
				//delete PLCSpace.currentProgramModel.outputElement[id]
				PLCSpace.currentProgramModel.runnableObject[id]
				
				var loop = PLCSpace.currentProgramModel.loopObject;
     	 		for (var key in loop) {
					 //console.log(key)
					 for(var i = 0; i < loop[key].contactCounts.length ; i++)
					 {
					 	if(loop[key].contactCounts[i] == id)
					 	loop[key].contactCounts.splice(i,1);
					 }
					   	  
			}
			for( i=0;i<PLCSpace.currentProgramModel._collection.length; i++){
				var elem = PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]
				if(!!elem)
				delete PLCSpace.currentProgramModel._collection[i].functionBlockObject[id];
			}
			}})
			
				
			},
			
		}
	}

	
var getIDLength = function(id) {
		return parseInt(id.match(/[0-9]/g).length - 1);
	}
	var getRightMostChild = function(collection) {
		var pre_max = 0, obj;
		for ( var i = 0; i < collection.length; i++) {
			var max = collection[i].startCoordinate.x;
			if (max > pre_max) {
				obj = collection[i];
			} else {
				pre_max = max;
			}
		}
		return obj;
	}
	var instructionType = function(instructionId) {
		return instructionId in inputInstruction ? "INPUT" : instructionId in outputInstruction ? "OUTPUT" : "INSTRUCTION_TYPE_ERROR";
	}
	/*
	 * @Param x : stating x position on editor
	 * @Param y : starting y position on editor
	 * @param list : containing all rapheal object to be transformed
	 * @Param index : stating postion where we need to transformation
	 */
	var runMode = function() {
	var disabledRung = PLCSpace.currentProgramModel.disabledRung ;
	var isCompile = false
		var obj2 = PLCSpace.currentProgramModel.labels;
		for (var key in obj2) {
			  if(obj2[key].label == null ){
			  	if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) == -1){
			  		alert("Please label all the contacts/blocks");
			  		return 0;
			  	}
			  	
			  }
			}
		var obj1 = PLCSpace.currentProgramModel.outputElement;
			  for (var key in obj1) {
				  if (obj1.hasOwnProperty(key)) {
				  	
				  	if(obj1[key]== 0 && PLCSpace.currentProgramModel.lbl.indexOf(parseInt(key)) == -1 && PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key)) == -1){
				  		PLCSpace.currentProgramModel.runmodeFlag = false;
				  		break;
				  	}else{
				  		PLCSpace.currentProgramModel.runmodeFlag = true;
				  	}
				    
				  }
			}	
		/*
		var obj1 = PLCSpace.currentProgramModel.outputElement;
				  for (var key in obj1 ) {
					  if (obj1.hasOwnProperty(key)) {
													  if(obj1[key]== 0 ){
							  if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key)) == -1){
								  PLCSpace.currentProgramModel.runmodeFlag = false;
							  }
																						  }else{
							  PLCSpace.currentProgramModel.runmodeFlag = true;
						  }
												}
		}*/
		
		
		if(!PLCSpace.currentProgramModel.runmodeFlag){
							alert("Please place an output on rung-"+key);
							return 0 ;
		}
		
		/*
		var obj = PLCSpace.currentProgramModel.loopObject;
				  for (var key in obj) {
						   //console.log(key)
						   if(obj[key].length != obj[key].contactCounts.length){
							   alert("Empty loop is not allowed")
							   return 0;
						   }
												}*/
		if(PLCSpace.currentProgramModel.latchCount !== PLCSpace.currentProgramModel.unlatchCount){
			return 0;
		}
		 var p = PLCSpace.currentProgramModel.runnableObject;
		 for (var key in p) {
			  if (p.hasOwnProperty(key)) {
			  	
			  	if(p[key]== 0 && key.split("-")[0] == "LUP"){
			  		if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(key.split("-")[1])) == -1){
			  			PLCSpace.currentProgramModel.runmodeFlag = false;
			  			break;
			  		}
			  	}else{
			  		PLCSpace.currentProgramModel.runmodeFlag = true;
			  	}
			    
			  }
			}
		
		if(!PLCSpace.currentProgramModel.runmodeFlag){
			alert("Empty loop is present");
		}
		else{
			isCompile = true;
		}
	return isCompile;
	}
	var runState = function(){
		PLCSpace.currentProgramModel.runmode = true;
		//var paper = PLCSpace.currentProgramModel.paper;
		PLCSpace.currentProgramModel.runModeSet = PLCSpace.currentProgramModel.paper.set();
		
		for(var i=0;i<PLCSpace.PLCEditorModel._collection.length;i++){
			var paper = PLCSpace.PLCEditorModel._collection[i].paper;
			PLCSpace.currentProgramModel.runModeSet.push(paper.path("M 40 0 l 0 " + PLCSpace.PLCEditorModel._collection[i]._startingPoint[1] + "z"),
					paper.path("M 1135 0 l 0 " + PLCSpace.PLCEditorModel._collection[i]._startingPoint[1] + " z")
				).attr({
				stroke : '#73bc1e',//light-green
				'stroke-width' : 5,
				'fill-opacity' : 1
			})
		}
	}
	var normalMode = function() {
		
		
		PLCSpace.currentProgramModel.runmode = false;
		//PLCSpace.currentProgramModel.runModeSet.remove();
		for(var p=0 ;p<PLCSpace.currentProgramModel.runModeSet.length;p++){
			
			PLCSpace.currentProgramModel.runModeSet[p].remove();
		
		}
	for(var k =0 ; k < PLCSpace.PLCEditorModel._collection.length ; k++){
		   var PM = PLCSpace.PLCEditorModel._collection[k];
		   var collection = PM._collection;
		
		for( i=0;i<collection.length; i++){
				var obj = collection[i].functionBlockObject;
				for (var key in obj) {
					
					var type = key.split("-",key.length)[0];
					switch(type){
						case "OPN":
						
						  obj[key]._eleSet[0][0].href.baseVal  = "../assert/img/open_normal.png";
						  obj[key]._eleSet.attr("title",obj[key]._value.label+":"+0);
						  obj[key].attr.type = 0;
						  if(PLCSpace.scanCycle.inputImageTable[ obj[key]._value.label+"-"+type] != undefined)
						   PLCSpace.scanCycle.inputImageTable[ obj[key]._value.label+"-"+type].status = 0;
						 
						  break;
						case "CLS":
						
						   obj[key]._eleSet[0][0].href.baseVal = "../assert/img/close_toggle.png";
						   obj[key]._eleSet.attr("title",obj[key]._value.label+":"+1);
						    obj[key].attr.type = 1;
						    if(PLCSpace.scanCycle.inputImageTable[ obj[key]._value.label+"-"+type] != undefined)
						    PLCSpace.scanCycle.inputImageTable[ obj[key]._value.label+"-"+type].status = 1;
						  
						  break;
						case "OUT":
						
						   obj[key]._eleSet[0][0].href.baseVal =  "../assert/img/output.png";
						   obj[key]._eleSet.attr("title",obj[key]._value.label+":"+0)
						  
						  break;
						case "OLT":
						
						   obj[key]._eleSet[0][0].href.baseVal =   "../assert/img/latch.png";
						   obj[key]._eleSet.attr("title",obj[key]._value.label+":"+0)
						   PLCSpace.dataStore.setPreviousStatusDefault(obj[key]._id,key.split("-")[1],PLCSpace.view.programID)
						  
						  break;
						case "OTU":
						
						   obj[key]._eleSet[0][0].href.baseVal =  "../assert/img/unlatch.png";
						   obj[key]._eleSet.attr("title",obj[key]._value.label+":"+0)
						   PLCSpace.dataStore.setPreviousStatusDefault(obj[key]._id,key.split("-")[1],PLCSpace.view.programID)
						  
						  break;
						case "RTO":
						case "TOF":
						case "TON":
								obj[key]._eleSet[0][11][0].href.baseVal = "../assert/img/output.png";
							   obj[key]._eleSet[0][12][0].href.baseVal = "../assert/img/output.png";
							   obj[key]._eleSet[0][13][0].href.baseVal = "../assert/img/output.png";
							   obj[key].attr.acc.attr("text",0);
							  PLCSpace.dataStore.setPreviousStatusDefault(obj[key]._id,key.split("-")[1],PLCSpace.view.programID)
							 
							break;
						case "CTU":
						case "CTD":
						
							 obj[key]._eleSet[0][10][0].href.baseVal = "../assert/img/output.png";
							 obj[key]._eleSet[0][11][0].href.baseVal = "../assert/img/output.png";
							 obj[key].attr.acc.attr("text",0);
							 PLCSpace.dataStore.setPreviousStatusDefault(obj[key]._id,key.split("-")[1],PLCSpace.view.programID)
							
							break;
						case "RES":
						
							  obj[key]._eleSet[0][0].href.baseVal = "../assert/img/reset.png";
							  obj[key]._eleSet.attr("title",obj[key]._value.label+":"+0)
							
							 break;
						case "ADD":
						case "SUB": 
						case "MUL":
						case "DIV":
							obj[key].attr.valueResult.attr("text",0);
						break;
						case "SCL":
							obj[key].attr.valueRes.attr("text",0);
						break;
						case "SRT":
							obj[key].attr.outputValueText.attr("text",0);
						break;
						case "CPT":
							obj[key].attr.result.attr("text",0);
						break;
						case "MOV":
							obj[key]._eleSet[0][11].attr("text",0);
						break;
						case "PID":
						  obj[key].attr.result.attr("text",0);
						  break ;
						case "TOT":
						  obj[key].attr.outputValueText.attr("text",0);
						  
						 break;
						default:
							//console.log("wrong input");
						
					}
					
				}
			}
			}
		}
var showdata = function(jsonObj){
		//console.log("showdata")
		//console.log(jsonObj);
		var label = _.keys(jsonObj);
		var arr = new Array();
		var obj = PLCSpace.currentProgramModel.labels;
		
		var id; 
		var flag = 0;
			for(var i=0;i< PLCSpace.currentProgramModel.lableSet.length ; i++){				
				var keys = (_.keys(PLCSpace.currentProgramModel.lableSet[i]));				
				 if(_.indexOf(keys , label[label.length-1]) != -1){
				 	id =  PLCSpace.currentProgramModel.lableSet[i][label];
				 	setStatus(id,jsonObj[label], label);
				 	}
		}

	}
	
	var setStatus = function(id,s,label){
		var id = id.toString();
		if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(id.split("-")[1])) != -1){
				return 0		
		}
		
		var rungID = id.split("-",id.length)[1];
		var type = id.split("-",id.length)[0];
		var status = s;
		var i=0;
		var fbid = id.split("_")[0];
		var paper = PLCSpace.currentProgramModel.paper;
		for( i=0;i<PLCSpace.currentProgramModel._collection.length; i++){
			var elem = PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid]
			
			if(elem != undefined && elem._id == fbid ){
				//console.log("shwdata type "+type);
				//console.log("id : "+id);
				switch(type){
				case "OPN" : {	
								if(elem._value.label == label){
									if(status == 1.0) {
										PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/open_toggle.png";
										 PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+1);
									}else{
										PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/open_normal.png";
										PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+0);
									}
								}
								
									
							}break;
							
				case "CLS" : 	{
					if(elem._value.label == label){
						if( status == 0.0 ) {
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/close_toggle.png";
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+1);
							}else{
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/close_normal.png";
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+0);
							}
						}
						
					}
				break;
				
				case "OUT" : {
					 		if( status == 1.0 ){
					 			PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/output_toggle.png";
					 			PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+1);
					 		}else{
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/output.png";
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+0);
							}
						
				}break;
				case "ADD" : 
				case "SUB" : 
				case "MUL" : 
				case "DIV" :
				  {
					var t = PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid].attr.valueResult;
					t.attr("text" , status);
					t.attr("title" ,elem._value.label+":"+ status);	
				}break;
				case "SCL" :
				  {
					var t = PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid].attr.valueRes;
					t.attr("text" , status);
					t.attr("title" ,elem._value.label+":"+ status);	
				}break;
				case "SRT" :
				  {
					var t = PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid].attr.outputValueText;
					t.attr("text" , status);
					t.attr("title" ,elem._value.label+":"+ status);	
				}break;
				case "OLT" : {
							if( status == 1.0 ){
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/latch_toggle.png";
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+1);
							}else{
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/latch.png";
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+0);
							}
							
				}break;
				case "OTU" : {
							if( status == 1.0 ) {
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/unlatch_toggle.png"
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+1);
							}else{
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "../assert/img/unlatch.png";
								PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet.attr("title", PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._value.label+" : "+0);
						}
						
				}break;
				case "CTD" :
				case "CTU" : {
							
						 var lbl =label;
						 lbl  = lbl.toString();
						 lbl = lbl.split("_",lbl.length)[1];
						 if(lbl == 'cu' || lbl == 'cd'){
						 	if(status == 1.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][10][0].href.baseVal  = "../assert/img/output_toggle.png";
						 	}
						 	else if(status == 0.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][10][0].href.baseVal  = "../assert/img/output.png";
						}
						 }else if(lbl == 'dn'){
						 	if(status == 1.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][11][0].href.baseVal  = "../assert/img/output_toggle.png";
						 	}
						 	else if(status == 0.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][11][0].href.baseVal  = "../assert/img/output.png";
						 	}
						 }else if(lbl == 'acc'){
						 	
						 	var t = PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid].attr.acc;
							t.attr("text" ,s);
						 }
					}
				break;
				case "RTO":
				case "TOF":
				case "TON":{
					 var lbl =label
					 lbl  = lbl.toString();
					 lbl = lbl.split("_",lbl.length)[1];
					 if(lbl == 'en'){
						 if(status == 1.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][11][0].href.baseVal  = "../assert/img/output_toggle.png";
						 	}
						 	else if(status == 0.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][11][0].href.baseVal  = "../assert/img/output.png";
						}
					 }
					 else if(lbl == 'dn'){
						 if(status == 1.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][12][0].href.baseVal  = "../assert/img/output_toggle.png";
						 	}
						 	else if(status == 0.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][12][0].href.baseVal  = "../assert/img/output.png";
						}
					 }
					 else if(lbl == 'tt'){
						 if(status == 1.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][13][0].href.baseVal  = "../assert/img/output_toggle.png";
						 	}
						 	else if(status == 0.0){
						 		PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][13][0].href.baseVal  = "../assert/img/output.png";
						}
					 }
					 else if(lbl == 'acc'){
						 var t = PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid].attr.acc;
							t.attr("text" , s);
					 }
				}break;
				case "RES":{
					if(status == 1.0){
						PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal = "../assert/img/reset_toggle.png";
					}
					else if(status == 0.0){
						PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal = "../assert/img/reset.png";
					}
				}break;
				case "MOV":
					PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][11].attr("text",s);
					
				break;
				case "CPT":
					PLCSpace.currentProgramModel._collection[i].functionBlockObject[id]._eleSet[0][10].attr("text",s);
				break;
				case "PID":
					PLCSpace.currentProgramModel._collection[i].functionBlockObject[id].attr.result.attr("text",s);
				break;
				case"TOT":
				
				PLCSpace.currentProgramModel._collection[i].functionBlockObject[fbid].attr.outputValueText.attr("text",s);
				break;
				
			}
		}
	}
	
	}
	var checkLabels = function(label,id)
	{
		/*
		 * following for loop checks for labels of "output contacts" that are same
		*/
		var obj = PLCSpace.currentProgramModel.labels;
		for (var key in obj) {
				if(obj[key].type !=0 && (obj[key].label == label || label.split("_")[0] == obj[key].label) && key != id){
					alert("same label for output not allowed")
					return 0;
				}	   
				  
		}
	}
	var validate2  = function(str){
		if(str == "" || str == "?")
			return false;
	}
	var  validate = function(f){
		if(f.charAt(0).match(/[a-zA-Z]/g) == null)
			return false;
		else
			return true;
	}
	/*
	 * generates dynamic list in "select tag" for function-block configuration
	 * specifically for COMPARE block
	 */
	var createTagList =function(list,prevTag){
		var temp={"sel":"","data":{}};
		var val="";
		var htmlText='';
		map=list;
		htmlText='<option>None</option>';
		for(var i=0;i<map.length;i++){
			if(map[i]==prevTag)//to select previous selected tag by default
				{
				val="selected";
				}
			else{
				val="";
			}
			temp.sel=val;
			temp.data=map[i];
			htmlText+=tmpl("tmpl-mapping", temp);
			console.log(htmlText)
		}
			
			return htmlText;
	}	
	/*
	 Exposing system to outer world
	 */
	var transformRung = function(x, y, list, index) {
		
		if (typeof index == 'undefined') {
			list.transform("t " + x + " " + y);
		} else {
			for ( var i = index; i < list.length; i++)
				list[i].transform("t " + x + " " + y);
		}
	
	}
	return {
		flag1 : flag1,
		setInstructionId : setInstructionId,
		instructionId : instructionId,
		drawInstruction : drawInstruction,
		runMode : runMode,
		isRun : PLCSpace.currentProgramModel.runmode,
		showdata :showdata,
		normalMode : normalMode,	
		createProgramModel :createProgramModel,
		runState :runState,
		instructionObject : instructionObject,
		pidId : pidId,
		poc : poc,
		configureArithmeticBlocks : configureArithmeticBlocks,
		configureCPT : configureCPT,
		configureTimer : configureTimer,
		configureCounter : configureCounter,
		configureComparativeBlocks : configureComparativeBlocks,
		configureCMP : configureCMP,
		configureLIM : configureLIM,
		configureRES : configureRES,
		configureOLT : configureOLT,
		configureOTU : configureOTU,
		configureMOV : configureMOV,
		configureJMP : configureJMP,
		configureLBL : configureLBL,
		configurePID : configurePID,
		configureJSR : configureJSR,
		configureSBR : configureSBR,
		configureRET : configureRET
	}
})();
