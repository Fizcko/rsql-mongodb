const { ObjectId } = require('bson');

function setType(input) {
    var typedInput = input;

    var matchQuotes = /^(["']{1})(.*)(["']{1})$/g;
    var matchQuotesResults = matchQuotes.exec(input);
    var matchDate = /(\d{4})-(\d{2})-(\d{2})/g;

    // Handle quoted strings - remove quotes and return the inner value
    if(matchQuotesResults){
        typedInput = matchQuotesResults[2];
    }
    // Handle boolean true
    else if(input === 'true'){
        typedInput = true;
    }
    // Handle boolean false
    else if(input === 'false'){
        typedInput = false;
    }
    // Handle null
	else if(input === 'null'){
        typedInput = null;
    }
    // Handle numbers
    else if (!isNaN(Number(input))) {
        typedInput = Number(input);
    }
    // Handle dates (ISO format or partial dates)
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


function setTypeObjectId(input) {
	// Remove quotes and double quotes
	formatedInput = input.replace(/['"]+/g, '');

	// Check if the input is a valid ObjectId (24 hex characters)
	if(ObjectId.isValid(formatedInput))
		return new ObjectId(formatedInput);
	else
		return setType(input);
}

module.exports = function (input) {

    // =========================================================================
    // PHASE 1: TOKENIZATION - Convert input string to Reverse Polish Notation
    // Using Shunting-yard algorithm to handle operator precedence and parentheses
    // =========================================================================

	var outputString = ""; // Buffer for current token being built
	var outputTab = []; // Output queue (RPN result)
	var logicalsTab = []; // Operator stack
	var specialOperator = false; // Flag to track if we're inside =in=() or =out=()

	// Define logical operators and special cases
	var logicals = [';', ',']; // ';' = AND, ',' = OR
	var specialOperators = ['=in=', '=out=']; // Operators that take parenthesized lists
	var regexOperators = ['=regex=', '=notregex=']; // Operators that use regex patterns
	var expForId = ["_id"]; // Fields that should be converted to ObjectId
	var isInQuotes = false; // Track if we're inside single quotes
	var isInRegexValue = false; // Track if we're parsing a regex value

	// Loop through each character of the input string
	for(var i = 0; i < input.length; i++) {

		var character = input[i];

		// Toggle quote tracking to ignore logical operators inside single quotes
		if (character === "'") {
			isInQuotes = !isInQuotes;
		}

		// Check if we just entered a regex value
		if(!isInRegexValue) {
			for(var j = 0; j < regexOperators.length; j++) {
				if(outputString.endsWith(regexOperators[j])) {
					isInRegexValue = true;
					break;
				}
			}
		}

		// Handle logical operators (';' for AND, ',' for OR)
		if(!isInQuotes && logicals.indexOf(character) !== -1) {

			// If we're inside =in=() or =out=(), treat this as literal character
			if(specialOperator){
				outputString += character;
			}
			// Handle escaped characters (e.g., \, or \;) - but not in regex values
			else if(!isInRegexValue && outputString[outputString.length - 1] == "\\"){
				outputString = outputString.substring(0, outputString.length - 1);
				outputString += character;
			}
			else{

				// Get last logical operator from the operator stack
				var lastLogical = logicalsTab[logicalsTab.length - 1];

				// Flush current token to output if there is one
				if(outputString){
					outputTab.push(outputString);
					outputString = "";
					isInRegexValue = false; // Reset regex flag when token is complete
				}

				// Pop operators from stack to output based on precedence
				// In RSQL/MongoDB: ',' (OR) has HIGHER precedence than ';' (AND)
				// This means OR binds tighter and is evaluated first
				// Example: a;b,c;d = a;(b,c);d
				while(logicals.indexOf(lastLogical) !== -1) {
					// If current is ';' (AND) and stack has ',' (OR - higher precedence)
					// Pop the OR first (higher precedence operators pop first)
					if(character == ';' && lastLogical == ','){
						outputTab.push(logicalsTab.pop());
						lastLogical = logicalsTab[logicalsTab.length - 1];
					}
					// If current is ',' (OR) and stack has ';' (AND - lower precedence)
					// Don't pop - OR has higher precedence
					else if(character == ',' && lastLogical == ';'){
						break;
					}
					// If same operator (left-associative), pop from stack
					else if(character == lastLogical){
						outputTab.push(logicalsTab.pop());
						lastLogical = logicalsTab[logicalsTab.length - 1];
					}
					// Otherwise, stop popping
					else{
						break;
					}
				}

				// Push current operator to stack
				logicalsTab.push(character);

			}

		}
		// Handle opening parenthesis
		else if(character === "(") {

			// Check if this parenthesis belongs to a special operator (=in= or =out=)
			if(specialOperators.indexOf(outputString.substring(outputString.length - 4, outputString.length)) !== -1 ||
			   specialOperators.indexOf(outputString.substring(outputString.length - 5, outputString.length)) !== -1){
				// Mark that we're inside a special operator's value list
				specialOperator = true;
				outputString += character;
			}
			// If we're in a regex value, treat ( as part of the pattern
			else if(isInRegexValue){
				outputString += character;
			}
			// Handle escaped parenthesis - but not in regex values where backslash is significant
			else if(outputString[outputString.length - 1] == "\\"){
				outputString = outputString.substring(0, outputString.length - 1);
				outputString += character;
			}
			// This is a grouping parenthesis
			else{
				// Flush current token to output
				if(outputString){
					outputTab.push(outputString);
					outputString = "";
					isInRegexValue = false; // Reset regex flag when token is complete
				}

				// Push the opening parenthesis to operator stack
				logicalsTab.push(character);
			}

		}
		// Handle closing parenthesis
		else if(character === ")") {

			// If this closes a special operator's value list
			if(specialOperator){
				if(!isInRegexValue && outputString[outputString.length - 1] == "\\"){
					outputString = outputString.substring(0, outputString.length - 1);
					outputString += character;
				}
				else{
					specialOperator = false;
					outputString += character;
				}
			}
			// If we're in a regex value, treat ) as part of the pattern
			else if(isInRegexValue){
				outputString += character;
			}
			// Handle escaped parenthesis - but not in regex values where backslash is significant
			else if(outputString[outputString.length - 1] == "\\"){
				outputString = outputString.substring(0, outputString.length - 1);
				outputString += character;
			}
			// This closes a grouping parenthesis
			else{

				// Flush current token to output
				if(outputString){
					outputTab.push(outputString);
					outputString = "";
					isInRegexValue = false; // Reset regex flag when token is complete
				}

				// Pop all operators until we find the matching opening parenthesis
				while(logicalsTab.length > 0 && logicalsTab[logicalsTab.length - 1] !== "(") {
					outputTab.push(logicalsTab.pop());
				}

				// Remove the opening parenthesis from stack
				logicalsTab.pop();

				// Add closing parenthesis as a marker in output
				outputTab.push(character);
			}
		}
		// Regular character - add to current token buffer
		else{
			outputString += character;
		}
	}

	// Flush any remaining token in the buffer
	if(outputString){
		outputTab.push(outputString);
		outputString = "";
		isInRegexValue = false; // Reset regex flag
	}

	// Pop all remaining operators from stack to output
	while(logicalsTab.length > 0) {
		outputTab.push(logicalsTab.pop());
	}

	// =========================================================================
	// PHASE 2: BUILD MONGODB QUERY - Convert RPN to MongoDB query structure
	// Process the tokens in RPN order to build nested MongoDB operators
	// =========================================================================

	var mongoStack = []; // Working stack for building query
	var groupMarkers = []; // Track which stack items are from groups

	for(var i = 0; i < outputTab.length; i++) {

		// Handle logical operators (AND/OR)
		if(logicals.indexOf(outputTab[i]) !== -1){

			// Pop two operands from stack
			var operand2 = mongoStack.pop();
			var isGroup2 = groupMarkers.pop() || false;
			var operand1 = mongoStack.pop();
			var isGroup1 = groupMarkers.pop() || false;

			// Determine MongoDB operator based on RSQL operator
			var mongoOperator = (outputTab[i] == ";") ? '$and' : '$or';

			var result = {};
			var resultIsGroup = false;

			// Only merge if operand1 has the same operator AND it's not from a closed group
			if(!isGroup1 && operand1 && Object.keys(operand1).length === 1 && operand1[mongoOperator]){
				operand1[mongoOperator].push(operand2);
				result = operand1;
				resultIsGroup = false; // Merged result is not a closed group
			}
			// Otherwise create new operator structure
			else{
				result[mongoOperator] = [operand1, operand2];
				// If either operand was a group, the result inherits that status
				resultIsGroup = isGroup1 || isGroup2;
			}

			// Push result back onto stack
			mongoStack.push(result);
			groupMarkers.push(resultIsGroup);

		}
		// Handle opening parenthesis - just a marker, skip it
		else if(outputTab[i] == '('){
			// Opening parenthesis was already handled during tokenization
			// We keep it in outputTab to maintain structure but don't process it here
		}
		// Handle closing parenthesis - marks end of a grouped expression
		else if(outputTab[i] == ')'){
			// Mark the top stack item as coming from a closed group
			// This prevents it from being merged with subsequent operators
			if(groupMarkers.length > 0) {
				groupMarkers[groupMarkers.length - 1] = true;
			}
		}
		// Handle comparison expressions (e.g., firstName=="john")
		else{

			// Security: Check for MongoDB injection attempts
			var mongoQueryOperators = /(\$\w+:)/g;
			var badQuery = mongoQueryOperators.exec(outputTab[i]);

			if(badQuery){
				throw "Injection detected."
			}

			// Parse the RSQL comparison expression
			// Format: field operator value (e.g., firstName=="john")
			var rsqlOperators = /(.*)(==|!=|=gt=|=ge=|=lt=|=le=|=in=|=out=|=regex=|=notregex=|=exists=)(.*)/g;
			var rsqlQuery = rsqlOperators.exec(outputTab[i]);

			try {
				var exp1 = rsqlQuery[1]; // Field name
				var exp2 = rsqlQuery[3]; // Value
				var operator = rsqlQuery[2]; // RSQL operator
			}
			catch(e){
				throw "Wrong RSQL query. No operator found."
			}

			try{
				// Convert value to appropriate JavaScript type
				var typedExp2 = setType(exp2);

				// Special handling for _id field - convert to ObjectId if valid
				if(expForId.indexOf(exp1) !== -1)
					typedExp2 = setTypeObjectId(exp2);

				var mongoOperatorQuery = {};

				// Convert RSQL operator to MongoDB operator
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
						// Parse list: (value1,value2,value3)
						if(typedExp2[0] == "(")
							typedExp2 = typedExp2.slice(1);
						if(typedExp2[typedExp2.length -1] == ")")
							typedExp2 = typedExp2.slice(0, typedExp2.length -1);
						var typedValues = new Array();
						for ( var token of typedExp2.split(",") ) {
							var value = setType(token.trim());
							if(expForId.indexOf(exp1) !== -1)
								value = setTypeObjectId(value);
							typedValues.push(value);
						}
						mongoOperatorQuery[exp1] = { $in: typedValues };
						break;
					case "=out=":
						// Parse list: (value1,value2,value3)
						if(typedExp2[0] == "(")
							typedExp2 = typedExp2.slice(1);
						if(typedExp2[typedExp2.length -1] == ")")
							typedExp2 = typedExp2.slice(0, typedExp2.length -1);
						var typedValues = new Array();
						for ( var token of typedExp2.split(",") ) {
							var value = setType(token.trim());
							if(expForId.indexOf(exp1) !== -1)
								value = setTypeObjectId(value);
							typedValues.push(value);
						}
						mongoOperatorQuery[exp1] = { $nin: typedValues };
						break;
					case "=regex=":
						{
							// Parse regex with optional flags: pattern=flags
							var expArr = exp2.split(/(=)(?=(?:[^"]|"[^"]*")*$)/g);
							const regex = new RegExp(expArr[0]);
							regex.test(''); // Validate regex
							mongoOperatorQuery[exp1] = { $regex: `${setType(expArr[0])}`, $options: expArr[2] || "" };
						}
						break;
					case "=notregex=":
						{
							// Parse regex with optional flags: pattern=flags
							var expArr = exp2.split(/(=)(?=(?:[^"]|"[^"]*")*$)/g);
							const regex = new RegExp(expArr[0]);
							regex.test(''); // Validate regex
							mongoOperatorQuery[exp1] = { $not: { $regex: `${setType(expArr[0])}`, $options: expArr[2] || "" } };
						}
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

			// Push the MongoDB query condition onto the stack
			mongoStack.push(mongoOperatorQuery);
			groupMarkers.push(false); // Regular expressions are not groups
		}
	}

	// The final result should be the only item remaining on the stack
	return mongoStack[0] || null;

}
