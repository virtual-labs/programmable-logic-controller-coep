PLCSpace.MODE = "";
PLCSpace.PLCJson = {};

/*Author : Sushil Medhe
 * TODO
 * handles various events on canvas objects
 */

PLCSpace.view = (function() {
	
	var $tab_title_input = $("#tab_title"), $tab_content_input = $("#tab_content");
	var tab_counter = 2;
	var programID = 0;
	var rung_cnt =0;
	var current_val;
	//PLCSpace.currentProgramModel._rungid = 0;
	var view = Backbone.View.extend({
		el : $("#plc-editor"),
		events : {			
			'click button#addRung' : 'createRung',
			'click button.buttons' : 'updateLadder',
			'click #compileMode' : 'compile',
			'click #runMode' : 'runMode',
			'click #developementMode' : 'normalMode',
			'click #savefile' : 'saveFile',
			'click #openfile' : 'openFile',
			'click .full-screen' : 'goFullscreen',
			//'click #download' : 'donwload',           
			'click #mousePointer' :   'getmouse',
			'click #fileOpn' :   'fileOpn',
			
		},
		fileOpn : function(){
			if (window.File && window.FileReader && window.FileList && window.Blob) {
			alert("File API supported.!");
			} else {
			alert("The File APIs are not fully supported in this browser.");
			}
		},
		getmouse : function(){
			$('.work-space').css("cursor","default");
		},
		initialize : function() {
		//	_.bindAll(this, 'createRung');
			this.render();
			PLCSpace.dataStore.CreateProgram(programID);
			current_val = "tabhead1";
			// var pm  =PLCSpace.PLCEditorSpace.createProgramModel();
			PLCSpace.pageView.initEditor("tabhead1",1197,120000,"Main",0);
		},
		_rungid : 0,
		render : function() {
			
			
			$('#runMode').bind('click', false);
			$('#developementMode').bind('click', false);
			//$('#savefile').bind('click', false);
			$("#PIDdialog").dialog({ autoOpen: false });
			//$( "#PIDdialog" ).dialog({ buttons: { "Ok": function() { $(this).dialog("close"); } } });
			$( "#innerPIDdialog" ).hide();
		    $( "#pControl" ).hide();
		    $( ".innerControls" ).hide();
		    $( "#typeset" ).hide();
		    $( "#PIDdialog" ).dialog({ width: 595,height: 530 });
			$('input:radio[name=mode]').click(function() {
			        var checkboxVal = $('input:radio[name=mode]:checked').val();
			        if(checkboxVal=="auto")
			        {
			            $( "#innerPIDdialog" ).show();
			            
			        }
			        if(checkboxVal=="manual")
			        {
			            
			            $( "#innerPIDdialog" ).hide();
			        }
    
   		 });
		    $("#configbtn").click(function() {
		        $( "#pControl" ).show();
		        var value = $('input:radio[name=mode3]:checked').val()
		        if(value == "p")
		        {
					$( "#innerpControl" ).show();
					$( "#innerpiControl" ).hide();
					$( "#innerpdControl" ).hide();
					$( "#innerpidControl" ).hide();
		        }
		        else if(value == "pi" )
		        {
		           $( "#innerpControl" ).hide();
					 $( "#innerpiControl" ).show();
					 $( "#innerpdControl" ).hide();
					 $( "#innerpidControl" ).hide();
		        }
		        else if(value == "pd" )
		        {
		            $( "#innerpControl" ).hide();
					 $( "#innerpiControl" ).hide();
					 $( "#innerpdControl" ).show();
					 $( "#innerpidControl" ).hide();
		        }
		        else if(value == "pid" )
		        {
		           $( "#innerpControl" ).hide();
					 $( "#innerpiControl" ).hide();
					 $( "#innerpdControl" ).hide();
					 $( "#innerpidControl" ).show();
		        }
		        
		    });
    
		    $('input:radio[name=mode2]').click(function() {
		        $( "#typeset" ).show();
		    });
		    
		    $('input:radio[name=mode3]').click(function() {
		        var value = $('input:radio[name=mode3]:checked').val();
		        if(value == "p")
		        {
		            $( "#typeset" ).hide();
		        }
		        else if(value == "pi" )
		        {
		            $( "#typeset" ).show();
		        }
		        else if(value == "pd" )
		        {
		            $( "#typeset" ).show();
		        }
		        else if(value == "pid" )
		        {
		            $( "#typeset" ).show();
		        }
		    });
		    
		    $(".submitbtn").click(function() {
			
		    	var pidObject = {};
		    	pidObject.mode = $('input:radio[name=mode]:checked').val();
		    	pidObject.action = $('input:radio[name=mode2]:checked').val();
		    	pidObject.control = $('input:radio[name=mode3]:checked').val();
		    	pidObject.type = $('input:radio[name=mode4]:checked').val();
		    	pidObject.setPiont = $(".SetPoint").val();
		    	pidObject.maxInput = $(".MaxInput").val();
		    	pidObject.minInput = $(".MinInput").val();
		    	pidObject.kp = $(".kp").val();
		    	pidObject.P0 = $(".Po").val();
				if($('input:radio[name=mode3]:checked').val()== 'p')
		    	{
		    		pidObject.setPiont = $("#p_SetPoint").val();
			    	pidObject.maxInput = $("#p_MaxInput").val();
			    	pidObject.minInput = $("#p_MinInput").val();
			    	pidObject.kp = $("#p_kp").val();
			    	pidObject.P0 = $("#p_Po").val();
		    	}
		    	else if($('input:radio[name=mode3]:checked').val()== 'pi')
		    	{
				pidObject.setPiont = $("#pi_SetPoint").val();
			    	pidObject.maxInput = $("#pi_MaxInput").val();
			    	pidObject.minInput = $("#pi_MinInput").val();
			    	pidObject.kp = $("#pi_kp").val();
			    	pidObject.P0 = $("#pi_Po").val();
		    		pidObject.ki = $("#pi_ki").val();
		    		pidObject.Time = $("#pi_time").val();
		    	}
		    	else if($('input:radio[name=mode3]:checked').val()== 'pd')
		    	{
		    		pidObject.setPoint = $("#pd_SetPoint").val();
			    	pidObject.maxInput = $("#pd_MaxInput").val();
			    	pidObject.minInput = $("#pd_MinInput").val();
			    	pidObject.kp = $("#pd_kp").val();
			    	pidObject.P0 = $("#pd_Po").val();
		    		pidObject.kd = $("#pd_kd").val();
		    		pidObject.Time = $("#pd_time").val();
		    	}
		    	else if($('input:radio[name=mode3]:checked').val()== 'pid')
		    	{
		    		pidObject.setPiont = $("#pid_SetPoint").val();
			    	pidObject.maxInput = $("#pid_MaxInput").val();
			    	pidObject.minInput = $("#pid_MinInput").val();
			    	pidObject.kp = $("#pid_kp").val();
			    	pidObject.P0 = $("#pid_Po").val();
		    		pidObject.ki = $("#pid_ki").val();
		    		pidObject.kd = $("#pid_kd").val();
		    		pidObject.Time = $("#pid_time").val();
		    	}
		    	//console.log(pidObject);
		    	pidObject.Input = PLCSpace.PLCEditorSpace.pidId.split("&")[4];
		    	pidObject.inputVal = PLCSpace.PLCEditorSpace.pidId.split("&")[1];
		    	pidObject.outputLbl = PLCSpace.PLCEditorSpace.pidId.split("&")[2];
		    	pidObject.label = PLCSpace.PLCEditorSpace.pidId.split("&")[3];
		    	pidObject.outputVal = 0;
		    	pidObject.intialControlOp = 50;   //initialControllerOutput
		    	pidObject.preE = 0;			//previousError
		    	var pidID = PLCSpace.PLCEditorSpace.pidId.split("&")[0];
		    	PLCSpace.sarvaGlobal[pidObject.label] = pidObject;
				
				//configure poc object
				var poc = PLCSpace.PLCEditorSpace.poc[pidID];
				poc.mode = pidObject.mode;
				poc.action = pidObject.action;
				poc.control = pidObject.control;
				poc.type = pidObject.type;
				poc.setPiont = pidObject.setPiont;
				poc.maxInput = pidObject.maxInput;
				poc.minInput = pidObject.minInput;
				poc.kp = pidObject.kp;
				poc.p0 = pidObject.P0;
				poc.ki = pidObject.ki;
				poc.kd = pidObject.kd;
				poc.Time = pidObject.Time;
				
		    	PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID,
												pidID,pidObject);
		    	PLCSpace.pidObject = pidObject ; 
		    	$("#PIDdialog").dialog('close');
		    	
		    });
		    
			//PLCSpace.PLCEditorSpace.initEditor("tabhead1",1080,120000,"Main");
			var self = this;
			$(document).live("keydown",function(e){
              	if(e.which == 46 ){
              		if(PLCSpace.pageView.loopflag == 0)
              			self.deleteElements();
              		
              	}
              })
               // DO not allow space
               $(".nospace").live("keypress", function(evt) {
			    	var charCode = (evt.which) ? evt.which : evt.keyCode;
			    	if(charCode == 32)
			     		return false;
			    		return true;
			   });
			   // Allow only numeric value...disable character on Edit menu textbox
			   $(".checkNumeric").live("keypress", function(evt) {
			    	var charCode = (evt.which) ? evt.which : evt.keyCode
			   		if(charCode > 31 && (charCode != 46 || $(this).val().indexOf('.') != -1) && (charCode < 48 || charCode > 57 ) &&  charCode != 45)
			     		return false;
			    	return true;
			   });
			

 
			 PLCSpace.MODE = "VIRTUAL";
			 
		},		
		addTab : function() {
			
			var tab_title = "New-Tab";
						$tabs.tabs("add", "#tabs-" + tab_counter, tab_title);
						tab_counter++;
						programID++;
			
		},
		removeTab : function() {
			/*
			var index = $("li", $tabs).index($(this).parent());
						$tabs.tabs("remove", index);
						programID--;*/
			
		},
		updateLadder : function(e){
			//first change cursor only when its on over canvas		
			var id = typeof e.target === 'undefined'? e : e.target.id;
			var url = "../assert/img/"+id+".cur";
			$(".work-space").css("cursor","url('"+url+"'),default");
			PLCSpace.PLCEditorSpace.setInstructionId(id);
		},
		saveFile : function(){
			PLCSpace.dataStore.save();
		},
		
		openFile : function(){	
				
			PLCSpace.utilView.openFile();
		},
		createRung : function(){
			////console.log(PLCSpace.view.programID)
			
			PLCSpace.pageView.createRung(PLCSpace.currentProgramModel._rungid);			
			
			PLCSpace.currentProgramModel._rungid++;
			
		},
		goFullscreen :function () {
		    var element = document.getElementById("player");
		    if (element.mozRequestFullScreen) {
		      element.mozRequestFullScreen();
		    } else if (element.webkitRequestFullScreen) {
		      element.webkitRequestFullScreen();
		   }
 		},
		compile : function(){
			if(PLCSpace.view.programID != 0){
				alert("Please go to main routine");
				return 0;
			}
			var isCompile = PLCSpace.PLCEditorSpace.runMode();
			if(isCompile){
				//console.log(PLCSpace.dataStore.programContainer.toJson());			
				////console.log("In compile");
				PLCSpace.dataStore.unProcessElements();
				PLCSpace.jsonCode.GenerateFormat();
				var mySubmitData = (PLCSpace.jsonCode.plcCompileFormat);
				//console.log(PLCSpace.PLCJson);
				console.log(JSON.stringify(PLCSpace.PLCJson));
				alert("Compiled Successfully...");
				$('#runMode').unbind('click');
			}else{
				alert(" Unsuccessfull  Compilation...");
			}
		},
		undo : function(){
			PLCSpace.utilView.undo();
		},
		redo : function(){
			PLCSpace.utilView.redo();
		},
		normalMode : function(){
			if(PLCSpace.view.programID != 0){
				alert("Please go to main routine");
				return 0;
			}
			
			PLCSpace.PLCEditorSpace.isRun = false;
			PLCSpace.PLCEditorSpace.flag1=1;
			PLCSpace.PLCEditorSpace.flagRun=0;
			PLCSpace.scanCycle.StopScanCycle();
			PLCSpace.PLCEditorSpace.normalMode();
			$('#compileMode').unbind('click');
			PLCSpace.dataStore.unProcessElements();
			PLCSpace.functionBlocks.RTOFlag=false;
			PLCSpace.functionBlocks.returnFlag = false;
			//PLCSpace.functionBlocks.flagAdd = 0;
			
		},
		runMode : function(){
		if(PLCSpace.view.programID != 0){
				alert("Please go to main routine");
				return 0;
			}
			PLCSpace.PLCEditorSpace.isRun = true;
			if(PLCSpace.PLCEditorSpace.flag1==1){
				PLCSpace.PLCEditorSpace.flagRun=1;
				PLCSpace.PLCEditorSpace.flag1=0;
			}
			
			PLCSpace.PLCEditorSpace.runState();
			PLCSpace.InstructionTable.generateInstructionTable();
			PLCSpace.scanCycle.ScanInstructionTable();
			$('#runMode').bind('click', false);	
			$('#compileMode').bind('click', false);	
			$('#developementMode').unbind('click');				
		},		
		deleteElements : function(){
			PLCSpace.pageView.loopflag = 1;
			PLCSpace.pageView.deleteElements();
			
		}
		
	});
	
	

//////////////////////////////////////////from bootstrap.../////////////////////////////////////////////////////////
	var pId =1;
	var ele, button_div = false;
	var count = 0, const2 = 2;
	var current_val;
	nice = $("body").niceScroll();
	$('.tab-list').find('dt').live('click', function(e) {
		current_val = $(this).data('tab');
		PLCSpace.currentProgramModel = PLCSpace.PLCEditorModel.getCollectionObject(current_val);
		$('.main-content div').hide();
		$('#' + current_val).show(); ele = $(this), link = ele.find('a').attr('href');
		ele.addClass('current').siblings('dt').removeClass('current');
		e.preventDefault();
		var pID = current_val.slice(7,current_val.length);
		PLCSpace.view.programID = pID -1;
		
	});
	$('.tab-list').find('dt>.img').live('click', function(e) {
		if(count > 1) {
			$(this).parent().hide();
			count = count - 1;
		}
	});
	 $("#Add-Tab").live('click',function(){
    	generateNewTab();
		
	
   });
	$('.basic').click(function() {
		if(button_div != false) {
			$('.' + button_div).hide();
			$('.basic >a').removeClass('current');
		}
		button_div = $(this).find('a').text();
		$('.' + button_div).show();
		$(this).find('a').addClass('current');
	});
	
	var generateNewTab = function(){
		//alert("newtab")
		count = count + 1;
		$("#Tab-list dt").removeClass('current');
		var htmlString = "<dt data-tab='tabhead" + const2 + "' class='current left'><span class='left-mask '><span></span></span><a class='text left'>Tab "+const2 +"</a><span class='img right'></span><span class='right-mask'><span></span></span></dt>";
		$("#Tab-list").append(htmlString);
		$('.main-content div').hide();
		var htmlString2 = "<div id='tabhead" + const2 + "' class='work-space left'>tab" + const2 + "</div>";
		$('.main-content').append(htmlString2);
		$("#tabhead" + const2 + "").show();

		var canvasid = "tabhead" + const2;
		PLCSpace.pageView.initEditor(canvasid,1197,120000,"Main",count);
		const2 = const2 + 1;
	};
	return {
		view : view,
		programID  :programID,
		generateNewTab : generateNewTab
	}
})();

