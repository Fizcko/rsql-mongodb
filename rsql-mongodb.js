module.exports = function (input) {

    // Define variables
    var outputString = "";
    var outputTab = [];
    var logicalsTab = [];
    var specialOperator = false;

    var logicals = [';', ','];
    var specialOperators = ['=in=', '=out='];

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

            switch(outputTab[i]){
                case ";":
                    var newValue = '{ $and: [ ' + mongoStack[mongoStack.length - 2] + ' , ' + mongoStack[mongoStack.length - 1] + ' ] }';
                    mongoStack.pop();
                    mongoStack.pop();
                    mongoStack.push(newValue);
                    break;
                case ",":
                    var newValue = '{ $or: [ ' + mongoStack[mongoStack.length - 2] + ' , ' + mongoStack[mongoStack.length - 1] + ' ] }';
                    mongoStack.pop();
                    mongoStack.pop();
                    mongoStack.push(newValue);
                    break;
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
            var rsqlOperators = /(.*)(==|!=|=gt=|=ge=|=lt=|=le=|=in=|=out=)(.*)/g;
            var rsqlQuery = rsqlOperators.exec(outputTab[i]);

            try {
                var exp1 = rsqlQuery[1];
                var exp2 = rsqlQuery[3];
                var operator = rsqlQuery[2];
                
            }
            catch(e){
                throw "Wrong RSQL query."
            }

            // Check if there is a date in exp2
            var checkString = /^(\"|\').*(\"|\')$/g;
            if(!checkString.exec(exp2)){
                var checkDate = /(\d{4})-(\d{2})-(\d{2})/g;
                if(checkDate.exec(exp2)){
                    if(Date.parse(exp2)){
                        exp2 = 'new Date("' + exp2 + '")'
                    }
                }
            }

            switch(operator){
                case "==":
                    mongoStack.push('{ "' + exp1 + '" : ' + exp2 + ' }');
                    break;
                case "!=":
                    mongoStack.push('{ "' + exp1 + '": { $ne: ' + exp2 + ' } }');
                    break;
                case "=gt=":
                    mongoStack.push('{ "' + exp1 + '": { $gt: ' + exp2 + ' } }');
                    break;
                case "=ge=":
                    mongoStack.push('{ "' + exp1 + '": { $gte: ' + exp2 + ' } }');
                    break;
                case "=lt=":
                    mongoStack.push('{ "' + exp1 + '": { $lt: ' + exp2 + ' } }');
                    break;
                case "=le=":
                    mongoStack.push('{ "' + exp1 + '": { $lte: ' + exp2 + ' } }');
                    break;
                case "=in=":
                    exp2 = exp2.replace("(","[");
                    exp2 = exp2.replace(")","]");
                    mongoStack.push('{ "' + exp1 + '": { $in: ' + exp2 + ' } }');
                    break;
                case "=out=":
                    exp2 = exp2.replace("(","[");
                    exp2 = exp2.replace(")","]");
                    mongoStack.push('{ "' + exp1 + '": { $nin: ' + exp2 + ' } }');
                    break;
            }
            
        }

    }

    return mongoStack[0] || null;

}