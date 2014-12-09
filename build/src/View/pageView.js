/*
 * Author : Sushil Medhe
 * TODO
 * 1.Create rung Object before that do any kind of transformation for end rung line
 * 2. Rung creationg at UI envolved creating small rectangle, line and loop contact point
 * 3. This also invlove handling event at this point for adding contact and loop
 * 4. All kind of svg element reside in eleset which is an paper.set()
 */
PLCSpace.pageView = (function() {
	
	PLCSpace.currentProgramModel = PLCSpace.PLCEditorSpace.createProgramModel();
	var loopflag = 0;
    
	var drawRung = function(id) {
    
    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
		var RungModel = {
			_id : id,
			_name : id,
			_collection : [],
			_eleSet : null,
			loopCount : 0,
			loops :{},
			statusCount : 0,
            contactCount : 0,
			isBlockPresent : false,//to check whether a Fblock is present on 1st position on rung 
			blockFlag : false,  //to check whether a Fblock is present on rung 
			isLabelPresent : false,
			ipblock : null,
			isDisabled:false,
			opblock : null,
			coordinate : {
				x : 0,
				y : 0
			},
			loopPointArray : [ {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			} ], // for checking number of loop on same point
			lastYCordinate : PLCSpace.currentProgramModel._startingPoint[1],
			functionBlockObject : {}
		}

        var // all local variable used for drawing element on paper and assigning UID for these element
        	loopCount = 0,
          contactEleCount = 0,
          loopEleCount = 0,
          x = PLCSpace.currentProgramModel._startingPoint[0],
          x2 = 0,
	      y = PLCSpace.currentProgramModel._startingPoint[1],
	     
		 paper = PLCSpace.currentProgramModel.paper;

		RungModel.coordinate.x = x;
		RungModel.coordinate.y = y;
		PLCSpace.currentProgramModel.rungDepth[id] = y;
		RungModel._eleSet = paper.set();

		transformRung(0, (y + 75), PLCSpace.currentProgramModel.eleset, 2); //will tranform "END" line only
		// to transfer rung

		var tranformRungObject = {
			coordinate : {
				x : x,
				y : y
			},
			rungUID : id,
			uiEleArray : [],
			deepestYCoordinate : 0
		}

		for ( var i = 0; i <= 16; i++) {
			if (!(i % 2 == 0)) {
				var data = { // Contactline
					id : RungModel._id,
					blockOnRung : contactEleCount++,
					coordinate : {
						x : 55 + (contactEleCount - 1) * 135,
						y : y
					},
					parentObject : RungModel,
					isOccupied : false,
					lastYCoordinate : RungModel.lastYCordinate + 50
				};
                x2 = x + 120;
                RungModel._eleSet.push(paper.path("m " + x + " " + y + " l 120 0").attr({
					stroke : '#35A6FF',
					'stroke-width' : 2
				}).data("id", data).click(function(e) {
					if(data.parentObject.isBlockPresent == false || this.attrs.x >= 905 ){
						if(data.parentObject.statusCount == 1){
							alert("Enable the rung...");
							return 0;
						}
                		PLCSpace.PLCEditorSpace.drawInstruction(this.data("id"));
                	}
					else{
						alert("not allowed")
						return 0 ;
					}
				}), paper.rect(x + 5, y - 15, 110, 30).attr({
					fill : 'white',
					stroke : 'white',
                    'stroke-width': 2
                }).toBack().data("id", data).click(function (e) {
                	
                	if(data.parentObject.isBlockPresent == false || this.attrs.x >= 905 ){
                		if(data.parentObject.statusCount == 1){
							alert("Enable the rung...");
							return 0;
						}
                		PLCSpace.PLCEditorSpace.drawInstruction(this.data("id"));
                	}
					else{
						alert("not allowed")
						return 0 ;
					}
                }));
            } else if ( !! (i % 2 == 0)) {				// Loopline
                var data = {
                    id: RungModel._id,
                    pointOnRung: loopEleCount++,
                    coordinate: {
                        x: 40 + (loopEleCount - 1) * 135,
                        y: y
                    },
                    parentObject: RungModel,
                    isLoopPlaced : false,
                    lastYCoordinate: RungModel.lastYCordinate + 50
                }
                x2 = x + 15;
                loopLineEle = paper.path("m " + x + " " + y + " l 15 0");
                loopLineEle.attr({
					stroke : '#35A6FF',
                    'stroke-width': 6
                }).data("id", data).click(function (e) { // for loop element
					
                    if (RungModel.loopPointArray[data.pointOnRung].right == null) {
	                    if(data.parentObject.isBlockPresent == false ){
	                		drawLoop(this.data("id"));
	                	}
						else{
							alert("not allowed");
							return 0 ;
						}
                        
                        
                    } else {
                        alert("sdf")
                    }
					
                }).hover(
					    function() {
					    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
					         this.g = this.glow({
					             color: "#3399FF",
					             width: 30
					         });
					     },
					    function() {
					    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
					         this.g.remove();
					    })			
                RungModel._eleSet.push(loopLineEle);
            }
            x = x2;
        }

		var rungName = paper.text(25, y, RungModel._name).attr({
			"font-size" : 18,
			fill : "#858585"
		}).dblclick(function(){
			/*
			 * follwing code used to disable/enable a rung
			 */
		if(!!PLCSpace.currentProgramModel.runmode){return 0}
			if(RungModel.statusCount == 0){
				
        					for(var i=0 ; i<RungModel._eleSet.length ; i++){
        	        			if(RungModel._eleSet[i].type == "path"){
        	        				RungModel._eleSet[i].attr({stroke : "#787878"}); //grey
        	        			}
        					}
        					getLoop(RungModel._collection,"#787878");
        					RungModel.isDisabled = true;
        					RungModel.statusCount ++;
        					PLCSpace.currentProgramModel.disabledRung.push(RungModel._id);
        				}
        				else if(RungModel.statusCount == 1){
        					
        					for(var i=0 ; i<RungModel._eleSet.length ; i++){
        	        			if(RungModel._eleSet[i].type == "path"){
        	        				RungModel._eleSet[i].attr({stroke : "#35A6FF "}); //green
        	        			}
        					}
        					getLoop(RungModel._collection,"#35A6FF");
        					RungModel.isDisabled = false;
        					RungModel.statusCount --;
        					PLCSpace.currentProgramModel.disabledRung.splice(PLCSpace.currentProgramModel.disabledRung.indexOf(RungModel._id),1);
        				
        				}
        				
        				PLCSpace.dataStore.SetDisableRungInRungModel(
         				 RungModel._id,
                    	 RungModel.isDisabled,
           				 PLCSpace.view.programID);
        });
		RungModel._eleSet.push(rungName);
		rungName.hover(function() {
			rungName.attr("title","double click to disable/enable the rung");	
		})
		var rungCoordinateObj = {
			x : PLCSpace.currentProgramModel._startingPoint[0],
			y : PLCSpace.currentProgramModel._startingPoint[1]
		}

		PLCSpace.currentProgramModel._startingPoint[1] = y + 150;
		Object.create(RungModel);
		PLCSpace.currentProgramModel._collection.push(RungModel);

		PLCSpace.currentProgramModel.rungCoordinateArray.push(rungCoordinateObj);

		tranformRungObject.uiEleArray.push(RungModel._eleSet);
		PLCSpace.currentProgramModel.globalEleSetObject.push(tranformRungObject);
        PLCSpace.currentProgramModel.runnableObject[id] = 0;
        
        PLCSpace.currentProgramModel.outputElement[data.parentObject._id] = 0;
        
        RungModel.type = 'rung';
		PLCSpace.currentProgramModel.undoStack.push(RungModel);
		PLCSpace.dataStore.InsertRungInRungModel({
            rungid : PLCSpace.currentProgramModel._rungid,
            name : "rung",
            loopid : 0,
            attr:{
            	isDisabled : RungModel.isDisabled,
            } },PLCSpace.view.programID);
              
		return RungModel;
	
	}
	
	var getLoop = function(collection,c){
		for(var i = 0 ; i < collection.length ;i++){
			for(var k=0 ; k < collection[i]._eleSet.length ; k++){
				if(collection[i]._eleSet[k].type == "path"){
	 				collection[i]._eleSet[k].attr({stroke : c}); //grey
	    		}
       		}
       		getLoop(collection[i]._collection,c)
       }
	}
	 /*
     * @Param container : HTML Element for creating Paper
     * @Param width : width for paper
     * @Param height : Height for paper
     * @Param programID : id for program mainly used for creating TAB
     * TODO
     * 1. Creating new rapheal object, 
     * 2. Creating new ProgramModel Object for one tab
     * 3. ProgramModel will contain eleset which consist of all ui element of SVG
     * 4. Adding this object to PLCEditor Main Object in _collection field 
     * */

    var initEditor = function (tabhead1, width, height,  name , pm) {
    	PLCSpace.currentProgramModel = PLCSpace.PLCEditorSpace.createProgramModel();
		//ProgramModel._id = "Program-" + programID;
		PLCSpace.currentProgramModel._id = tabhead1;
		
		
		
		
        var paper = new Raphael(document.getElementById(tabhead1), width, height);
       	PLCSpace.currentProgramModel.paper = paper;
        PLCSpace.currentCanvas[tabhead1] = PLCSpace.currentProgramModel.paper; // store canvas for tab selection
		PLCSpace.currentProgramModel.eleset = paper.set();
        PLCSpace.currentProgramModel.eleset.push(paper.path("M 40 0 l 0 " + height + " z"), //left Border
        paper.path("M " + (width - 62) + " 0 l 0 " + height + " z"), // right border
        paper.path("M 40 20 l 872 0"), paper.path("M 937 20 l 198 0")).attr({
            stroke: '#35A6FF',
            'stroke-width': 2
        })
        PLCSpace.currentProgramModel.eleset.push(paper.text(925, 19, "-- END --")).attr({
            'font-siz': 22,
            stroke: '#35A6FF'
        });
        Object.create(PLCSpace.currentProgramModel);
        PLCSpace.PLCEditorModel._collection.push(PLCSpace.currentProgramModel);
        Object.seal(PLCSpace.PLCEditorModel);
        PLCSpace.dataStore.CreateProgram(pm);
        PLCSpace.view.programID  = pm;
        //console.log(PLCSpace.view.programID+ " program initiated");
     
    };
    /*
     * @param : Object data which consist of various option to draw a loop on any contact
     * TODO : 
     * 1. create loop line with extend button
     * 2. Create the object with various method used for genrating loop and reduction of loop
     * 3. translation also taking place here
     */

	var drawLoop = function(data) {
		if(data.parentObject.statusCount == 1){
			
			return 0;
		}
		if(data.id.length != undefined && PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(data.id.split("-")[1])) != -1){
				return 0		
		}
		
    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
		
    	if(data.pointOnRung == 7 || data.pointOnRung == 8 || data.isLoopPlaced == true)
    	{
			alert("Not allowed.You can't draw loop here");
			return 0;
    	}
    	/*
    	 * follwing code checks whether we r trying to palce
    	 * loop inside another loop
    	 */
    	var parent = data.parentObject._collection;
    	for( var k = 0;k <= (parent.length-1) ;k++)
    	{
    		
    		var val = $.inArray(data.pointOnRung,parent[k].occupiedPoint)=== -1 ? false : true;
    		if(parent[k]._loopPointOnRung == data.pointOnRung){val = false}
    		if(!!val){
    			alert("Not allowed");
    			return 0;
    		}
		}
		data.id = generateID(data.id);
    	var transformFlag = false;
    	var paper = PLCSpace.currentProgramModel.paper,
      	parentObj = data.parentObject,
        	loopObj = {
              _id: "LUP-"+data.id + "-" + parseInt(data.parentObject._collection.length),
			_parentId : data.id,
			_collection : [],
			_loopPointOnRung : data.pointOnRung,
			_startPointOfLoop : data.pointOnRung,
			_eleSet : paper.set(),
			_parentObject : data.parentObject,
			blockOnRung : null,
			isBlockPresent : data.parentObject.isBlockPresent,
			coordinate : {
				x : data.coordinate.x,
				y : data.coordinate.y
			},
			startCoordinate : {
				x : data.coordinate.x,
				y : data.coordinate.y
			},
			loopExpandArray : [],
			transformString : "",
			loopPointArray : [ {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			}, {
				left : null,
				right : null
			} ],
			occupiedPoint : [],
              data : data,
			occupiedBlocks : [],
			loopValue : [],
			loops :{},
			lastYCoordinate : data.lastYCoordinate,
			rightMostChild : null,
			isParent : false,      //checks whether current loop is parent ot any other loop 
			expandIcon : {
				x : data.coordinate.x + 20,
				y : data.coordinate.y + 25,
				_plusBtn : null,
				_lastContact : null
			},
			reduceIcon : {
				x : data.coordinate.x - 20,
				y : data.coordinate.y + 25,
				_minusBtn : null,
				_lastContact : null
			},
			functionBlockObject : {}
          };
		 var str = data.id.toString();
	    var onRung = (str.indexOf("-") == -1) ? true : false;
	    if(!onRung) {
	    	data.parentObject.isParent = true ;
	    }
		if(data.id.length > 1)
		{
			var rungID = data.id;
			var n = rungID.indexOf("-")
			rungID = parseInt(rungID.slice(0,n));
			
		}
		else
		{
			 var rungID = data.id;
		}
      loopObj._eleSet.push(paper.path("m " + (data.coordinate.x + 13) + " " + data.coordinate.y + "l 0 50")).attr({
			stroke : '#35A6FF',
          'stroke-width': 4
      }).click(function (e) {
			PLCSpace.currentProgramModel.deleteOption = "loop";
        	PLCSpace.currentProgramModel.loopTodelete = loopObj;
        	
        	//console.log(parentObj.loopPointArray[data.pointOnRung].right )
        }).hover(
					    function() {
					    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
					         this.g = this.glow({
					             color: "#3399FF",
					             width: 30
					         });
					     },
					    function() {
					    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
					         this.g.remove();
					    });
	
	/*
	 * following 3 lines checks depth of a current rung Vs level of a current loop
	 */
      if(PLCSpace.currentProgramModel.rungDepth[rungID] < data.lastYCoordinate)
      {
      	PLCSpace.currentProgramModel.rungDepth[rungID] = data.lastYCoordinate ;
      	PLCSpace.currentProgramModel._startingPoint[1] += 50;
      }
      else
      {
      	transformFlag  = true;
      }	
		Object.create(loopObj);

      if (parentObj.loopPointArray[data.pointOnRung].left) {
          //parentObj.loopPointArray[data.pointOnRung].left.expand._plusBtn.remove();
      }

		drawExpandButton(loopObj, parentObj);

		data.parentObject.loopPointArray[data.pointOnRung].right = {
			expand : loopObj.expandIcon,
			reduce : loopObj.reduceIcon
		};

		data.parentObject._collection.push(loopObj);

      //var onRung = (data.id.toString().length <= 1) ? true : false;
     
      
		if (onRung) {
      		data.parentObject.loopCount ++;
          PLCSpace.currentProgramModel.globalEleSetObject[data.id].uiEleArray.push(loopObj._eleSet);
          PLCSpace.currentProgramModel.globalEleSetObject[data.id].deepestYCoordinate = loopObj.lastYCoordinate
      } else {
          PLCSpace.currentProgramModel.globalEleSetObject[rungID].uiEleArray.push(loopObj._eleSet);
          PLCSpace.currentProgramModel.globalEleSetObject[rungID].deepestYCoordinate = loopObj.lastYCoordinate;
         //ProgramModel._startingPoint[1] += 50;
      }
     /* 
      }*/
      loopObj.transformString = loopObj._parentObject._eleSet[0].transform();
      loopObj._eleSet.transform(loopObj.transformString);

		if (getLastValueOfID(loopObj._id) === 0) {

			var transformString = PLCSpace.currentProgramModel.eleset[2].transform();
         transformString[0][2] += 50 ;
         if(!transformFlag)
         {
         	transformRung(0,transformString[0][2] , PLCSpace.currentProgramModel.eleset, 2)//will tranform "END" line only
         }
         
			var nextRungID = rungID + 1;

         // ProgramModel.globalEleSetObject[nextRungID] means next rungline exactly after the rungline on which loop is placed
          

          if (!(typeof PLCSpace.currentProgramModel.globalEleSetObject[nextRungID] == 'undefined') && !transformFlag) {
				for ( var i = nextRungID; i < PLCSpace.currentProgramModel.globalEleSetObject.length; i++) {
					for ( var j = 0; j < PLCSpace.currentProgramModel.globalEleSetObject[i].uiEleArray.length; j++) {
                  		
						
						var original = PLCSpace.currentProgramModel.globalEleSetObject[i].coordinate.y;
                  		var modified = PLCSpace.currentProgramModel.globalEleSetObject[i].uiEleArray[j][0].matrix.y(PLCSpace.currentProgramModel.globalEleSetObject[i].coordinate.x, PLCSpace.currentProgramModel.globalEleSetObject[i].coordinate.y)
                  		if(original == modified)
                  		{
                  			PLCSpace.currentProgramModel.globalEleSetObject[i].uiEleArray[j].transform("t 0 50");
                  		}
                  		else 
                  		{
                  			PLCSpace.currentProgramModel.globalEleSetObject[i].uiEleArray[j].transform("t 0 " + ((modified - original) + 50) + "");
                  		}
                     
                      
                  }
              }
          }
         
      }
      
		loopObj.occupiedPoint.push(data.pointOnRung);
		data.isLoopPlaced = true;
		PLCSpace.currentProgramModel._collection.push(loopObj);
      	PLCSpace.currentProgramModel.runnableObject[loopObj._id] = 0;
      	loopObj.type = 'loop';
     	PLCSpace.currentProgramModel.undoStack.push(loopObj);
		/*
		 * following code creates empty "PLCSpace.currentProgramModel.loopObject"
		 */
		PLCSpace.currentProgramModel.loopObject[loopObj._id] = {
			id : loopObj._id,
			points : loopObj.occupiedPoint,
			length : 0,
			contactCounts : []
			
		}
		
		loopObj._parentObject.loops[loopObj._id]={
			points : loopObj.occupiedPoint
		}
		PLCSpace.dataStore.InsertLoop({
			rungid : rungID,
			loopid : loopObj._id,
			startPositionOfLoop: data.pointOnRung,
			endPositionOfLoop : data.pointOnRung,
			coordinate :{
				x:data.coordinate.x,
				y:data.coordinate.y
			}
		}, PLCSpace.view.programID);
		return loopObj;
	
	}
	var generateID = function(id){
		
		if(id.length >= 7 )
		{
			id = id.substring(4,id.length)
		}
		// console.log(" ID: "+id)
		return id;
	
	};
	var getLastValueOfID = function(id) {
		return parseInt(id.toString().charAt(id.length - 1));
	}
	var drawReduceButton = function (loopObject, parentObj) {
	    	
    	//console.log(loopObject)
	    var paper = PLCSpace.currentProgramModel.paper,
	        data = {
	            data: loopObject
	        },
	        x = loopObject.reduceIcon.x - 25,
	        y = loopObject.reduceIcon.y;
	
	    var minusBtn = paper.text(x, y, "-").attr({
	        "font-size": 18,
	        fill: "#151515",
			"title":"click to reduce loop"
	    }).data("id", data).click(function (e) {
	    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
	        loopReduce(loopObject, parentObj);
	    });
	
	    minusBtn.transform(loopObject.transformString);
	    loopObject.reduceIcon._minusBtn = minusBtn;
	    loopObject._eleSet.push(minusBtn);
    
	    }
    var drawExpandButton = function (loopObject, parentObject) {
         var paper = PLCSpace.currentProgramModel.paper,
            data = {
                data: loopObject
            },
            x = loopObject.expandIcon.x,
            y = loopObject.expandIcon.y;

        var plusBtn = paper.text(x, y, "+").attr({
            "font-size": 18,
            fill: "#151515",
			"title":"click to expand loop"
			
        }).data("id", data).click(function (e) {
        	if(!!PLCSpace.currentProgramModel.runmode){return 0}
              PLCSpace.pageView.expandLoop(loopObject, parentObject);
        });

		plusBtn.transform(loopObject.transformString);

		loopObject.expandIcon._plusBtn = plusBtn;
		loopObject.expandIcon.x = x;
		loopObject.expandIcon.y = y;
		loopObject._eleSet.push(plusBtn);
	}

	   /*
     *@Param : complete loop object
     * TODO:
     * 1. Create 1 bottom loop line 
     * 2. Check for last loop point if its 9 than no expand 
     * 3. create loop reduce button 
     * 4. Check weather for expanding loop next Left is empty or not
     * 5. Expand Loop by one point and Fill Next Left and After Second Expand on same loop Fill current Right and Next Left
     * */

	
	   var expandLoop = function (loopObj, parentObject) {
   		if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(loopObj._id.split("-")[1])) != -1){
				return 0		
		}
    		var paper = PLCSpace.currentProgramModel.paper,
			x = loopObj.coordinate.x,
			y = loopObj.coordinate.y + 50,
			nextRightEle = true,
			//onRung = loopObj._id.length <= 7 ? true : false,
			loopCheckingFlag, loopEleCount = loopObj._loopPointOnRung;
			contactEleCount = loopObj._loopPointOnRung ;
			loopObj.expandIcon._plusBtn.remove();
		
		str = generateID( parentObject._id);	
		var str = str.toString();
		var onRung = (str.indexOf("-") == -1) ? true : false;
		
		
      if (!(typeof loopObj.reduceIcon._minusBtn == 'undefined' || loopObj.reduceIcon._minusBtn == null)) {
        loopObj.reduceIcon._minusBtn.remove();
      } else 
      	nextRightEle = false;

		if (onRung) {
	      loopCheckingFlag = nextRightEle ? (loopObj._loopPointOnRung == 7 || parentObject.loopPointArray[loopObj._loopPointOnRung + 1].left != null || parentObject.loopPointArray[loopObj._loopPointOnRung].right != null) : (loopObj._loopPointOnRung == 8 || parentObject.loopPointArray[loopObj._loopPointOnRung + 1].left != null);
	      
      } else {
	    findEle = jQuery.inArray(loopObj._loopPointOnRung + 1, parentObject.occupiedPoint) === -1 ? false : true;
      	loopCheckingFlag = nextRightEle ? (loopObj._loopPointOnRung == 7 || parentObject.loopPointArray[loopObj._loopPointOnRung + 1].left != null || parentObject.loopPointArray[loopObj._loopPointOnRung].right != null || !findEle) : (loopObj._loopPointOnRung == 8 || parentObject.loopPointArray[loopObj._loopPointOnRung + 1].left != null || !findEle);

      	findEle = jQuery.inArray(loopObj._loopPointOnRung + 1, parentObject.occupiedPoint) === -1 ? false : true;
      	if (!findEle) {
      		drawExpandButton(loopObj, parentObject);
	       	drawReduceButton(loopObj, parentObject);
	        alert("not allowed")
	        return 0;
     		}
     }

		if (nextRightEle) {

			parentObject.loopPointArray[loopObj._loopPointOnRung].right = {};
		}

		if (loopCheckingFlag) {
			 drawReduceButton(loopObj, parentObject)
			alert("Can't expand loop !!")
		} else {
			if (!(typeof loopObj.expandIcon._lastContact == 'undefined' || loopObj.expandIcon._lastContact == null)) {

				loopObj.expandIcon._lastContact.remove();
				var lastEle = loopObj.loopExpandArray[loopObj.loopExpandArray.length - 1];

				if (!(typeof lastEle == 'undefined')) {
					var lst = lastEle.pop();
					lst.remove();
				}
			}
        var contactArray = [],
        	transformString = loopObj._parentObject._eleSet[0].transform();

			for ( var i = 0; i < 2; i++) {
				if (i % 2 == 0) {
					var data = {
						id : loopObj._id,
						pointOnRung : loopEleCount++,
						coordinate : {
							x : 40 + (loopEleCount - 1) * 135,
							y : y
						},
						isLoopPlaced : false,
						parentObject : loopObj,
						lastYCoordinate : loopObj.lastYCoordinate + 50
					}
	            var smallPoint = paper.path("m " + x + " " + y + " l 15 0").attr({
								stroke : '#35A6FF',
								'stroke-width' : 6
							}).data("id", data).click(function(e) {
								drawLoop(this.data("id"));
	         		/*if (!loopObj.loopPointArray[data.pointOnRung].right) {
	                    drawLoop(this.data("id"));
	                } else {
	                    // write message 
	                }*/
	            }).hover(
					    function() {
					    	if(!!PLCSpace.currentProgramModel.runmode){return 0}
								this.g = this.glow({
									color : "#3399FF",
									width : 30
								});
							},

							function() {
					     	if(!!PLCSpace.currentProgramModel.runmode){return 0}
								this.g.remove();
							});
					smallPoint.transform(loopObj.transformString);
					loopObj._eleSet.push(smallPoint);
					contactArray.push(smallPoint);
					x = x + 15;

				} else if (!(i % 2 == 0)) {
					var data = {
						id : loopObj._id,
						blockOnRung : contactEleCount++,
						coordinate : {
							x : 55 + (contactEleCount - 1) * 135,
							y : y
						},
						parentObject : loopObj,
						isOccupied : false
					// lastYCoordinate : RungModel.lastYCordinate + 50
					};
							var bottomLine = paper.path("m " + x + " " + y + " l 120 0").attr({
							stroke : '#35A6FF',
							    'stroke-width': 2
							}).data("id", data).click(function (e) {
								
								if(PLCSpace.PLCEditorSpace.instructionId == "openContact" || PLCSpace.PLCEditorSpace.instructionId == "closeContact")
								{
									if(!data.parentObject.isBlockPresent){
										PLCSpace.PLCEditorSpace.drawInstruction(this.data("id"));
									}else{
										alert("not allowed")
										return 0;
									}
									
								}
								else if(PLCSpace.PLCEditorSpace.instructionId != "addRung" && PLCSpace.PLCEditorSpace.instructionId != "mousePointer")
								{
											alert("Not allowed.You can't place Functional block here !!!");
											return 0;
										}
								});
							var rect = paper.rect(x + 5, y - 15, 110, 30).attr({
								fill : 'white',
								stroke : 'white',
								'stroke-width' : 2
							}).toBack().data("id", data).click(function (e) {
								
								if(PLCSpace.PLCEditorSpace.instructionId == "openContact" || PLCSpace.PLCEditorSpace.instructionId == "closeContact")
								{
											if (!data.parentObject.isBlockPresent) {
												PLCSpace.PLCEditorSpace.drawInstruction(this.data("id"));
											} else {
												alert("not allowed")
												return 0;
											}
								}
								else if(PLCSpace.PLCEditorSpace.instructionId != "addRung" && PLCSpace.PLCEditorSpace.instructionId != "mousePointer")
								{
									alert("Not allowed.You can't place Functional block here !!!");
									return 0;
								}
								
							})
							
							bottomLine.transform(loopObj.transformString);
							rect.transform(loopObj.transformString);
							contactArray.push(bottomLine);
							contactArray.push(rect);
							loopObj._eleSet.push(bottomLine, rect);
							x = x + 120;
          	}
         }
         
				var lastLine = paper.path("m " + (x+2) + " " + (y+1) + " l  0 -50").attr({
				stroke : '#35A6FF',
				    'stroke-width': 4
				}).data("id", "loop").click(function (e) {
				    // calling another loop on this
				});
				
				contactArray.push(lastLine);
				loopObj.expandIcon._lastContact = lastLine;
				loopObj.loopExpandArray.push(contactArray);
				loopObj._eleSet.push(lastLine);
				
				loopObj.coordinate.x = x ;
				loopObj.coordinate.y = y - 50;
				
				loopObj.expandIcon.x = x + 7;
				loopObj.expandIcon.y = y - 25;
				
				loopObj.reduceIcon.x = x + 17;
				loopObj.reduceIcon.y = y - 25;
				
				loopObj._loopPointOnRung = loopObj._loopPointOnRung + 1;
				
				parentObject.loopPointArray[loopObj._loopPointOnRung].left = {
				    expand: loopObj.expandIcon,
				    reduce: loopObj.reduceIcon
				};
				
				drawExpandButton(loopObj, parentObject);
				
				if (!(loopObj._loopPointOnRung == loopObj._startPointOfLoop)) 
					drawReduceButton(loopObj, parentObject);
					
				//to tranform leftlne with both icons
				
				lastLine.transformString = loopObj._parentObject._eleSet[0].transform();
				loopObj._eleSet.transform(lastLine.transformString);
				
				loopObj.occupiedPoint.push(loopObj._loopPointOnRung);
				PLCSpace.currentProgramModel._collection.push(loopObj)
				
				//console.log(loopObj.occupiedPoint)
				var arr = loopObj.occupiedPoint;
				var obj =  parentObject.functionBlockObject;
				for (var key in obj) {
				    if(obj[key].position >= arr[0] && obj[key].position < arr[arr.length-1])
				    {
				    	parentObject.functionBlockObject[key].inloop = loopObj._id.charAt( loopObj._id.length-1)
				    	PLCSpace.dataStore.updateInLoopStatus(PLCSpace.view.programID,key, parentObject.functionBlockObject[key].inloop)
				    	
				    }
				  
				}
    			
      }
      parentObject.loops[loopObj._id]={
			points : loopObj.occupiedPoint
		}
      /*
       * following code used for updating " PLCSpace.currentProgramModel.loopObject" after expanding loop
       */
      var loop = PLCSpace.currentProgramModel.loopObject[loopObj._id];
      loop.length++;
      loop.points  = loopObj.occupiedPoint;
      var obj = loopObj._parentObject.functionBlockObject;
      var arr = loopObj.occupiedPoint;
      for (var key in obj) {
				   //console.log(obj[key].position)
				   if(obj[key].position >= arr[0] && obj[key].position < arr[arr.length-1])
				    {
				    	if($.inArray(key,loop.contactCounts) == '-1')
				    	loop.contactCounts.push(key);
				    }
				  
				}
		
      //console.log(PLCSpace.currentProgramModel.loopObject[loopObj._id])
      loopObj.status = 1;
      PLCSpace.currentProgramModel.undoStack.push(loopObj);
      
      //update loop in datastore
      PLCSpace.dataStore.updateLoop(PLCSpace.view.programID,loopObj._id,1);
    
   }
	   
		/*
	     *@Param 1: current Loop Object
	     * @Param 2: Parent Loop Object 
	     * TODO:
	     * 1. Reduce Loop line by 1 Point 
	     * 2. Check weather child has not taken all avaiable place of parenl loop 
	     * 3. create loop reduce button 
	     * 4. While reducing pop element from occupied array pop element loopExapand array to remove UI elemnt from eleSet
	    */

	var loopReduce = function(loopObj, parentObj) {
		if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(loopObj._id.split("-")[1])) != -1){
					return 0		
		}
		var last_position = loopObj.occupiedPoint[loopObj.occupiedPoint.length - 1]
		loopObj.occupiedBlocks.sort();
		if(((last_position) - (loopObj.occupiedBlocks[loopObj.occupiedBlocks.length -1])) == 1 )
		{
			alert("Not allowed.First delete input contact !!");
			return 0;
		}   
    	var paper = PLCSpace.currentProgramModel.paper,
	 	contactArray = loopObj.loopExpandArray.pop(),
		        x = loopObj.coordinate.x - 120,
			    y = loopObj.coordinate.y,
				rightMostChild = loopObj._collection[loopObj._collection.length - 1];
                
      if(!!!(typeof rightMostChild == 'undefined')){
        if(rightMostChild.occupiedPoint[rightMostChild.occupiedPoint.length - 1] === loopObj.occupiedPoint[loopObj.occupiedPoint.length -1]){
        	alert("not allowed");
        	loopObj.loopExpandArray.push(contactArray)
        	return 0;
      	}
      }
            
      loopObj.occupiedPoint.pop();

		for ( var i = 0; i < contactArray.length; i++) {
			contactArray[i].remove();
		}

		parentObj.loopPointArray[loopObj._loopPointOnRung].left = null;
		loopObj._loopPointOnRung = loopObj._loopPointOnRung - 1;
		parentObj.loopPointArray[loopObj._loopPointOnRung].right = null

		loopObj.reduceIcon._minusBtn.remove();
		loopObj.expandIcon._plusBtn.remove();

		loopObj.coordinate.x = x - 15;
		loopObj.coordinate.y = y;

		loopObj.expandIcon.x = x - 5;
		loopObj.expandIcon.y = y + 25;

		loopObj.reduceIcon.x = x + 5;
		loopObj.reduceIcon.y = y + 25;

      if (!(loopObj._loopPointOnRung == loopObj._startPointOfLoop)) {
        drawReduceButton(loopObj, parentObj);
        drawExpandButton(loopObj, parentObj);
        var lastLine = paper.path("m " + (x - 13) + " " + (y + 1) + " l  0 50").attr({
				stroke : '#35A6FF',
				'stroke-width' : 4
			}).data("id", "loop").click(function(e) {
				// calling another loop on this
			});
			loopObj._eleSet.push(lastLine);

			// to tranform leftlne with both icons

		lastLine.transformString = loopObj._parentObject._eleSet[0].transform();
		loopObj._eleSet.transform(lastLine.transformString);
       
        
      } else {
        loopObj.expandIcon.x = x + 5;
        loopObj.expandIcon.y = y + 25;
        drawExpandButton(loopObj, parentObj);
        loopObj.reduceIcon._minusBtn = null;
      }
        
      if (!(typeof loopObj.loopExpandArray[loopObj.loopExpandArray.length - 1] == 'undefined')) {
        loopObj.loopExpandArray[loopObj.loopExpandArray.length - 1].push(lastLine);
        loopObj.expandIcon._lastContact = lastLine;
      }
      PLCSpace.currentProgramModel._collection.push(loopObj)
    	var arr = loopObj.occupiedPoint;
		var obj =  parentObj.functionBlockObject;
			for (var key in obj) {
				    if(arr[arr.length-1] == obj[key].position && obj[key].inloop == loopObj._id.charAt( loopObj._id.length-1))
				    {
				    	parentObj.functionBlockObject[key].inloop = -1 ;
				    	PLCSpace.dataStore.updateInLoopStatus(PLCSpace.view.programID,key, parentObj.functionBlockObject[key].inloop)
				    }
				  
				}
				parentObj.loops[loopObj._id]={
					points : loopObj.occupiedPoint
				}
			/*
	       	* following code used for updating " PLCSpace.currentProgramModel.loopObject" after expanding loop
	       */	
		var loop = PLCSpace.currentProgramModel.loopObject[loopObj._id];
      loop.length--;
      loop.points  = loopObj.occupiedPoint;
      var obj = loopObj._parentObject.functionBlockObject;
      var arr = loopObj.occupiedPoint;
      for (var key in obj) {
				   //console.log(obj[key].position)
				   if(obj[key].position < arr[0] || obj[key].position >= arr[arr.length-1])
				    {
				    	if($.inArray(key,loop.contactCounts) != -1)
				    	var index = loop.contactCounts.indexOf(key);
				    	loop.contactCounts.splice(index,1);
				    }
				  
				}
		
      //console.log(PLCSpace.currentProgramModel.loopObject[loopObj._id])		
		loopObj.status = -1;
		PLCSpace.currentProgramModel.undoStack.push(loopObj);
    
	    }
		
		var transformRung = function(x, y, list, index) {
			
		if (typeof index == 'undefined') {
			list.transform("t " + x + " " + y);
		} else {
			for ( var i = index; i < list.length; i++)
				list[i].transform("t " + x + " " + y);
		}
	
		}
		
		var deleteLoop = function(){
			if(!!PLCSpace.currentProgramModel.runmode){
				PLCSpace.pageView.loopflag = 0;
				return 0;
			}
			var loop = PLCSpace.currentProgramModel.loopTodelete;
			if(PLCSpace.currentProgramModel.loopObject[loop._id] == undefined){
				PLCSpace.pageView.loopflag = 0;
				return 0;
			}
			if(PLCSpace.currentProgramModel.disabledRung.indexOf(parseInt(loop._id.split("-")[1])) != -1){
				PLCSpace.pageView.loopflag = 0;
				return 0		
			}
			
			if(loop.occupiedPoint.length > 1){
					alert("You can not delete loop");
					PLCSpace.pageView.loopflag = 0;
					return 0;
			}
			if(!!loop.isParent ){
				alert("you can not delete loop,delete child loop");
				PLCSpace.pageView.loopflag = 0;
				return 0;
			}
			
			$.prompt("Do you want to delete a loop ? ",{
				 focus: 1,
				 show:'slideDown',
				 buttons: {  Confirm: true,Cancel: false },
				 submit: function(e, v, m, f){
				 	if(v==false){
				 		PLCSpace.pageView.loopflag = 0;
				 		return 0;
				 	}
				 	else{
				 			PLCSpace.dataStore.deleteLoop(loop._id , PLCSpace.view.programID);
				 			loop.data.isLoopPlaced  = false;
							loop._eleSet.remove();
							loop._parentObject.loopPointArray[loop._loopPointOnRung].right = null;
							loop._parentObject.loopCount--;
							loop._parentObject.isParent = false;
							loop._parentObject._collection.pop()
							delete PLCSpace.currentProgramModel.loopObject[loop._id];
							delete PLCSpace.currentProgramModel.runnableObject[loop._id];
							PLCSpace.pageView.loopflag = 0;
						}
			}})
			
			return 1;
		}

	return{
		initEditor : initEditor,
		createRung : drawRung,
		generateID : generateID,
		deleteElements : deleteLoop,
		expandLoop : expandLoop,
		drawExpandButton : drawExpandButton,
		drawReduceButton : drawReduceButton,
		drawLoop :drawLoop,
		loopflag : loopflag
	}

})();
