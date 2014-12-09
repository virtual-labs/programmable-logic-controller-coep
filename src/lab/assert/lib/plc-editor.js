PLCSpace.PLCEditorSpace = (function() {

	var// some global variable
	instructionId, inputInstruction = {
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
		"RET" : true
	}, blockCounter = 0, selected = null;

	var PLCEditorModel = {
		_id : "PLC-Editor",
		_collection : [],
		getCollectionObject : function(id) {
			return this._collection[id];
		}
	};

	var ProgramModel = {
		_id : "",
		_collection : [],
		_save : false,
		paper : null,
		eleset : null,
		runModeSet : null,
		lableSet : [],
		fbObjects : {},
		_startingPoint : [ 80, 50 ],
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
        undoStack : [],
        redoStack : [],
		loopTodelete :null,
		runnableObject : {}
	};
	seen = [];
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

    var initEditor = function (container, width, height, programID) {
		ProgramModel._id = "Program-" + programID;
        var paper = new Raphael(document.getElementById(container), width, height)
        ProgramModel.paper = paper;
        ProgramModel.eleset = paper.set();
        ProgramModel.eleset.push(paper.path("M 80 0 l 0 " + height + " z"), //left Border
        paper.path("M " + (width - 65) + " 0 l 0 " + height + " z"), // right border
        paper.path("M 80 20 l 832 0"), paper.path("M 947 20 l 68 0")).attr({
            stroke: '#73bc1e',
            'stroke-width': 2
        })
        ProgramModel.eleset.push(paper.text(930, 19, "--END--")).attr({
            'font-siz': 22,
            stroke: '#73bc1e'
        });
        Object.create(ProgramModel);
        PLCEditorModel._collection.push(ProgramModel);
        Object.seal(PLCEditorModel);
    };

    

    /* @Param id for rung
     * TODO
     * 1. Create rung Object before that do any kind of transformation for end rung line
     * 2. Rung creationg at UI envolved creating small rectangle, line and loop contact point
     * 3. This also invlove handling event at this point for adding contact and loop
     * 4. All kind of svg element reside in eleset which is an paper.set()
     **/

	var drawRung = function(id) {
    	if(!!ProgramModel.runmode){return 0}
		var RungModel = {
			_id : id,
			_name : "Rung-" + id,
			_collection : [],
			_eleSet : null,
			loopCount : 0,
            contactCount : 0,
			isBlockPresent : false,
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
			lastYCordinate : ProgramModel._startingPoint[1],
			functionBlockObject : {}
		}

        var // all local variable used for drawing element on paper and assigning UID for these element
        	loopCount = 0,
          contactEleCount = 0,
          loopEleCount = 0,
          x = ProgramModel._startingPoint[0],
          x2 = 0,
	      y = ProgramModel._startingPoint[1],
	     
		  paper = ProgramModel.paper;

		RungModel.coordinate.x = x;
		RungModel.coordinate.y = y;
		ProgramModel.rungDepth[id] = y;
		RungModel._eleSet = paper.set();

		transformRung(0, (y + 75), ProgramModel.eleset, 2); //will tranform "END" line only
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
						x : 95 + (contactEleCount - 1) * 115,
						y : y
					},
					parentObject : RungModel,
					lastYCoordinate : RungModel.lastYCordinate + 50
				};
                x2 = x + 100;
                RungModel._eleSet.push(paper.path("m " + x + " " + y + " l 100 0").attr({
					stroke : '#73bc1e',
					'stroke-width' : 2
				}).data("id", data).click(function(e) {
					drawInstruction(this.data("id"));
				}), paper.rect(x + 5, y - 15, 90, 30).attr({
					fill : 'white',
					stroke : 'white',
                    'stroke-width': 2
                }).toBack().data("id", data).click(function (e) {
                	
                	if(data.parentObject.isBlockPresent == false || this.attrs.x >= 905 ){
                		drawInstruction(this.data("id"));
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
                        x: 80 + (loopEleCount - 1) * 115,
                        y: y
                    },
                    parentObject: RungModel,
                    isLoopPlaced : false,
                    lastYCoordinate: RungModel.lastYCordinate + 50
                }
                x2 = x + 15;
                loopLineEle = paper.path("m " + x + " " + y + " l 15 0");
                loopLineEle.attr({
					stroke : '#73bc1e',
                    'stroke-width': 6
                }).data("id", data).click(function (e) { // for loop element
					
                    if (RungModel.loopPointArray[data.pointOnRung].right == null) {
	                    if(data.parentObject.isBlockPresent == false ){
	                		drawLoop(this.data("id"));
	                	}
						else{
							alert("not allowed")
							return 0 ;
						}
                        
                        
                    } else {
                        alert("sdf")
                    }
					
                }).hover(
					    function() {
					    	if(!!ProgramModel.runmode){return 0}
					         this.g = this.glow({
					             color: "#008000",
					             width: 30
					         });
					     },
					    function() {
					    	if(!!ProgramModel.runmode){return 0}
					         this.g.remove();
					    });			
                RungModel._eleSet.push(loopLineEle);
            }
            x = x2;
        }

		RungModel._eleSet.push(paper.text(40, y, RungModel._name).attr({
			"font-size" : 18,
			fill : "#d6d6d6"
		}));

		var rungCoordinateObj = {
			x : ProgramModel._startingPoint[0],
			y : ProgramModel._startingPoint[1]
		}

		ProgramModel._startingPoint[1] = y + 150;
		Object.create(RungModel);
		ProgramModel._collection.push(RungModel);

		ProgramModel.rungCoordinateArray.push(rungCoordinateObj);

		tranformRungObject.uiEleArray.push(RungModel._eleSet);
		ProgramModel.globalEleSetObject.push(tranformRungObject);
        ProgramModel.runnableObject[id] = 0;

		return RungModel;
	}

    /*
     * @param : Object data which consist of various option to draw a loop on any contact
     * TODO : 
     * 1. create loop line with extend button
     * 2. Create the object with various method used for genrating loop and reduction of loop
     * 3. translation also taking place here
     */

	var drawLoop = function(data) {
    	if(!!ProgramModel.runmode){return 0}
		
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
    	var paper = ProgramModel.paper,
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
			lastYCoordinate : data.lastYCoordinate,
			rightMostChild : null,
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
			stroke : '#73bc1e',
          'stroke-width': 4
      }).click(function (e) {
        	ProgramModel.loopTodelete = loopObj;
        	
        	//console.log(parentObj.loopPointArray[data.pointOnRung].right )
        });
	
	/*
	 * following 3 lines checks depth of a current rung Vs level of a current loop
	 */
      if(ProgramModel.rungDepth[rungID] < data.lastYCoordinate)
      {
      	ProgramModel.rungDepth[rungID] = data.lastYCoordinate ;
      	ProgramModel._startingPoint[1] += 50;
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
      var str = data.id.toString()
      var onRung = (str.indexOf("-") == -1) ? true : false;
		if (onRung) {
      		data.parentObject.loopCount ++;
          ProgramModel.globalEleSetObject[data.id].uiEleArray.push(loopObj._eleSet);
          ProgramModel.globalEleSetObject[data.id].deepestYCoordinate = loopObj.lastYCoordinate
      } else {
          ProgramModel.globalEleSetObject[rungID].uiEleArray.push(loopObj._eleSet);
          ProgramModel.globalEleSetObject[rungID].deepestYCoordinate = loopObj.lastYCoordinate;
         //ProgramModel._startingPoint[1] += 50;
      }
     /* 
      }*/
      loopObj.transformString = loopObj._parentObject._eleSet[0].transform();
      loopObj._eleSet.transform(loopObj.transformString);

		if (getLastValueOfID(loopObj._id) === 0) {

			var transformString = ProgramModel.eleset[2].transform();
         transformString[0][2] += 50 ;
         if(!transformFlag)
         {
         	transformRung(0,transformString[0][2] , ProgramModel.eleset, 2)//will tranform "END" line only
         }
         
			var nextRungID = rungID + 1;

         // ProgramModel.globalEleSetObject[nextRungID] means next rungline exactly after the rungline on which loop is placed
          

          if (!(typeof ProgramModel.globalEleSetObject[nextRungID] == 'undefined') && !transformFlag) {
				for ( var i = nextRungID; i < ProgramModel.globalEleSetObject.length; i++) {
					for ( var j = 0; j < ProgramModel.globalEleSetObject[i].uiEleArray.length; j++) {
                  		
						/*
						 * element.matrix() method can not be applied on
                  		 * elements in paper.set, so 'modified' value is calculated on
                  		 * ProgramModel.globalEleSetObject[i].uiEleArray[j][0] ie on
                  		 * single element of rung set
						 */
						var original = ProgramModel.globalEleSetObject[i].coordinate.y;
                  		var modified = ProgramModel.globalEleSetObject[i].uiEleArray[j][0].matrix.y(ProgramModel.globalEleSetObject[i].coordinate.x, ProgramModel.globalEleSetObject[i].coordinate.y)
                  		if(original == modified)
                  		{
                  			ProgramModel.globalEleSetObject[i].uiEleArray[j].transform("t 0 50");
                  		}
                  		else 
                  		{
                  			ProgramModel.globalEleSetObject[i].uiEleArray[j].transform("t 0 " + ((modified - original) + 50) + "");
                  		}
                     
                      
                  }
              }
          }
         
      }
      
		loopObj.occupiedPoint.push(data.pointOnRung);
		data.isLoopPlaced = true;
		ProgramModel._collection.push(loopObj);
      ProgramModel.runnableObject[loopObj._id] = 0;
     

		PLCSpace.dataStore.InsertLoop({
			rungid : rungID,
			loopid : loopObj._id
		}, PLCSpace.view.programID);
		return loopObj;
	}

	/*
     * @Param loopObject for drawing button on that ui
     * TODO ::
     * 1. Creating button for loop to expand and adding click event for that button
     * 
     * */

    var drawExpandButton = function (loopObject, parentObject) {
        var paper = ProgramModel.paper,
            data = {
                data: loopObject
            },
            x = loopObject.expandIcon.x,
            y = loopObject.expandIcon.y;

        var plusBtn = paper.text(x, y, "+").attr({
            "font-size": 18,
            fill: "#151515"
        }).data("id", data).click(function (e) {
        	if(!!ProgramModel.runmode){return 0}
            expandLoop(loopObject, parentObject);
        });

		plusBtn.transform(loopObject.transformString);

		loopObject.expandIcon._plusBtn = plusBtn;
		loopObject.expandIcon.x = x;
		loopObject.expandIcon.y = y;
		loopObject._eleSet.push(plusBtn);
	}

    var drawReduceButton = function (loopObject, parentObj) {
    	//console.log(loopObject)
	    var paper = ProgramModel.paper,
	        data = {
	            data: loopObject
	        },
	        x = loopObject.reduceIcon.x - 25,
	        y = loopObject.reduceIcon.y;
	
	    var minusBtn = paper.text(x, y, "-").attr({
	        "font-size": 18,
	        fill: "#151515"
	    }).data("id", data).click(function (e) {
	    	if(!!ProgramModel.runmode){return 0}
	        loopReduce(loopObject, parentObj);
	    });
	
	    minusBtn.transform(loopObject.transformString);
	    loopObject.reduceIcon._minusBtn = minusBtn;
	    loopObject._eleSet.push(minusBtn);
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
    		var paper = ProgramModel.paper,
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
							x : 80 + (loopEleCount - 1) * 115,
							y : y
						},
						isLoopPlaced : false,
						parentObject : loopObj,
						lastYCoordinate : loopObj.lastYCoordinate + 50
					}
	            var smallPoint = paper.path("m " + x + " " + y + " l 15 0").attr({
								stroke : '#73bc1e',
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
					    	if(!!ProgramModel.runmode){return 0}
								this.g = this.glow({
									color : "#008000",
									width : 30
								});
							},

							function() {
					     	if(!!ProgramModel.runmode){return 0}
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
							x : 95 + (contactEleCount - 1) * 115,
							y : y
						},
						parentObject : loopObj,
						isOccupied : false
					// lastYCoordinate : RungModel.lastYCordinate + 50
					};
							var bottomLine = paper.path("m " + x + " " + y + " l 100 0").attr({
							stroke : '#73bc1e',
							    'stroke-width': 2
							}).data("id", data).click(function (e) {
								
								if(instructionId == "openContact" || instructionId == "closeContact")
								{
									if(!data.parentObject.isBlockPresent){
										drawInstruction(this.data("id"));
									}else{
										alert("not allowed")
										return 0;
									}
									
								}
								else
								{
											alert("Not allowed.You can't place Functional block here !!!");
											return 0;
										}
									});
							var rect = paper.rect(x + 5, y - 15, 90, 30).attr({
								fill : 'white',
								stroke : 'white',
								'stroke-width' : 2
							}).toBack().data("id", data).click(function (e) {
								
								if(instructionId == "openContact" || instructionId == "closeContact")
								{
											if (!data.parentObject.isBlockPresent) {
												drawInstruction(this.data("id"));
											} else {
												alert("not allowed")
												return 0;
											}
								}
								else
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
							x = x + 100;
          	}
         }
         
				var lastLine = paper.path("m " + (x) + " " + (y+1) + " l  0 -50").attr({
				stroke : '#73bc1e',
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
				ProgramModel._collection.push(loopObj)
				
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

		var last_position = loopObj.occupiedPoint[loopObj.occupiedPoint.length - 1]
		loopObj.occupiedBlocks.sort();
		if(((last_position) - (loopObj.occupiedBlocks[loopObj.occupiedBlocks.length -1])) == 1 )
		{
			alert("Not allowed.First delete input contact !!");
			return 0;
		}   
    	var paper = ProgramModel.paper,
	 	contactArray = loopObj.loopExpandArray.pop(),
		        x = loopObj.coordinate.x - 100,
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
				stroke : '#73bc1e',
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
      ProgramModel._collection.push(loopObj)
    	var arr = loopObj.occupiedPoint;
		var obj =  parentObj.functionBlockObject;
			for (var key in obj) {
				    if(arr[arr.length-1] == obj[key].position && obj[key].inloop == loopObj._id.charAt( loopObj._id.length-1))
				    {
				    	parentObj.functionBlockObject[key].inloop = -1 ;
				    	PLCSpace.dataStore.updateInLoopStatus(PLCSpace.view.programID,key, parentObj.functionBlockObject[key].inloop)
				    }
				  
				}
    }
	/*@Param rung/loop Address
	 * TODO::
	 * 1. To draw instruction block for an object
	 * 2. Instruction Object for Complete Instruction Like add,mul
	 */

	var drawInstruction = function(data) {
		if(!!ProgramModel.runmode){return 0}
		if(data.isOccupied)
		{
			alert("Not allowed...Input contact already placed !!");
			return 0;
		}
		if (instructionType(instructionId) == "INPUT") {

			if ((data.blockOnRung === 0)) {
				
				
				if((instructionId != "openContact") && (instructionId != "closeContact"))
				{
					if(data.parentObject.loopCount > 0 || data.parentObject.contactCount > 0){
						alert("not allowed")
						return 0;
					}
						
					data.parentObject.isBlockPresent = true;
					data.isOccupied = true ;
				}
				instructionObject[instructionId](data);
				ProgramModel.runnableObject[data.parentObject._id] = 1;
			}
			else if(!(data.blockOnRung === 7) && (instructionId == "openContact" || instructionId == "closeContact")) {
				instructionObject[instructionId](data);
				ProgramModel.runnableObject[data.parentObject._id] = 1;
				data.isOccupied = true;
				data.parentObject.contactCount++;
			}
			 else {
				alert("you cannot place here");
			}
		} else if(instructionType(instructionId) == "OUTPUT") {
			if(data.blockOnRung === 7) {
				ProgramModel.runmodeFlag = true;
				data.isOccupied = true ;
				instructionObject[instructionId](data);
			} else {
				alert("you cannot place here");
			}
		} else {

		}

	}
	var generateID = function(id){
		if(id.length >= 7 )
		{
			id = id.substring(4,id.length)
		}
		// console.log(" ID: "+id)
		return id;
	};
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

			data.id = generateID(data.id);
			//console.log(data.parentObject._eleSet[2])
			var id = "OPN-" + data.id + "-" + data.blockOnRung;

			var paper = ProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					label : "?",
					tagname : "?"
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
			var label = paper.text(data.coordinate.x + 50, data.coordinate.y + 25, lbl);
			
			if(type == 0 ){
				
				url = "assert/img/open_normal.png";
				functionObject.attr.type = 0;
			}
			else if(type == 1){
				
				url = "assert/img/open_toggle.png";
				functionObject.attr.type = 1;
			} 
			var node = paper.image(url, data.coordinate.x + 30, data.coordinate.y - 16, 40, 32);
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			functionObject._body = node;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;

			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
					
			functionObject._eleSet.transform(functionObject.transformString);
				PLCSpace.dataStore.InsertElement({
				tagname : '?',
				id : id,
				status : "0.0",
				hardwareMapper : "hEF",
				type : 'input',
				inLoop : functionObject.inloop,
			}, PLCSpace.view.programID);
		},
		closeContact : function(data, type) {
			if (type == undefined) {
				type = 1;
			}
			data.id = generateID(data.id);
			var id = "CLS-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {
					label : "?",
					tagname : "?"
				},
				_eleSet : paper.set(),
				inloop : -1,
				position : data.blockOnRung,
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?"
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
			var label = paper.text(data.coordinate.x + 50, data.coordinate.y + 25, lbl);
			if(type == 0 ){
				
				url = "assert/img/close_normal.png";
				functionObject.attr.type = 0;
			}
			else if(type == 1){
				
				url = "assert/img/close_toggle.png"
				functionObject.attr.type = 1;
			}
			var node = paper.image(url, data.coordinate.x + 30, data.coordinate.y - 16, 40, 32);
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
			PLCSpace.dataStore.InsertElement({
				tagname : '?',
				id : id,
				status : "1.0",
				hardwareMapper : "hEF",
				type : 'input',
				inLoop : functionObject.inloop,
			}, PLCSpace.view.programID);
		},
		addOutput : function(data) {
			if(!!data.parentObject.isBlockPresent){return 0 }
			data.id = generateID(data.id);
			var id = "OUT-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				_eleSet : paper.set(),
				_parentObject : data.parentObject,
				classname : "",
				_value : {
							tagname : "?"
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
			
			var label = paper.text(data.coordinate.x + 50, data.coordinate.y + 25, lbl);
			var node = paper.image("assert/img/output.png", data.coordinate.x + 30, data.coordinate.y - 16, 40, 32);
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
		
			PLCSpace.dataStore.InsertElement({
				tagname : '?',
				id : id,
				status : "0.0",
				hardwareMapper : "hEF",
				type : 'output',
				inLoop : -1
			}, PLCSpace.view.programID);
		},
		OLT : function(data) {
			if(!!data.parentObject.isBlockPresent){return 0 }
			var id = "OLT-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				_eleSet : paper.set(),
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?"
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
			var label = paper.text(data.coordinate.x + 50, data.coordinate.y + 25, lbl);
			var node = paper.image("assert/img/latch.png", data.coordinate.x + 30, data.coordinate.y - 16, 40, 32);
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
			var id = "OTU-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				_eleSet : paper.set(),
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?"
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
			var label = paper.text(data.coordinate.x + 50, data.coordinate.y + 25, lbl);
			var node = paper.image("assert/img/unlatch.png", data.coordinate.x + 30, data.coordinate.y - 16, 40, 32);
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node, label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			// contactContext(functionObject.classname, id);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(node, label)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "unlatch",
					functionBlock : {

						"output" : {
							"hardwareAddress" : "l1",
							"tagName" : "?",
							"type" : "unlatch",
							status : 0.0
						},

					}
				}
			}, PLCSpace.view.programID);
		},

		RES : function(data) {
			if(!!data.parentObject.isBlockPresent){return 0 }
			var id = "RES-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
			var functionObject = {
				_id : id,
				_body : {},
				attr : {},
				_eleSet : paper.set(),
				classname : "",
				_parentObject : data.parentObject,
				_value : {
					tagname : "?"
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
			var label = paper.text(data.coordinate.x + 50, data.coordinate.y + 25, lbl);
			var node = paper.image("assert/img/reset.png", data.coordinate.x + 30, data.coordinate.y - 16, 40, 32);
			functionObject._body = node;
			functionObject.attr.label = label;
			node.node.className.baseVal = id;
			data.parentObject._eleSet.push(node,label);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id,data);
			functionObject.classname = "." + id;
			data.parentObject.functionBlockObject[id] = functionObject;
			contactContext(functionObject.classname, id, data);
			functionObject._eleSet.push(node, tagName)
			functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "reset",
					functionBlock : {
						"rungAddress" : data.id,
						"output" : {
							"type" : "reset",
							"tagName" : "?",
							"status" : 0.0
						},
					}
				}
			}, PLCSpace.view.programID);
		},

		PID : function(data,obj){
			var id = "PID-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
					result : 0
				}
			}

			var pidSet = paper.set();
				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
				fill : 'white',
				stroke : 'blue',
				strokeWidth : 0,
				r : 1
			});
			functionObject._body.body = node;
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 40 , "PID:" + functionObject._value.label).attr({
				fill : '#ff0000',
				"font-size" : 16,
				'font-weight' : 'bold'
			});
			functionObject._body.label = tagNameText;

				var inputText = paper.text(data.coordinate.x + 15, data.coordinate.y - 20, "Input").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.inputText = inputText;
				
				var inputRect = paper.rect(data.coordinate.x + 2, data.coordinate.y - 10  , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.inputBody = inputRect;
				
				var input = paper.text(data.coordinate.x + 30, data.coordinate.y  , functionObject._value.input).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.input = input;
				var resultText = paper.text(data.coordinate.x + 15, data.coordinate.y + 20, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.resultText = resultText;
				
				var resultRect = paper.rect(data.coordinate.x + 2, data.coordinate.y + 30  , 80, 15).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.resultBody = resultRect;
				
				var result = paper.text(data.coordinate.x + 30, data.coordinate.y + 40 , functionObject._value.result).attr({
					fill : '#ff0000', 
					"font-size" : 10
				});
				functionObject.attr.result = result;
				pidSet.push(node, tagNameText,inputText,inputRect,input,resultText,resultRect,result);
				data.parentObject._eleSet.push(pidSet);
				
				//pidSet.attr("title", functionObject._value.tagname);
	
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

		JMP : function(data,obj){
			var id = "JMP-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.labelName,
						
					}
				}
				var paper = ProgramModel.paper;
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
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(jmpSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "LBL-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.labelName,
						
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
				
				//lblSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lblSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "SBR-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						
						label : obj.tagName,
						inputParameter : obj.input
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
				
				//sbrSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(sbrSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
				
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
			var id = "RET-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						
						label : obj.tagName,
						inputParameter : obj.output
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
				
				//retSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(retSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "JSR-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						
						label : obj.tagName,
						routine : obj.srname,
						inputParameter : obj.input,
						returnParameter : obj.output,
						
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

				//jsrSet.attr("title", functionObject._value.tagname);

			node.node.className.baseVal = id;
			var classname = "." + id;
			functionObject.classname = classname;

			ContextMenu(classname, id, data);
			data.parentObject.functionBlockObject[id] = functionObject;

			functionObject._eleSet.push(jsrSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
			functionObject._eleSet.transform(functionObject.transformString);
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
		
		CPT : function(data,obj){
			var id = "CPT-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.tagName,
						expression :obj.expression,
						destination : obj.destination.tagName,
						result : obj.result
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
				
				//cptSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(cptSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "MOV-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						source1Adress : obj.srcAddress,
						source2Adress : obj.dest.tagName,
						source1Value : obj.srcValue,
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
				
				//lesSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lesSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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

		LIM : function(data,obj){
			var id = "LIM-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.lable,
						LLAdress : obj.lowLabel,
						TestAdress : obj.testLabel,
						HLAdress : obj.highLabel,
						LLValue : obj.lowValue,
						TestValue : obj.testValue,
						HLValue : obj.highValue
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
				
				//limitSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(limitSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "lim", // add sub mul
					functionBlock : {

					}

				}
			}, PLCSpace.view.programID);
		},
		LEQ : function(data,obj){
			var id = "LEQ-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.lable,
						source1Adress : obj.sourceA,
						source2Adress : obj.sourceB,
						source1Value : obj.valueA,
						source2Value : obj.valueB
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
				
				//leqSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(leqSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "GEQ-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.lable,
						source1Adress : obj.sourceA,
						source2Adress : obj.sourceB,
						source1Value : obj.valueA,
						source2Value : obj.valueB
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
				
				//geqSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data );
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(geqSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "LES-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.lable,
						source1Adress : obj.sourceA,
						source2Adress : obj.sourceB,
						source1Value : obj.valueA,
						source2Value : obj.valueB
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
				
				//lesSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(lesSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "GRT-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.tagName,
						source1Adress : obj.sourceA,
						source2Adress : obj.sourceB,
						source1Value : obj.valueA,
						source2Value : obj.valueB
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
				
				//grtSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(grtSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "NEQ-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.tagName,
						source1Adress : obj.sourceA,
						source2Adress : obj.sourceB,
						source1Value : obj.valueA,
						source2Value : obj.valueB
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
				
				//neqSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(neqSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "EQU-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.lable,
						source1Adress : obj.sourceA,
						source2Adress : obj.sourceB,
						source1Value : obj.valueA,
						source2Value : obj.valueB
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
				
				//equSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(equSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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

		CMP : function(data,obj){
			var id = "CMP-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						result : "",
					}
				}
				if(!!obj)
				{
					functionObject._value = {
						label : obj.tagName,
						expression : obj.expression,
						outputAddress : obj.outputAddress,
						result : obj.result
					}
				}
				var cmpSet = paper.set();

				var node = paper.rect(data.coordinate.x, data.coordinate.y - 48, 100, 100).attr({
					fill : 'white',
					stroke : 'blue',
					strokeWidth : 0,
					r : 1
				});
				functionObject._body.body = node;
				
				var tagNameText = paper.text(data.coordinate.x + 50, data.coordinate.y - 37, "CMP:" + functionObject._value.label).attr({
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
				
				var expressionRect = paper.rect(data.coordinate.x + 2, data.coordinate.y-10 , 80, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.expressionBody = expressionRect;
				
				var expression = paper.text(data.coordinate.x + 40, data.coordinate.y  , functionObject._value.expression).attr({
					fill : '#ff0000', 
					"font-size" : 15
				});
				functionObject.attr.expression = expression;
				
				var resultText = paper.text(data.coordinate.x + 15, data.coordinate.y + 20, "Result").attr({
					fill : '#ff0000',
					"font-size" : 10,
					'font-weight' : 'bold'
				});
				functionObject._body.resultText = resultText;
				
				var resultRect = paper.rect(data.coordinate.x + 2, data.coordinate.y+25 , 80, 20).attr({
					stroke : 'blue',
					strokeWidth : 0
				});
				functionObject._body.resultBody = resultRect;
				
				var result = paper.text(data.coordinate.x + 40, data.coordinate.y + 35  , functionObject._value.result).attr({
					fill : '#ff0000', 
					"font-size" : 15
				});
				functionObject.attr.result = result;
				
				cmpSet.push(node, tagNameText, expressionText, expressionRect, expression, resultText, resultRect, result);
				data.parentObject._eleSet.push(cmpSet);
				
				
				//cmpSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id, data );
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(cmpSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
		ADD : function(data,obj){
			var id = "ADD-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : "?",
						labelA : obj.sourceA,
						labelB : obj.sourceB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.destination.tagname,
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
				
				//arithmeticSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "SUB-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : "?",
						labelA : obj.sourceA,
						labelB : obj.sourceB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.destination.tagname,
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
				
				//arithmeticSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "MUL-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : "?",
						labelA : obj.sourceA,
						labelB : obj.sourceB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.destination.tagname,
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
				
				arithmeticSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "DIV-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : "?",
						labelA : obj.sourceA,
						labelB : obj.sourceB,
						valueA : obj.valueA,
						valueB : obj.valueB,
						labelR : obj.destination.tagname,
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
				
				//arithmeticSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(arithmeticSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
		
		TON : function(data,obj) {
			
				var id = "TON-" + data.id + "-" + data.blockOnRung;
				var paper = ProgramModel.paper;
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
				/*var blockName = paper.text(data.coordinate.x + 35, data.coordinate.y - 37, "TON:").attr({
					fill : '#ff0000',
					"font-size" : 16,
					'font-weight' : 'bold'
				});
				functionObject._body.blockName = blockName;*/
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
					"font-size" : 16
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, 0).attr({
					fill : '#ff0000',
					"font-size" : 16
				});
				functionObject.attr.acc = acc
	
				var fOutText = paper.text(data.coordinate.x + 10, data.coordinate.y + 45, functionObject._value.tagname + ".EN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 50, data.coordinate.y + 45, functionObject._value.tagname + ".DN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
	
				var tOutText = paper.text(data.coordinate.x + 85, data.coordinate.y + 45, functionObject._value.tagname + ".TT").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.tOutText = tOutText;
	
				var fOut = paper.image("assert/img/output.png",data.coordinate.x + 3, data.coordinate.y + 55, 20, 20);
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("assert/img/output.png",data.coordinate.x + 40, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
	
				var tOut = paper.image("assert/img/output.png",data.coordinate.x + 77, data.coordinate.y + 55, 20, 20)
				functionObject._body.tOut = tOut;
				
				timerSet.push(node,  labelText , presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, tOutText, fOut, sOut, tOut);
				data.parentObject._eleSet.push(timerSet);
	
				//timerSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				//console.log(data.parentObject)
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(timerSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "TOF-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
					"font-size" : 16
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, 0).attr({
					fill : '#ff0000',
					"font-size" : 16
				});
				functionObject.attr.acc = acc
	
				var fOutText = paper.text(data.coordinate.x + 10, data.coordinate.y + 45, functionObject._value.tagname + ".EN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 50, data.coordinate.y + 45, functionObject._value.tagname + ".DN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
	
				var tOutText = paper.text(data.coordinate.x + 85, data.coordinate.y + 45, functionObject._value.tagname + ".TT").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.tOutText = tOutText;
	
				var fOut = paper.image("assert/img/output.png",data.coordinate.x + 3, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("assert/img/output.png",data.coordinate.x + 40, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
	
				var tOut = paper.image("assert/img/output.png",data.coordinate.x + 77, data.coordinate.y + 55, 20, 20)
				functionObject._body.tOut = tOut;
				
				timerSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, tOutText, fOut, sOut, tOut);
				data.parentObject._eleSet.push(timerSet);
	
				//timerSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(timerSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "CTU-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
					"font-size" : 16
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, functionObject._value.acc).attr({
					fill : '#ff0000',
					"font-size" : 16
				});
				functionObject.attr.acc = acc;
				
				var fOutText = paper.text(data.coordinate.x + 25, data.coordinate.y + 45, functionObject._value.tagname + ".CU").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 65, data.coordinate.y + 45, functionObject._value.tagname + ".DN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
				var fOut = paper.image("assert/img/output.png",data.coordinate.x + 17, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("assert/img/output.png",data.coordinate.x + 55, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
				
				counterSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, fOut, sOut);
				data.parentObject._eleSet.push(counterSet);
				//counterSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(counterSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
			var id = "CTD-" + data.id + "-" + data.blockOnRung;
			var paper = ProgramModel.paper;
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
						label : obj.tagName,
						tagname : obj.tagName,
						preset : obj.preset,
						acc : obj.acc
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
					"font-size" : 16
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, functionObject._value.acc).attr({
					fill : '#ff0000',
					"font-size" : 16
				});
				functionObject.attr.acc = acc;
				
				var fOutText = paper.text(data.coordinate.x + 25, data.coordinate.y + 45, functionObject._value.label + ".CD").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 65, data.coordinate.y + 45, functionObject._value.label + ".DN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
				var fOut = paper.image("assert/img/output.png",data.coordinate.x + 17, data.coordinate.y + 55, 20, 20)
				functionObject._body.fOut = fOut;
	
				var sOut = paper.image("assert/img/output.png",data.coordinate.x + 55, data.coordinate.y + 55, 20, 20)
				functionObject._body.sOut = sOut;
				
				counterSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, fOut, sOut);
				data.parentObject._eleSet.push(counterSet);
				//counterSet.attr("title", functionObject._value.label);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id , data);
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(counterSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
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
		RTO : function(data,obj) {
			var id = "RTO-" + data.id + "-" + data.blockOnRung;
				var paper = ProgramModel.paper;
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
					"font-size" : 16
				});
				functionObject.attr.preset = preset;
	
				var acc = paper.text(data.coordinate.x + 60, data.coordinate.y + 18, functionObject._value.acc).attr({
					fill : '#ff0000',
					"font-size" : 16
				});
				functionObject.attr.acc = acc
	
				var fOutText = paper.text(data.coordinate.x + 10, data.coordinate.y + 45, functionObject._value.tagname + ".EN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.fOutText = fOutText;
	
				var sOutText = paper.text(data.coordinate.x + 50, data.coordinate.y + 45, functionObject._value.tagname + ".DN").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.sOutText = sOutText;
	
				var tOutText = paper.text(data.coordinate.x + 85, data.coordinate.y + 45, functionObject._value.tagname + ".TT").attr({
					fill : '#ff0000',
					"font-size" : 10
				});
				functionObject.attr.tOutText = tOutText;
	
				var fOut = paper.rect(data.coordinate.x + 3, data.coordinate.y + 55, 20, 20).attr({
					fill : '#ff0000'
				});
				functionObject._body.fOut = fOut;
	
				var sOut = paper.rect(data.coordinate.x + 40, data.coordinate.y + 55, 20, 20).attr({
					fill : '#ff0000'
				});
				functionObject._body.sOut = sOut;
	
				var tOut = paper.rect(data.coordinate.x + 77, data.coordinate.y + 55, 20, 20).attr({
					fill : '#ff0000'
				});
				functionObject._body.tOut = tOut;
				timerSet.push(node, tagNameText, presetRect, presetText, accRect, accText, preset, acc, fOutText, sOutText, tOutText, fOut, sOut, tOut);
				data.parentObject._eleSet.push(timerSet);
	
				//timerSet.attr("title", functionObject._value.tagname);
	
				node.node.className.baseVal = id;
				var classname = "." + id;
				functionObject.classname = classname;
	
				ContextMenu(classname, id, data);
				//console.log(data.parentObject)
				data.parentObject.functionBlockObject[id] = functionObject;
				
				functionObject._eleSet.push(timerSet)
				functionObject.transformString = functionObject._parentObject._eleSet[0].transform();
     			functionObject._eleSet.transform(functionObject.transformString);
			PLCSpace.dataStore.InsertElement({
				id : id,
				type : "function",
				attr : {
					type : "retentivetimeron",
					functionBlock : {}
				}
			}, PLCSpace.view.programID);
		}
		}
	};

	var configureTimer = function(id,objTemp,data,paper){
		//preset = objTemp._value.preset;
		var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="label" value='+ objTemp._value.label +' /></div><div class="field"><label for="preset">Preset</label><input type="text" name="preset" id="preset" value= '+ objTemp._value.preset +' /></div> <div class="field"><label for="tagname">EN:Tag</label><select id="tagEN" name="tagEN"><option >P-101</option><option>P-301</option><option>TT-1</option><option>HEATER</option><option>SOV-201</option><option>HOOTER</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div> <div class="field"><label for="DNtagname">DN:Tag</label><select id="tagDN" name="tagDN"><option >P-101</option><option>P-301</option><option>TT-1</option><option>HEATER</option><option>SOV-201</option><option>HOOTER</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div> <div class="field"><label for="TTtagname">TT:Tag</label><select id="tagTT" name="tagTT"><option >P-101</option><option>P-301</option><option>TT-1</option><option>HEATER</option><option>SOV-201</option><option>HOOTER</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div>'
					  $.prompt(str,{
					 		focus: 1,
					 		buttons: { Submit: true , Cancel: false},
					 		submit: function(e, v, m, f){
					 			if(v == false){return 0}
					 			
								 objTemp._value.label  = f.label == ""? "?" : f.label;
								 label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
									fill : '#ff0000',
									"font-size" : 16,
									'font-weight' : 'bold'
								});;
								 objTemp._body.label.remove();
								 data.parentObject.functionBlockObject[id]._body.label = label;
								 
								 objTemp._value.preset  = f.preset == ""? "?" : f.preset;
								 preset =  paper.text(objTemp.attr.preset.attrs.x , objTemp.attr.preset.attrs.y ,objTemp._value.preset);
								 objTemp.attr.preset.remove();
								 data.parentObject.functionBlockObject[id].attr.preset = preset;
								 
								 data.parentObject.functionBlockObject[id].attr.tagEN = f.tagEN;
								 data.parentObject.functionBlockObject[id].attr.tagDN = f.tagDN;
								 data.parentObject.functionBlockObject[id].attr.tagTT = f.tagTT;
								 	 objTemp._eleSet.push(label,preset);
				PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
						PLCSpace.view.programID, id, {
							"tagName" : f.label,
							"preset" : f.preset,
							acc : 0,
							"en" : {
								hardwareAddress : ".en",
								type : "output",
								tagName : f.label + ".en",
								status : 0.0
							},
							"dn" : {
								hardwareAddress : ".dn",
								type : "output",
								tagName : f.label + ".dn",
								status : 0.0
							},
							"tt" : {
								hardwareAddress : ".tt",
								type : "output",
								tagName : f.label + ".tt",
								status : 0.0
							},

						});
			}
		});
	};
	var configureCounter = function(id,objTemp,data,paper){
		var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="label" value='+ objTemp._value.label +' /></div><div class="field"><label for="preset">Preset</label><input type="text" name="preset" id="preset" value='+ objTemp._value.preset +' /></div> <div class="field"><label for="tagname">EN:Tag</label><select id="tagEN" name="tagEN"><option >P-101</option><option>P-301</option><option>TT-1</option><option>HEATER</option><option>SOV-201</option><option>HOOTER</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div> <div class="field"><label for="DNtagname">DN:Tag</label><select id="tagDN" name="tagDN"><option >P-101</option><option>P-301</option><option>TT-1</option><option>HEATER</option><option>SOV-201</option><option>HOOTER</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div>'
		$.prompt(str,{
						 		focus: 1,
						 		buttons: { Calculate: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
									 objTemp._value.label  = f.label == ""? "?" : f.label;
									 label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
										fill : '#ff0000',
										"font-size" : 16,
										'font-weight' : 'bold'
									});;
									 objTemp._body.label.remove();
									 data.parentObject.functionBlockObject[id]._body.label = label;
									 
									 objTemp._value.preset  = f.preset == ""? "?" : f.preset;
									 preset =  paper.text(objTemp.attr.preset.attrs.x , objTemp.attr.preset.attrs.y ,objTemp._value.preset);
									 objTemp.attr.preset.remove();
									 data.parentObject.functionBlockObject[id].attr.preset = preset ;
									 
									 data.parentObject.functionBlockObject[id].attr.tagEN = f.tagEN;
									 data.parentObject.functionBlockObject[id].attr.tagDN = f.tagDN;
									  objTemp._eleSet.push(label,preset);
				PLCSpace.dataStore.UpdateFunctionBlockConfiguration(
						PLCSpace.view.programID, id, {
							"tagName" : f.label,
							"preset" : f.preset,
							"acc" : 0,
							"cu" : {
								"type" : "output",
								"tagName" : f.label + ".cu",
								"status" : 0.0
							},
							"dn" : {
								"type" : "output",
								"tagName" : f.label + ".dn",
								"status" : 0.0
							},
						});
			}
		});
	}

	var configureArithmaticBlocks = function(id, objTemp, data, paper) {
		var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value='+ objTemp._value.label +' ></div><div class="field"><label for="tagnameA">TagName-A</label><select id="tagnameA" name="tagnameA"><option >LT-1</option><option>PT-1</option><option>TT-1</option><option>TT-2</option><option>TT-3</option><option>TT-4</option><option>TT-5</option><option>TT-6</option><option>FT-1</option><option>FT-2</option><option>FT-3</option><option>3PEM</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div><div class="field"><label for="Label-A">Label-A</label><input type="text" name="labelA" id="LabelA" value = '+ objTemp._value.labelA +'></div><div class="field"><label for="valueA">Value-A</label><input type="text" name="valueA" id="valueA" value='+ objTemp._value.valueA +' ></div><div class="field"><label for="tagname-B">TagName-B</label><select id="tagnameB" name="tagnameB"><option >LT-1</option><option>PT-1</option><option>TT-1</option><option>TT-2</option><option>TT-3</option><option>TT-4</option><option>TT-5</option><option>TT-6</option><option>FT-1</option><option>FT-2</option><option>FT-3</option><option>3PEM</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div><div class="field"><label for="LabelB">Label-B</label><input type="text" name="labelB" id="LabelB" value = '+ objTemp._value.labelB +'></div><div class="field"><label for="valueB">ValueB</label><input type="text" name="valueB" id="valueB" value='+ objTemp._value.valueB +' ></div><div class="field"><label for="tagname-R">TagName-Result</label><select id="tagnameR" name="tagnameR"><option >LT-1</option><option>PT-1</option><option>TT-1</option><option>TT-2</option><option>TT-3</option><option>TT-4</option><option>TT-5</option><option>TT-6</option><option>FT-1</option><option>FT-2</option><option>FT-3</option><option>3PEM</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div><div class="field"><label for="LabelR">Label-Result</label><input type="text" name="labelR" id="labelR" value = '+ objTemp._value.labelR +'></div>'
					  $.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			 objTemp._value.label  = f.label == ""? "?" : f.label;
						 			  label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
										fill : '#ff0000',
										"font-size" : 16,
										'font-weight' : 'bold'
									});;
									 objTemp._body.label.remove();
									 data.parentObject.functionBlockObject[id]._body.label = label;
									 
									 objTemp._value.labelA  = f.labelA == ""? "?" : f.labelA;
									 labelA =  paper.text(objTemp.attr.labelA.attrs.x , objTemp.attr.labelA.attrs.y ,objTemp._value.labelA);
									 objTemp.attr.labelA.remove();
									 data.parentObject.functionBlockObject[id].attr.labelA = labelA ;
									 
									 objTemp._value.labelB  = f.labelB == ""? "?" : f.labelB;
									 labelB =  paper.text(objTemp.attr.labelB.attrs.x , objTemp.attr.labelB.attrs.y ,objTemp._value.labelB);
									 objTemp.attr.labelB.remove();
									 data.parentObject.functionBlockObject[id].attr.labelB = labelB ;
									 
									 objTemp._value.labelR  = f.labelR == ""? "?" : f.labelR;
									 labelR =  paper.text(objTemp.attr.labelR.attrs.x , objTemp.attr.labelR.attrs.y ,objTemp._value.labelR);
									 objTemp.attr.labelR.remove();
									 data.parentObject.functionBlockObject[id].attr.labelR = labelR ;
									 
									 objTemp._value.valueA  = f.valueA == ""? "?" : f.valueA;
									 valueA =  paper.text(objTemp.attr.valueA.attrs.x , objTemp.attr.valueA.attrs.y ,objTemp._value.valueA);
									 objTemp.attr.valueA.remove();
									 data.parentObject.functionBlockObject[id].attr.valueA = valueA ;
									 
									 objTemp._value.valueB  = f.valueB == ""? "?" : f.valueB;
									 valueB =  paper.text(objTemp.attr.valueB.attrs.x , objTemp.attr.valueB.attrs.y ,objTemp._value.valueB);
									 objTemp.attr.valueB.remove();
									 data.parentObject.functionBlockObject[id].attr.valueB = valueB ;
									 
									 data.parentObject.functionBlockObject[id].attr.tagnameA = f.tagnameA ;
									 data.parentObject.functionBlockObject[id].attr.tagnameB = f.tagnameB ;
									 data.parentObject.functionBlockObject[id].attr.tagnameR = f.tagnameR ;
									 	 objTemp._eleSet.push(label,labelA,labelB,labelR,valueA,valueB);
								PLCSpace.dataStore
										.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, {
													sourceA : f.labelA,
													sourceB : f.labelB,
													valueA : f.valueA,
													valueB : f.valueB,
													destination : {
														"type" : "output",
														"tagName" : f.labelR,
														"status" : 0.0
													},
												});
							
							
				}
		  });
	}
	var configureComparativeBlocks = function(id,objTemp,data,paper){
		var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="SrcA-Label">SourceA-Label</label><input type="text" name="SrcALabel" id="SrcALabel" value = '+ objTemp._value.source1Adress +'></div> <div class="field"><label for="SrcA-value">SourceA-Value</label><input type="text" name="SrcAValue" id="SrcAValue" value = '+ objTemp._value.source1Value +'></div> <div class="field"><label for="SrcB-Label">SourceB-Label</label><input type="text" name="SrcBLabel" id="SrcBLabel" value = '+ objTemp._value.source2Adress +'></div> <div class="field"><label for="SrcB-value">SourceB-Value</label><input type="text" name="SrcBValue" id="SrcBValue" value = '+ objTemp._value.source2Value +'></div> '
					 	$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
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
									
									objTemp._value.source2Value  = f.SrcBValue == ""? "?" : f.SrcBValue;
									SrcBValue =  paper.text(objTemp.attr.value2.attrs.x , objTemp.attr.value2.attrs.y ,objTemp._value.source2Value);
									objTemp.attr.value2.remove();
									data.parentObject.functionBlockObject[id].attr.value2 = SrcBValue ;
										objTemp._eleSet.push(label,SrcALabel,SrcBLabel,SrcAValue,SrcBValue);
								PLCSpace.dataStore
										.UpdateFunctionBlockConfiguration(
												PLCSpace.view.programID, id, {
													sourceA : f.SrcALabel,// grt(cpt,add)
													// to
													// refer
													// any
													// tga
													// it
													// should
													// not
													// have
													// tagname
													// as
													// t1
													// t2
													result : 0.0,
													sourceB : f.SrcBLabel,
													valueA : f.SrcAValue,
													valueB : f.SrcBValue,
													lable : f.label,
													outputAddress : "?"
												});
							}

						});
	}
	var ContextMenu = function(sel, id, data) {
		var paper = ProgramModel.paper;
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
				"cut" : {
					name : "Cut",
					icon : "cut"
				},
				"copy" : {
					name : "Copy",
					icon : "copy"
				},
				"paste" : {
					name : "Paste",
					icon : "paste"
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
			console.log('clicked', this);
		});

		var optionObject = {

			configure : function() {
				var objTemp = data.parentObject.functionBlockObject[id];
			 	type = id.substring(0, 3);
				switch(type)
					{
					case 'TON':
						configureTimer(id,objTemp,data,paper);
					break;
				case 'TOF':
					configureTimer(id, objTemp, data, paper);
					break;
				case 'RTO':
					configureTimer(id, objTemp, data, paper);
					break;
				case 'CTU':
					configureCounter(id, objTemp, data, paper);
					break;
				case 'CTD':
					configureCounter(id, objTemp, data, paper);
					break;
				case 'ADD':
					configureArithmaticBlocks(id, objTemp, data, paper);
					break;
				case 'SUB':
					configureArithmaticBlocks(id, objTemp, data, paper);
					break;
				case 'MUL':
					configureArithmaticBlocks(id, objTemp, data, paper);
					break;
				case 'DIV':
					configureArithmaticBlocks(id, objTemp, data, paper);
					break;
				case 'CPT':
					  	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label"  value = '+ objTemp._value.label +'></div> <div class="field"><label for="expression">Expression</label><input type="text" name="expression" id="expression"  value = '+ objTemp._value.expression +'><p>(Enter expression seperated with comma)</p></div> <div class="field"><label for="destination">Destination-Lbl</label><input type="text" name="destination" id="destination" value = '+ objTemp._value.destination +'></div> <div class="field"><label for="destinationTag">DestinationTag</label><select id="destinationTag" name="destinationTag"><option >VFD 101</option><option >VFD 301</option><option >SCR</option><option >MSV 1</option><option >MSV 2</option><option >FCV-1</option></select></div>'
					  	$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			objTemp._value.label  = f.label == ""? "?" : f.label;
						 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
										fill : '#ff0000',
										"font-size" : 16,
										'font-weight' : 'bold'
									});;;
						 			objTemp._body.label.remove();
									data.parentObject.functionBlockObject[id]._body.label = label;
									
									objTemp._value.expression  = f.expression == ""? "?" : f.expression;
									expression =  paper.text(objTemp.attr.expression.attrs.x , objTemp.attr.expression.attrs.y ,objTemp._value.expression);
									objTemp.attr.expression.remove();
									data.parentObject.functionBlockObject[id].attr.expression = expression ;
									
									objTemp._value.destination  = f.destination == ""? "?" : f.destination;
									destination =  paper.text(objTemp.attr.destination.attrs.x , objTemp.attr.destination.attrs.y ,objTemp._value.destination);
									objTemp.attr.destination.remove();
									data.parentObject.functionBlockObject[id].attr.destination = destination ;
									
									data.parentObject.functionBlockObject[id].attr.tagname = f.destinationTag ;
										objTemp._eleSet.push(label,expression,destination);
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																expression : f.expression,
																destination : {
																	"type" : "output",
																	"tagName" : f.destination,
																	"status" : 0.0
																},
																result : 0.0,
																tagName : f.label
															});
										}
									});
					break;
				case 'CMP':
					  var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="expression">Expression</label><input type="text" name="expression" id="expression"  value = '+ objTemp._value.expression +'><p>(Enter expression seperated with comma)</p></div> <div class="field"><label for="result">Result-label</label><input type="text" name="result" id="result" value = '+ objTemp._value.result +' ></div>'
				
					 	$.prompt(str,{						
										focus : 1,
						 		buttons: { Submit: true , Cancel: false},
											
										
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			objTemp._value.label  = f.label == ""? "?" : f.label;
						 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											
														fill : '#ff0000',
														"font-size" : 16,
														'font-weight' : 'bold'
									});;;
						 			objTemp._body.label.remove();
									data.parentObject.functionBlockObject[id]._body.label = label;
									
									objTemp._value.expression  = f.expression == ""? "?" : f.expression;
									expression =  paper.text(objTemp.attr.expression.attrs.x , objTemp.attr.expression.attrs.y ,objTemp._value.expression);
											objTemp.attr.expression.remove();
											data.parentObject.functionBlockObject[id].attr.expression = expression;
							objTemp._eleSet.push(label,expression)	
							objTemp._value.result  = f.result == ""? "?" : f.result;
															result =  paper.text(objTemp.attr.result.attrs.x , objTemp.attr.result.attrs.y ,objTemp._value.result);
															objTemp.attr.result.remove();
															data.parentObject.functionBlockObject[id].attr.result = result ;
															objTemp._eleSet.push(label,result)
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																expression : f.expression,
																lable : f.label,
																outputAddress : "?",
																result : 0
															});
										}
									});
					break;
				case 'EQU':
					configureComparativeBlocks(id, objTemp, data, paper);

					break;
				case 'NEQ':
					configureComparativeBlocks(id, objTemp, data, paper);
					break;
				case 'GRT':
					configureComparativeBlocks(id, objTemp, data, paper);
					break;
				case 'LES':
					configureComparativeBlocks(id, objTemp, data, paper);
					break;
				case 'GEQ':
					configureComparativeBlocks(id, objTemp, data, paper);
					break;
				case 'LEQ':
					configureComparativeBlocks(id, objTemp, data, paper);
					break;
				case 'LIM':
					  	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="LLlabel">Lowlimit-Label</label><input type="text" name="LLlabel" id="LLlabel" value = '+ objTemp._value.LLAdress +'></div> <div class="field"><label for="LLvalue">LowLimit-Value</label><input type="text" name="LLValue" id="LLValue" value = '+ objTemp._value.LLValue +'></div> <div class="field"><label for="Test-Label">Test-Label</label><input type="text" name="TestLabel" id="TestLabel" value = '+ objTemp._value.TestAdress +'></div> <div class="field"><label for="Test-value">Test-Value</label><input type="text" name="TestValue" id="TestValue" value = '+ objTemp._value.TestValue +'></div> <div class="field"><label for="HL-Label">HighLimit-Label</label><input type="text" name="HLLabel" id="HLLabel"value = '+ objTemp._value.HLAdress +'></div> <div class="field"><label for="HL-value">HighLimit-Value</label><input type="text" name="HLValue" id="HLValue" value = '+ objTemp._value.TestValue +'></div> '
					 	$.prompt(str,{
						 		focus: 1,
						 		buttons: { Submit: true , Cancel: false},
						 		submit: function(e, v, m, f){
						 			if(v == false){return 0}
						 			objTemp._value.label  = f.label == ""? "?" : f.label;
						 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
														fill : '#ff0000',
														"font-size" : 16,
														'font-weight' : 'bold'
									});;;
						 			objTemp._body.label.remove();
									data.parentObject.functionBlockObject[id]._body.label = label;
									
									objTemp._value.LLAdress  = f.LLlabel == ""? "?" : f.LLlabel;
									LLlabel =  paper.text(objTemp.attr.lowLevelLabel.attrs.x , objTemp.attr.lowLevelLabel.attrs.y ,objTemp._value.LLAdress);
									objTemp.attr.lowLevelLabel.remove();
											data.parentObject.functionBlockObject[id].attr.lowLevelLabel = LLlabel;

									objTemp._value.HLAdress   = f.HLLabel == ""? "?" : f.HLLabel;
									HLLabel =  paper.text(objTemp.attr.highLevelLabel.attrs.x , objTemp.attr.highLevelLabel.attrs.y ,objTemp._value.HLAdress );
									objTemp.attr.highLevelLabel.remove();
													
											data.parentObject.functionBlockObject[id].attr.highLevelLabel = HLLabel;

									objTemp._value.TestAdress = f.TestLabel == ""? "?" : f.TestLabel;
									TestLabel = paper.text(objTemp.attr.TestLabel.attrs.x , objTemp.attr.TestLabel.attrs.y ,objTemp._value.TestAdress  );
									objTemp.attr.TestLabel.remove();
									data.parentObject.functionBlockObject[id].attr.TestLabel = TestLabel ;
									
									objTemp._value.LLValue = f.LLValue == ""? "?" : f.LLValue;
									LLValue =  paper.text(objTemp.attr.lowLevelValue.attrs.x , objTemp.attr.lowLevelValue.attrs.y ,objTemp._value.LLValue );
									objTemp.attr.lowLevelValue.remove();
									data.parentObject.functionBlockObject[id].attr.lowLevelValue = LLValue ;
									
									objTemp._value.HLValue = f.HLValue == ""? "?" : f.HLValue;
									HLValue = paper.text(objTemp.attr.highLevelValue.attrs.x , objTemp.attr.highLevelValue.attrs.y ,objTemp._value.HLValue );
									objTemp.attr.highLevelValue.remove();
									data.parentObject.functionBlockObject[id].attr.highLevelValue = HLValue ;
									
									objTemp._value.TestValue = f.TestValue == ""? "?" : f.TestValue;
									TestValue = paper.text(objTemp.attr.TestValue.attrs.x , objTemp.attr.TestValue.attrs.y ,objTemp._value.TestValue  );
									objTemp.attr.TestValue.remove();
									data.parentObject.functionBlockObject[id].attr.TestValue = TestValue ;
										objTemp._eleSet.push(label,LLlabel,HLLabel,TestLabel,LLValue,HLValue,TestValue);
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																lowValue : f.LLValue,
																lowLabel : f.LLlabel,
																highValue : f.HLValue,
																highLabel : f.HLLabel,
																testValue : f.TestValue,
																testLabel : f.TestLabel,
																result : 0.0,
																outputAddress : "?"
															});
										}
									});
					break;
				case 'JSR':
						  	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="Subroutine">Subroutine</label><input type="text" name="Subroutine" id="Subroutine" value = '+ objTemp._value.routine +'></div> <div class="field"><label for="InputParameter">Input</label><input type="text" name="inputParameter" id="inputParameter" value = '+ objTemp._value.inputParameter +'><p>(Enter Input parameter seperated with comma)</p></div> <div class="field"><label for="ReturnParameter">Return</label><input type="text" name="returnParameter" id="returnParameter" value = '+ objTemp._value.returnParameter +'></div> '
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
										data.parentObject.functionBlockObject[id]._body.label = label;
										
										objTemp._value.routine  = f.Subroutine == ""? "?" : f.Subroutine;
										Subroutine =  paper.text(objTemp.attr.subroutine.attrs.x , objTemp.attr.subroutine.attrs.y ,objTemp._value.routine);
										objTemp.attr.subroutine.remove();
										data.parentObject.functionBlockObject[id].attr.subroutine = Subroutine ;
										
										objTemp._value.inputParameter  = f.inputParameter == ""? "?" : f.inputParameter;
										inputParameter =  paper.text(objTemp.attr.inputParameter.attrs.x , objTemp.attr.inputParameter.attrs.y ,objTemp._value.inputParameter);
										objTemp.attr.inputParameter.remove();
										data.parentObject.functionBlockObject[id].attr.inputParameter = inputParameter ;
										
										objTemp._value.returnParameter  = f.returnParameter == ""? "?" : f.returnParameter;
										returnParameter =  paper.text(objTemp.attr.returnParameter.attrs.x , objTemp.attr.returnParameter.attrs.y ,objTemp._value.returnParameter);
										objTemp.attr.returnParameter.remove();
											data.parentObject.functionBlockObject[id].attr.returnParameter = returnParameter;
											objTemp._eleSet.push(label,Subroutine,inputParameter,returnParameter);
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																tagName : f.label,
																srname : f.Subroutine,
																output : f.returnParameter,
																input : f.inputParameter
															});
										}
									});
					break;
				case 'SBR':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="InputParameter">Input</label><input type="text" name="inputParameter" id="inputParameter" value = '+ objTemp._value.inputParameter +'><p>(Enter Input parameter seperated with comma)</p></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
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
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																tagName : f.label,
																input : f.inputParameter
															});
										}
									});
					break;
				case 'RET':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="ReturnParameter">Return</label><input type="text" name="returnParameter" id="returnParameter" value = '+ objTemp._value.returnParameter +'></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
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
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																output : f.returnParameter,
																lable : f.label
															});
										}
									});
					break;

				case 'JMP':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
							 			objTemp._eleSet.push(label);
										data.parentObject.functionBlockObject[id]._body.label = label;
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																labelName : f.label
															});
										}
									});
					break;
				case 'LBL':
						 	var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div>'
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
							 			objTemp._eleSet.push(label)
										data.parentObject.functionBlockObject[id]._body.label = label;
											PLCSpace.dataStore
													.UpdateFunctionBlockConfiguration(
															PLCSpace.view.programID,
															id,
															{
																labelName : f.label,
																rungAddress : objTemp.parentObject.id
															});
										}
									});
					break;

				case 'MOV':
							var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="SrcA-Label">SourceA-Label</label><input type="text" name="SrcALabel" id="SrcALabel" value = '+ objTemp._value.source1Adress +'></div> <div class="field"><label for="SrcA-value">SourceA-Value</label><input type="text" name="SrcAValue" id="SrcAValue" value = '+ objTemp._value.source1Value +'></div> <div class="field"><label for="SrcB-Label">SourceB-Label</label><input type="text" name="SrcBLabel" id="SrcBLabel" value = '+ objTemp._value.source2Adress +'></div> <div class="field"><label for="sourceBTag">sourceB-Tag</label><select id="sourceBTag" name="sourceBTag"><option >VFD 101</option><option >VFD 301</option><option >SCR</option><option >MSV 1</option><option >MSV 2</option><option >FCV-1</option></select></div> '
						 	$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true , Cancel: false},
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
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
										objTemp._eleSet.push(label,SrcALabel,SrcBLabel,SrcAValue)
										
										}
									});

					break;
				case 'PID':
						var str = '<div class="field"><label for="label">LABEL</label><input type="text" name="label" id="label" value = '+ objTemp._value.label +'></div> <div class="field"><label for="Input">Input</label><input type="text" name="input" id="input" value = '+ objTemp._value.input +'></div>'
						$.prompt(str,{
							 		focus: 1,
							 		buttons: { Submit: true, Cancel: false  },
							 		submit: function(e, v, m, f){
							 			if(v == false){return 0}
							 			objTemp._value.label  = f.label == ""? "?" : f.label;
							 			label =  paper.text(objTemp._body.label.attrs.x , objTemp._body.label.attrs.y , type+":"+objTemp._value.label).attr({
											fill : '#ff0000',
											"font-size" : 16,
											'font-weight' : 'bold'
										});;;
							 			objTemp._body.label.remove();
										data.parentObject.functionBlockObject[id]._body.label = label;
										
										objTemp._value.input  = f.input == ""? "?" : f.input;
										input =  paper.text(objTemp.attr.input.attrs.x , objTemp.attr.input.attrs.y ,objTemp._value.input);
										objTemp.attr.input.remove();
										data.parentObject.functionBlockObject[id].attr.input = input ;
										objTemp._eleSet.push(label,input)
										$("#PIDdialog").css({"display":"block"}).dialog('open');
										}
									});

					break;
				default:
					alert("no match")
				}
			},
			deleteb : function(id, data) {
				if(!!ProgramModel.runmode){return 0}
				
				$.prompt("Do you want to delete a Block/element ? ",{
					 focus: 1,
					 show:'slideDown',
					 buttons: {  Confirm: true,Cancel: false },
					 submit: function(e, v, m, f){
					 	if(v==false){return 0}
					 	else{
					 			data.parentObject.functionBlockObject[id]._eleSet.remove();
								data.parentObject.isBlockPresent = false ;
								data.isOccupied = false ;				 		
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
				"toggle" : {
					name : "Toggle",
					icon : "edit"
				},
				"tag" : {
					name : "Tag",
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
			console.log('clicked', this);
		});
		var optionObject = {
			toggle : function() {
				if(!ProgramModel.runmode)
				{
					alert("You can not toggle in Developement mode")
					return 0
				}
				var rungID = id.slice(4, 5);
				var instructionType;
				var x = id.slice(0, 1);
				var objTemp = data.parentObject.functionBlockObject[id];
				if(id.slice(0,3)== 'OUT'){return 0 }
				var i=0;
				for( i=0;i<ProgramModel._collection.length; i++){
					var elem = ProgramModel._collection[i].functionBlockObject[id];
					if(elem != undefined && elem._id == id ){
					break;	
					}
				}

				if (x == 'O'){
					ProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "assert/img/open_toggle.png";}
				else if(x == 'C'){
					ProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  =  "assert/img/close_normal.png";}
				
				var obj = {};
				if(PLCSpace.PLCEditorSpace.isRun){
	    			var label = objTemp._value.label;
	    			var status = objTemp.attr.type;
	    	       obj[label] = status;
	    	                $.ajax({
								type : "POST",
								url : '.../../../configuremm.do',
								dataType : 'json',
								async : true,
								contentType : 'application/json',
								data : JSON.stringify(obj),
								success : function( ) {
									alert("Thanks! ");
								}
							});
	    	}
				
			},
			tag : function() {
				// console.log(data.parentObject.functionBlockObject[id])
				if(!!ProgramModel.runmode)
				{
					alert("You can not add tag in Run mode")
					return 0
				}
				var rungID = id.slice(4,5);
				var paper = ProgramModel.paper;
				var objTemp = data.parentObject.functionBlockObject[id];
				var type = id.slice(0,3);
				if(type == 'OPN' || type == 'CLS' || type == 'OUT')
				{
					var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="label"/></div> <div class="field"><label for="tagname">Tagname</label><select id="tagname" name="tagname"><option>LSL-401</option><option>TSH-401</option><option>PSH-401</option><option>LSL-101</option><option>LSH-201</option><option>LSL-201</option><option>LSH-301</option><option>LSL-301</option><option>P101-R</option><option>P101-T</option><option>P301-R</option><option>P301-T</option><option>R/L</option><option>VPLC SEL</option><option>DCS SEL</option><option>CNTRL LGX SEL</option><option>ACK</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div>';
				}
				else
				{
					var str = '<div class="field"><label for="label">Label</label><input type="text" name="label" id="label"/></div> <div class="field"><label for="tagname">Tagname</label><select id="tagname" name="tagname"><option >P-101</option><option>P-301</option><option>TT-1</option><option>HEATER</option><option>SOV-201</option><option>HOOTER</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option><option>SPARE</option></select></div>';
				}
			 	$.prompt(str,{
			 		focus: 1,
			 		 show:'slideDown',
			 		buttons: {  Submit: true,Cancel: false },
			 		submit: function(e, v, m, f){
			 				if(v==false){return 0}
			 				var obj = {};
			 				objTemp.attr.label.remove()
						 	objTemp._value.label  = f.label == ""? "?" : f.label;
							label =  paper.text(data.coordinate.x + 50, data.coordinate.y + 25, objTemp._value.label);
							data.parentObject.functionBlockObject[id].attr.label = label;
							var presentObj = ProgramModel.lableSet;
							if(presentObj.length == 0 ||presentObj[0][f.label] == null  ){ 
										obj[f.label] = [id];
										ProgramModel.lableSet.push(obj)
							}
							else{
								var eObj = presentObj[0][f.label];
								eObj.push(id);
								
							}
								
							console.log(ProgramModel.lableSet)
							data.parentObject.functionBlockObject[id].attr.tagName = f.tagname;
							data.parentObject.functionBlockObject[id]._eleSet.push(label);
							data.parentObject._eleSet.push(label)
							transformString = data.parentObject._eleSet[0].transform();
							data.parentObject.functionBlockObject[id]._eleSet.transform(transformString);
										PLCSpace.dataStore.UpdateElementLable(
												PLCSpace.view.programID,
												objTemp._id,
												objTemp._value.label)
									}
								});

			},
			deleteb : function(id,data) {
				
				if(!!ProgramModel.runmode){return 0}
					$.prompt("Do you want to delete an element? ",{
				 focus: 1,
				 show:'slideDown',
				 buttons: {  Confirm: true,Cancel: false },
				 submit: function(e, v, m, f){
				 	if(v==false){return 0}
				 	else{
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

				}

				data.parentObject.blockOnRung = null;
				data.isOccupied = false;
						var str = data.id.toString()
      					var onRung = (str.indexOf("-") == -1) ? true : false;
      					if(!!onRung){
      									data.parentObject.contactCount--;
      								}
				 	}
			}})
			},
			cut : function() {
				alert("cut");
			},
			copy : function() {
				alert("copy");
			},
			paste : function() {
				alert("paste");
			}
		}
	}

	var timer = {

		open : function(id) {
			var str = functionTemplate[id]();

			// $("#message").dialog("open");
		},
		close : function(id) {
			$("#message").dialog("close");
		}
	}

	var functionTemplate = {
		TON : function() {
			var htmlString = '<div class = "timer">TagName:<input type = "text">Preset:<input type = "text">Acc:<input type="text"><button id = "submit">Submit</button></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​';
			return htmlString;
		},
		TOFF : function() {
			var htmlString = '<div class = "timer">TagName:<input type = "text">Preset:<input type = "text">Acc:<input type="text"><button id = "submit">Submit</button></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​';
			return htmlString;
		},
		TRET : function() {
			var htmlString = '<div class = "timer">TagName:<input type = "text">Preset:<input type = "text">Acc:<input type="text"><button id = "submit">Submit</button></div>​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​';
			return htmlString;
		}
	}

	/*
	 * various util method
	 */

	var getLastValueOfID = function(id) {
		return parseInt(id.toString().charAt(id.length - 1));
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

	var transformRung = function(x, y, list, index) {
		if (typeof index == 'undefined') {
			list.transform("t " + x + " " + y);
		} else {
			for ( var i = index; i < list.length; i++)
				list[i].transform("t " + x + " " + y);
		}
	}
	var setInstructionId = function(instruction) {
		instructionId = instruction;
	}

	var runMode = function() {
		 var p = ProgramModel.runnableObject;
		 for (var key in p) {
			  if (p.hasOwnProperty(key)) {
			  	
			  	if(p[key]== 0 ){
			  		ProgramModel.runmodeFlag = false;
			  		break;
			  	}else{
			  		ProgramModel.runmodeFlag = true;
			  	}
			    
			  }
			}
		if(!ProgramModel.runmodeFlag){
			alert("Please place an output on rung");
			$("#runMode").attr("disabled", false)
			
		}
		else{
		ProgramModel.runmode = true;
		var paper = ProgramModel.paper;
		ProgramModel.runModeSet = paper.set();
			ProgramModel.runModeSet.push(paper.path("M 80 0 l 0 " + ProgramModel._startingPoint[1] + "z"),
							paper.path("M 1015 0 l 0 " + ProgramModel._startingPoint[1] + " z")
			).attr({
			stroke : '#2B60DE',
			'stroke-width' : 5,
			'fill-opacity' : 1
		})
		/*
*/
		

	}
	}
	var normalMode = function() {
		ProgramModel.runmode = false;
		ProgramModel.runModeSet.remove();
	}
	var deleteElements = function(){
		if(!!ProgramModel.runmode){return 0}
		
		var loop = ProgramModel.loopTodelete;
		if(loop.occupiedPoint.length > 1){
				alert("You can not delete loop")
				return 0;
		}
		$.prompt("Do you want to delete a loop ? ",{
			 focus: 1,
			 show:'slideDown',
			 buttons: {  Confirm: true,Cancel: false },
			 submit: function(e, v, m, f){
			 	if(v==false){return 0}
			 	else{
			 			loop.data.isLoopPlaced  = false;
						loop._eleSet.remove();
						loop._parentObject.loopPointArray[loop._loopPointOnRung].right = null;
						loop = "";
			 		}
		}})
		
		
	}
	
	var showdata = function(jsonObj){
		console.log("showdata")
		console.log(jsonObj);
		/*jsonObj ={ _id :1,
				data : [{
					a:1
				},
				{b: 0 }]
		}*/
		var label = _.keys(jsonObj);
		
		var id; 
			for(var i=0;i< ProgramModel.lableSet.length ; i++){
				var keys = (_.keys(ProgramModel.lableSet[i]));
				 for(var j=0;j< keys.length ; j++)
				 if(keys[j]== label){
				 	id =  ProgramModel.lableSet[i][label];
				 	break;
				 }
				
			}
		var id = id.toString();
		var rungID = id.split("-",id.length)[1];
		var type = id.split("-",id.length)[0];
		var status = jsonObj[label];
		var i=0;
		for( i=0;i<ProgramModel._collection.length; i++){
			var elem = ProgramModel._collection[i].functionBlockObject[id];
			if(elem != undefined && elem._id == id ){
			break;	
			}
		}
		if(type == "OPN" ){		
			(status ==1.0) ?ProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "assert/img/open_toggle.png"
				:
				
				ProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "assert/img/open_normal.png";
		}

		else if(type =="CLS"){
			 ( status == 0.0 ) ?ProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "assert/img/close_toggle.png"
			:
				ProgramModel._collection[i].functionBlockObject[id]._eleSet[0][0].href.baseVal  = "assert/img/close_normal.png";
		}
	}
	var openFile = function(){
		ProgramModel.paper.clear();
		/*for(var p in ProgramModel)
   			 if(ProgramModel.hasOwnProperty(p))
        		ProgramModel[p] = '';*/
		var paper = ProgramModel.paper;
		//console.log(ProgramModel._collection)
		ProgramModel._startingPoint[1]=50;
		ProgramModel.eleset = "";
		ProgramModel.eleset = paper.set();
        ProgramModel.eleset.push(paper.path("M 80 0 l 0 12000 z"), //left Border
        paper.path("M 1015 0 l 0 12000 z"), // right border
        paper.path("M 80 20 l 832 0"), paper.path("M 947 20 l 68 0")).attr({
            stroke: '#73bc1e',
            'stroke-width': 2
        })
        ProgramModel.eleset.push(paper.text(930, 19, "--END--")).attr({
            'font-siz': 22,
            stroke: '#73bc1e'
        });
		var json = PLCSpace.PLCJson;
		console.log(json.length)
		var prog_cnt = json.length;
		var rung_cnt;
		for(var i=0 ;i<prog_cnt;i++)
		{
			rung_cnt = json[i].rungs.length;
			var program = json[i];
			var y = 50;
			for(var j=0 ;j<rung_cnt;j++)
			{
				
				y = ProgramModel._startingPoint[1] ;
				var rung = program.rungs[j];
				rungId = rung.id ;
				var currentRung = drawRung(rungId);
				var rungelement_cnt = rung.elements.length;
				var rungloop_cnt = rung.loops.length;
				
				for(var m=0 ;m<rungelement_cnt;m++)
				{
					
					var element = rung.elements[m];
					eleID = element.attr.id;
					type = eleID.substring(0, 3);
					status = element.attr.status;
					var position = eleID.charAt(eleID.length-1);
					var data = {
						  	id : currentRung._id,
						  	blockOnRung : position,
							 coordinate : {
								x : 95 + (position * 115),
								y : y
							},
							parentObject : currentRung,
							label : element.attr.label
					  	}
					  	if(type == "OPN"){
					  		instructionId = 'openContact';
					  		instructionObject[instructionId](data,status)
					  	}
					  	else if(type == "CLS"){
					  		instructionId = 'closeContact';
					  		instructionObject[instructionId](data,status)
					  	}
					  	else if(type == "OUT"){
					  		instructionId = 'addOutput';
					  		instructionObject[instructionId](data)
					  	}else{
					  		
					  		var fbType = element.attr.attr.type;
					  		var obj = element.attr.attr.functionBlock;
							instructionObject[type](data,obj)
				}
					
					
				}//end of  elements on rung
				for(var k = 0;k < rungloop_cnt ;k++)
				{
					var loop = rung.loops[k];
					
					var data = {
						coordinate : {
							x : 80 + (loop.attr.loopPointOnRung * 115),
							y : y
						},
						id : rungId,
						isLoopPlaced : false ,
						parentObject : currentRung,
						pointOnRung : loop.attr.loopPointOnRung,
						lastYCoordinate : y+50

					}
					
					getloop(data,loop,y,currentRung);
					
					
					
				}//end of loops on rung
				
			}
		}
		return rung_cnt;
	}
	var getloop = function(data,loop,y,parentObject)
	{
		var currentLoop = drawLoop(data);
		var endPositionOfLoop = loop.attr.loopPointOnRung;
		var loopelement_cnt = loop.elements.length;
		loopId = loop.id ;
		for(var l=0 ;l < loopelement_cnt;l++)
		{
						
			var element = loop.elements[l];
			eleID = element.attr.id;
			type = eleID.substring(0, 3);
			status = element.attr.status;
			var position = eleID.charAt(eleID.length-1);
			if(endPositionOfLoop - position < 1)
			{
				for(var n =0 ;n <= (position-endPositionOfLoop);n++){
					expandLoop(currentLoop,parentObject);
								
					}
				endPositionOfLoop += n;
			}
			var data = {
					id : loop.id,
					blockOnRung : position,
					coordinate : {
								x : 95 + (position * 115),
								y : y + 50
					},
							parentObject : currentLoop,
							label : element.attr.label
			}
					  	
			if(type == "OPN"){
					  instructionId = 'openContact';
					  instructionObject[instructionId](data,status)
				}
			else if(type == "CLS"){
					  	instructionId = 'closeContact';
					  	instructionObject[instructionId](data,status)
				}
			else if(type == "OUT"){
					  	instructionId = 'addOutput';
					  	instructionObject[instructionId](data)
				}
				
						
		}//end of elements on loop
		if(loop.loops.length > 0)
		{
			y = y+50;
			var childloop_cnt = loop.loops.length;
			for(var i = 0;i < childloop_cnt;i++)
			{
				var childloop = loop.loops[i];	
				var data = {
						coordinate : {
							x : 80 + (childloop.attr.loopPointOnRung * 115),
							y : y
						},
						id : loopId,
						isLoopPlaced : false ,
						parentObject : currentLoop,
						pointOnRung : childloop.attr.loopPointOnRung,
						lastYCoordinate :y+50
					}
					getloop(data,childloop,y,currentLoop);	
			}
				
		}
		
	} 
	/*
	 Exposing system to outer world
	 */

	return {
		initEditor : initEditor,
		createRung : drawRung,
		instructionId : setInstructionId,
		runMode : runMode,
		normalMode : normalMode,
		openFile : openFile,
			deleteElements : deleteElements,
		showdata :showdata,
		isRun : ProgramModel.runmode
	}
})();