
/**
 * Author : Priya
 * Generates an Instruction table (Equation , inputs ,outputs)
 **/

window.PLCSpace.InstructionTable = (function(){
	
	var generateInstructionTable = function(){
		var instructionTable = [];
		var programList = PLCSpace.jsonCode.plcCompileFormat.program;
		_.each(programList , function(program){
			var inputs = [] , outputs = [],equation = [];
			
			_.each(program , function(rungs){
				var equateObj = {};
				for(var i=0;i<rungs.length ; i++){
					var rung = rungs[i];
					_.each(rung.inputList , function(input){
						if(!!input)
						inputs.push(input);
					});					
					_.each(rung.outputList , function(output){
						if(!!output)
						outputs.push(output);
					});	
					equation.push({
						"equation" : rung.equation,
						"output" : rung.outputList[0] == undefined ? "" :rung.outputList[0].tagName ,
						"functionObject" : rung.rungFunctionBlock,
						"rungId" : i,
					});
				}	
			});
			instructionTable.push({
				"equation" : equation,
				"input" : inputs,
				"output"  :outputs,
			});
		});
		//console.log("program");
		//console.log(instructionTable);
		PLCSpace.InstructionTable.instructionTable = instructionTable;
		
	}
	return {
		generateInstructionTable : generateInstructionTable
	}
})();
