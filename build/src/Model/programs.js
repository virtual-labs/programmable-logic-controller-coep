//define(['backboneRelational'], function() {
	

(function(){
	this.Element =Backbone.RelationalModel.extend({
		initialize : function(){
			this.parent = this;
		},
		defaults: {
				inRung : -1,
				inLoop : -1,
		},
		setParent : function(obj){
			this.parent = obj;
		},
		getParent : function(){
			return (this.parent);
		}
	});

	
	this.Loop = Backbone.RelationalModel.extend({
		urlRoot : "/plc/loop",
		idAttribute : "id",
		isProcessed : false,
		relations :[{
			type : Backbone.HasMany,
			key : "loops",
			relatedModel : "Loop",
			reverseRelation: {
	      	key: 'loop',
	      	includeInJSON: 'id',
	    	}
		},{
			type : Backbone.HasMany,
			key : "elements",
			relatedModel : "Element",
			}
		]	
	});
	
	
	this.Rung = Backbone.RelationalModel.extend({
		urlRoot : "/plc/rung",
		idAttribute : "id",
		relations :[
		{
			type : Backbone.HasMany,
			key : "loops",
			relatedModel : "Loop",
			reverseRelation: {
	      	key: 'rung',
	      	includeInJSON: 'id',
	    	}
		},{
			type : Backbone.HasMany,
			key : "elements",
			relatedModel : "Element",
			
		}]
	});
	
	this.Programs = Backbone.RelationalModel.extend({
			urlRoot : "plc/program",
			idAttribute : "id",
			relations :[{
				type : Backbone.HasMany,
				key : "rungs",
				relatedModel : "Rung",
				reverseRelation: {
		      	key: 'program',
		      	includeInJSON: 'id',
		    	}
			}],
			saveToServer : function(){
				var xhr =  this.save("programName" , "main" , {"synchronized": true , 
							"success" : function(){	alert("done")	},
						 	"error" : function(){	alert("error")	}
						});
				//console.log(xhr.statusText)	
			}
		});
			
	
	this.plc = Backbone.Collection.extend({
			model : Programs,		
			urlRoot : "/plc",
			initialize: function( models, options ) {
				options || (options = {});
				this.url = options.url;
			}
			
	});


})(this);

