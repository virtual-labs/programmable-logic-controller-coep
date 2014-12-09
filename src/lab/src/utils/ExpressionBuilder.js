/**
 * @author Priya
 * Evaluates the Ciruit Equation 
 * Parse : creates the array of  equation translets them into postfix expression , 
 * executes the postfix expression
 */

(function(){
	 expBuilder = {
		variables :[],
		withVariable  :function(name , value){			
			this.variables[name] = value;
		},
		getVariable : function(){
			return expBuilder.variables;
		},
		checkch : function(c){
			var ch = c.toUpperCase();
			var ch="";
			if(ch >= 'A' && ch <= 'Z'){
					return true;
			}else 
				    return false;

		},
		isAlpha : function(ch){	
			return (ch != '*' && ch != '+' && ch != '(' && ch != ')') ?  true :   false;			
		},
		isBoolean : function(op){			
			if(op>="1.0" || op >="1")
					return 1;
			else if(op<="0.0" || op <="0")
				    return 0;
			//return (op >= "1.0" || op<="0.0") ? true : false;
		},
		replacech : function(exp){
			var newExp="";
			for(var i=0;i<exp.length;i++){
				if(exp[i]=="&"){
					newExp +="*";
				}else if(exp[i]=="|"){
					newExp +="+";
				}else{
					newExp = newExp + exp[i];
				}			
			}			
			return newExp;			
		},	
			
		build : function(exp){
			var equation =this.replacech(exp);
			var customExp = "";
			var customExp1 = "";
			var len=equation.length;
			var cnt=0;
			var ch;
			/*while(cnt<=len){
			
				if(cnt != len+1){
								ch =equation.charAt(cnt);
								if(this.isAlpha(ch)){
									customExp = customExp + ch;
								}else{
									if(ch =='(' )
									{
										
									}else if(customExp ==')'){
										customExp1 = customExp1 +")";
									}else{
										customExp1 = customExp1 +this.variables[customExp];
										}
									customExp="";
									switch(ch){
									 case "*"  : 
												 customExp1 = customExp1+"&";
												 break;
									 case "+"  : customExp1 = customExp1+"|";
												 break;
									 case "("  : customExp1 = customExp1+"(";
												 break;			
									 case ")"  : customExp = customExp + ch;
												break;			
									 case ""  : customExp1 = customExp1;
									 break;
																		  }
									
								}
								
							}								
							cnt++;*/
			for (var i = 0; i < equation.length; i++){
			 if(this.isAlpha(equation[i])){
				 
			 	customExp = customExp + equation[i];
			 	if(this.variables[customExp] != undefined)
			 		customExp1 = customExp1 + this.variables[customExp];
			 }			 
			 	// this.variables[equation[i]];			 	
			 else{
				//customExp = this.variables[customExp];
				
				 customExp="";
			 		switch(equation[i]){
			 			case "*"  :customExp1 = customExp1+"&";
			 						break;
			 			case "+"  :customExp1 = customExp1+"|";
			 					break;
			 			case "("  :customExp1 = customExp1+"(";
			 					break;
			 			case ")"  :customExp1 = customExp1+")";
			 					break;
			 		}
			 	}
			 
			}			
			
			
		    //console.log("customExp1 >> :"+customExp1);
			return customExp1;
		},		
		calculate : function(exp1){
			var arrtoken = expBuilder.parse(exp1);
			var postfixToken =  expBuilder.toPostfixExpression(arrtoken);
			//console.log("postfixToken :"+postfixToken);
			var output=  expBuilder.evaluate(postfixToken);
			return output;
			//return expBuilder.evaluate(arrtoken);
		},		
		toPostfixExpression : function(arrToks){				
		   var arrPFix  = [];
		   var  stack  = [];
			var intIndex = 0;
		    // Infix to postfix converter
		    for (var cntr = 0; cntr < arrToks.length; cntr++)
		    {
		    		var strTok = arrToks[cntr];
	               	
	             	switch(strTok){
	             		case "&" : 
	             		case "|" : 	  
	             			 		if(stack.length == 0)
										stack.push(strTok);          				
				                else
				                {
				             		while(stack.length !=0){	             					
	             							var str = stack.pop();
	             							arrPFix[intIndex] = str;
				                            intIndex++;			
				             		} 
	             					stack.push(strTok);
	             				}
	             				break;
	             		case '(':      
						case ')' :
						    		break;
	             		default : if(this.isBoolean(strTok)){
	             					strTok = 1;	             						
	             						//strTok = (strTok.toUpperCase() == "TRUE")? true  :false;
	             					}else{
             							strTok = 0;
	             					}	             		
	             					arrPFix[intIndex] = strTok;
	                  				  intIndex++;
	             					break;
	             	}					                     
	    	}

		    // Pop remaining operators from stack.
			while (!stack.length==0)
			{
				arrPFix[intIndex] = stack.pop();
				 intIndex++;
			} 
		    //console.log(arrPFix)
		    return arrPFix;
	
		},		
		parse : function(exp){
			var token = [];
			var strtoken = "";
			var cntr = 0;
			var len = exp.length;
			while(cntr < len){
				var chr = exp.charAt(cntr);
				switch(chr){
				case '&' : if(strtoken.length > 0){
					token.push(strtoken);
					strtoken= "";
				}
				token.push(chr);

				break;
				case '|' : if(strtoken.length > 0){
					token.push(strtoken);
					strtoken= "";
				}
				token.push(chr);
				break;
				case '(' : if(strtoken.length > 0){
					token.push(strtoken);
					strtoken= "";
				}
				token.push(chr);
				break;
				case ')' : if(strtoken.length > 0){
					token.push(strtoken);
					strtoken= "";
				}
				token.push(chr);
				break;

				default : 
					strtoken = strtoken + chr;
				break;
				}
				
				cntr++;
			}
			if(strtoken.length > 0){
					token.push(strtoken);
				}
			//console.log("Token "+token);
			return token;
  		 },
    
		evaluate : function(arrtoken){
			
			/*var len = arrtoken.length;
			var iterator = 0;
			var stack = [];
			while(iterator < len){
				var ope = arrtoken[iterator];
				switch(ope){
				case ")":
						var op2 = stack.pop();
						var op  = stack.pop();
						var op1 = stack.pop();
						stack.pop();
						
						if (op == "&")
							stack.push((op1 & op2));
						else if (op == "|")
							stack.push((op1 || op2));
						break;
				default :stack.push(ope);
						break;					
				
				}
				iterator++;
			}*/			
			
			var len = arrtoken.length;
			var iterator = 0;
			var stack = [];
			var conatiner = [];
			while(iterator < len){
				var ope = arrtoken[iterator];
				switch(ope){
					case "&" :
					case "|" :  
							var op2 = stack.pop();
							var op1 = stack.pop();
							if (ope == "&")
									stack.push((op1 & op2));
							else if (ope == "|")
									stack.push((op1 || op2));
							break;
					case ")" : var ch = stack.pop();
									while(ch != '('){
										conatiner.push(ch);
										ch = stack.pop();
									}
									conatiner.pop();
									if(conatiner.length >0)evaluate(conatiner);
									
									
					default : stack.push(ope);
							  break;
				}
				iterator++;
			}
			var output = stack.pop();
			//console.log("output: "+output);
			return output;
		}
	}
})();
