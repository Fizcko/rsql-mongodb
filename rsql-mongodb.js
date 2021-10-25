function setType(input) {

    var typedInput = input;

    var matchQuotes = /^(["']{1})(.*)(["']{1})$/g;
    var matchQuotesResults = matchQuotes.exec(input);
    var matchDate = /(\d{4})-(\d{2})-(\d{2})/g;

    if(matchQuotesResults){
        typedInput = matchQuotesResults[2];
    }
    else if(input === 'true'){
        typedInput = true;
    }
    else if(input === 'false'){
        typedInput = false;
    }
    else if (!isNaN(Number(input))) {
        typedInput = Number(input);
    }
    else if(matchDate.exec(input)){
        if(Date.parse(input)){
            var isoUTCDate = new Date(input).toISOString();
            typedInput = new Date(isoUTCDate);
        }
		else{
			throw "Invalid Date."
		}
    }

    return typedInput;
}

module.exports = function (input) {

    // Define variables
	var outputString = "";
	var outputTab = [];
	var logicalsTab = [];
	var specialOperator = false;

	// Define logical & special operators
	var logicals = [';', ','];
	var specialOperators = ['=in=', '=out='];

	// Apply Shunting-yard algorithm applied to this use case
	//
	// Loop for each character of the input string
	for(var i = 0; i < input.length; i++) {

		// Move into input string
		var character = input[i];

		// If the character is a logical operator
		if(logicals.indexOf(character) !== -1) {
			
			// If the character is a special operator
			if(specialOperator){
				outputString += character;
			}
			else{
				
				// Get last logical operator in the 'logicalsTab'
				var lastLogical = logicalsTab[logicalsTab.length - 1];

				// If there is something into buffer 'outputString' push it into 'outputTab'
				if(outputString){
					outputTab.push(outputString);
					outputString = ""; 
				}

				// Push the logical character into 'outputTab' if the last logical operator is not the same that the current
				while(logicals.indexOf(lastLogical) !== -1) {
					if(lastLogical == character){
						logicalsTab.pop();
					}
					else{
						outputTab.push(logicalsTab.pop());
					}
					
					lastLogical = logicalsTab[logicalsTab.length - 1];
				}

				// Push the character into 'logicalsTab'
				logicalsTab.push(character);

			}

		} 
		// If the character is an open parenthesis
		else if(character === "(") {

			// if the parenthesis is value of a special operator then push it into 'outputString' buffer
			if(specialOperators.indexOf(outputString.substring(outputString.length - 4, outputString.length)) !== -1 || specialOperators.indexOf(outputString.substring(outputString.length - 5, outputString.length)) !== -1){
				specialOperator = true;
				outputString += character;
			}
			// Else push the character into the 'logicalsTab'
			else{
				
				// Push all operator presents in 'logicalsTab' into 'outputTab'
				while(logicalsTab.length > 0) {
					outputTab.push(logicalsTab.pop());
				}
				logicalsTab.push(character);
				outputTab.push(character);
			}

		} 
		// If the character is a closed parenthesis
		else if(character === ")") {

			// if the parenthesis is value of a special operator then push it into 'outputString' buffer
			if(specialOperator){
				specialOperator = false;
				outputString += character;
			}
			else{

				// If there is something into buffer 'outputString' push it into 'outputTab'
				if(outputString){
					outputTab.push(outputString);
					outputString = ""; 
				}

				// Push all operator presents in the parenthesis into 'outputTab'
				while(logicalsTab[logicalsTab.length - 1] !== "(") {
					outputTab.push(logicalsTab.pop());
				}
				
				// Remove the open parenthesis from 'logicalsTab'
				logicalsTab.pop();
				outputTab.push(character);
			}
		}
		// If the character is not an operator push it into the 'outputString' buffer
		else{

			outputString += character;

		}
	}

	// If there is something into buffer 'outputString' push it into 'outputTab'
	if(outputString){

		outputTab.push(outputString);
		outputString = "";
	}

	// Push all operator presents in 'logicalsTab' into 'outputTab'
	while(logicalsTab.length > 0) {
		outputTab.push(logicalsTab.pop());
	}

	
	// Now format the MongoDb Query

	// Define variables
	var mongoStack = [];
	var mongoQuery = [];
	var tmpPrecedence = [];
	var lastLogical = "";
	var lastLogicalBeforePrecedence = ""
	
	for(var i = 0; i < outputTab.length; i++) {

		if(logicals.indexOf(outputTab[i]) !== -1){

			var newValue = {};
			var tmpArray = [];

			switch(outputTab[i]){
				case ";":
				case ",":
					if(i == (outputTab.length -1) || (mongoQuery.length == 1)){
						while(mongoQuery.length > 0) {
							tmpArray.push(mongoQuery.shift())
						}
					}
					while(mongoStack.length > 0) {
						tmpArray.push(mongoStack.shift())
					}
					if(outputTab[i] == ";"){
						lastLogical = '$and';
						newValue[lastLogical] = tmpArray;
					}
					else{
						lastLogical = '$or';
						newValue[lastLogical] = tmpArray;
					}
					break;
				default:
					throw "Logical operator not supported."
			}

			mongoQuery.push(newValue);

		}
		else if( outputTab[i] == '('){
			tmpPrecedence = mongoQuery.shift();
			lastLogicalBeforePrecedence = lastLogical;
		}
		else if( outputTab[i] == ')'){
			if(tmpPrecedence){
				tmpPrecedence[lastLogicalBeforePrecedence].push(mongoQuery.shift());
				mongoQuery.push(tmpPrecedence);

			}else{

			}
		}
		else{

			// Verify if the is no injections
			var mongoQueryOperators = /(\$\w+:)/g;
			var badQuery = mongoQueryOperators.exec(outputTab[i]);

			if(badQuery){
				throw "Injection detected."
			}

			// Split the query
			var rsqlOperators = /(.*)(==|!=|=gt=|=ge=|=lt=|=le=|=in=|=out=|=~|=exists=)(.*)/g;
			var rsqlQuery = rsqlOperators.exec(outputTab[i]);

			try {
				var exp1 = rsqlQuery[1];
				var exp2 = rsqlQuery[3];
				var operator = rsqlQuery[2];
				
			}
			catch(e){
				throw "Wrong RSQL query. No operator found."
			}


			try{

				var typedExp2 = setType(exp2);
				var mongoOperatorQuery = {};

				switch(operator){
					case "==":
						mongoOperatorQuery[exp1] = typedExp2;
						break;
					case "!=":
						mongoOperatorQuery[exp1] = { $ne: typedExp2 };
						break;
					case "=gt=":
						mongoOperatorQuery[exp1] = { $gt: typedExp2 };
						break;
					case "=ge=":
						mongoOperatorQuery[exp1] = { $gte: typedExp2 };
						break;
					case "=lt=":
						mongoOperatorQuery[exp1] = { $lt: typedExp2 };
						break;
					case "=le=":
						mongoOperatorQuery[exp1] = { $lte: typedExp2 };
						break;
					case "=in=":
						typedExp2 = typedExp2.replace("(","");
						typedExp2 = typedExp2.replace(")","");
						var typedValues = new Array();
						for ( var token of typedExp2.split(",") ) {
							typedValues.push(setType(token.trim()));
						}
						mongoOperatorQuery[exp1] = { $in: typedValues };
						break;
					case "=out=":
						typedExp2 = typedExp2.replace("(","");
						typedExp2 = typedExp2.replace(")","");
						var typedValues = new Array();
						for ( var token of typedExp2.split(",") ) {
							typedValues.push(setType(token.trim()));
						}
						mongoOperatorQuery[exp1] = { $nin: typedValues };
						break;
					case "=~":
						var expArr = exp2.split(/(=)(?=(?:[^"]|"[^"]*")*$)/g);
						mongoOperatorQuery[exp1] = { $regex: setType(expArr[0]), $options: expArr[2] || "" };
						break;
					case "=exists=":
						mongoOperatorQuery[exp1] = { $exists: typedExp2 };
						break;
					default:
						throw "Operator not supported."
				}
			}
			catch(error){
				throw error;
			}

			mongoStack.push(mongoOperatorQuery);
			
		}

	}
	
	if(mongoStack.length == 1 && mongoQuery.length == 0){
		mongoQuery = mongoStack;
	}

    return mongoQuery[0] || null;

}