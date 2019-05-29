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
            typedInput = new Date('"' + input + '"');
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

    var logicals = [';', ','];
    var specialOperators = ['=in=', '=out='];

    // Apply Shunting-yard algorithm applied to this use case
    // Loop for each character of the input string
    for(var i = 0; i < input.length; i++) {

        var character = input[i];

        if(logicals.indexOf(character) !== -1) {

            if(specialOperator){
                outputString += character;
            }
            else{
                
                var lastLogical = logicalsTab[logicalsTab.length - 1];

                if(outputString){
                    outputTab.push(outputString);
                    outputString = ""; 
                }

                while(logicals.indexOf(lastLogical) !== -1) {
                    outputTab.push(logicalsTab.pop());
                    lastLogical = logicalsTab[logicalsTab.length - 1];
                }

                logicalsTab.push(character);
            }

        } else if(character === "(") {

            if(specialOperators.indexOf(outputString.substring(outputString.length - 4, outputString.length)) !== -1 || specialOperators.indexOf(outputString.substring(outputString.length - 5, outputString.length)) !== -1){
                specialOperator = true;
                outputString += character;
            }
            else{
                logicalsTab.push(character);
            }

        } else if(character === ")") {

            if(specialOperator){
                specialOperator = false;
                outputString += character;
            }
            else{

                if(outputString){
                    outputTab.push(outputString);
                    outputString = ""; 
                }

                while(logicalsTab[logicalsTab.length - 1] !== "(") {
                    outputTab.push(logicalsTab.pop());
                }

                logicalsTab.pop();
            }
        }
        else{

            outputString += character;

        }
    }

    if(outputString){

        outputTab.push(outputString);
        outputString = "";
    }

    while(logicalsTab.length > 0) {
        outputTab.push(logicalsTab.pop());
    }

    
    var mongoStack = [];
    
    // Now format to mongo
    for(var i = 0; i < outputTab.length; i++) {

        if(logicals.indexOf(outputTab[i]) !== -1){

            var newValue = {};

            switch(outputTab[i]){
                case ";":
                    newValue['$and'] = [mongoStack[mongoStack.length - 2],mongoStack[mongoStack.length - 1]];
                    break;
                case ",":
                    newValue['$or'] = [mongoStack[mongoStack.length - 2],mongoStack[mongoStack.length - 1]];
                    break;
                default:
                    throw "Logical operator not supported."
                    break;
            }

            mongoStack.pop();
            mongoStack.pop();
            mongoStack.push(newValue);

        }
        else{

            // Verify if the is no injections
            var mongoQueryOperators = /(\$\w+:)/g;
            var badQuery = mongoQueryOperators.exec(outputTab[i]);

            if(badQuery){
                throw "Injection detected."
            }

            // Split the query
            var rsqlOperators = /(.*)(==|!=|=gt=|=ge=|=lt=|=le=|=in=|=out=)(.*)/g;
            var rsqlQuery = rsqlOperators.exec(outputTab[i]);

            try {
                var exp1 = rsqlQuery[1];
                var exp2 = rsqlQuery[3];
                var operator = rsqlQuery[2];
                
            }
            catch(e){
                throw "Wrong RSQL query. No operator found."
            }


            var typedExp2 = setType(exp2);
            var mongoQuery = {};

            switch(operator){
                case "==":
                    mongoQuery[exp1] = typedExp2;
                    break;
                case "!=":
                    mongoQuery[exp1] = { $ne: typedExp2 };
                    break;
                case "=gt=":
                    mongoQuery[exp1] = { $gt: typedExp2 };
                    break;
                case "=ge=":
                    mongoQuery[exp1] = { $gte: typedExp2 };
                    break;
                case "=lt=":
                    mongoQuery[exp1] = { $lt: typedExp2 };
                    break;
                case "=le=":
                    mongoQuery[exp1] = { $lte: typedExp2 };
                    break;
                case "=in=":
                    typedExp2 = typedExp2.replace("(","");
                    typedExp2 = typedExp2.replace(")","");
                    var typedValues = new Array();
                    for ( var token of typedExp2.split(",") ) {
                        typedValues.push(setType(token));
                    }
                    mongoQuery[exp1] = { $in: typedValues };
                    break;
                case "=out=":
                    typedExp2 = typedExp2.replace("(","");
                    typedExp2 = typedExp2.replace(")","");
                    var typedValues = new Array();
                    for ( var token of typedExp2.split(",") ) {
                        typedValues.push(setType(token));
                    }
                    mongoQuery[exp1] = { $nin: typedValues };
                    break;
                default:
                    throw "Operator not supported."
                    break;
            }

            mongoStack.push(mongoQuery);
            
        }

    }

    return mongoStack[0] || null;

}