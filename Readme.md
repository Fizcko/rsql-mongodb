# rsql-mongodb

Converting RSQL queries to MongoDB queries.

[![NPM Version][npm-image]][npm-url]
[![Build][build-image]][build-url]
[![Coverage][coveralls-image]][coveralls-url]

## Installation

```bash
$ npm install rsql-mongodb
```

## What is RSQL

RSQL (RESTful Service Query Language) is based on FIQL (Feed Item Query Language).  
It's a query language that introduces basic and logical operators. This is perfect for RESTful APIs.

#### Basic operators supported
- Equal to : ==
- Not equal to : !=
- Less than : =lt=
- Less than or equal to : =le=
- Greater than : =gt=
- Greater than or equal to : =ge=
- In : =in=
- Not in : =out=

#### Logical operators supported
- AND : ;
- OR : ,

#### Additionals operators
- Like : =~ (to match regex values)
- Exists : =exists= (to check if property exists)

###### NOTE
Parenthesized expression can be used to define the precedence.

## Return values

Return an Object or null.  
This object can be passed to mongoDB methods find(), findOne(), ...

## Examples

```js
const rsqlMongoDB = require('rsql-mongodb');

try{

    // String comparison : you can add quotes to force string values
    rsqlMongoDB('lastName=="doe"');
    //=> { "lastName" : "doe" }
    rsqlMongoDB('lastName==janne');
    //=> { "lastName" : "janne" }

    // Boolean comparison
    rsqlMongoDB('married!=true');
    //=> { "married": { $ne: true } }

    // Number comparison
    rsqlMongoDB('childs=gt=2');
    //=> { "childs": { $gt: 2 } }

    // Date comparison
    rsqlMongoDB('birthday=ge=1959-10-21');
    //=> { "birthday": { $gte: new Date("1959-10-21T00:00:00.000Z") } }

    // In comparison
    rsqlMongoDB('childs=in=(1,2,3)');
    //=> { "childs": { $in: [1,2,3] } }

    // Out comparison
    rsqlMongoDB('childs=out=(1,2,3)');
    //=> { "childs": { $nin: [1,2,3] } }

    // Like operator
    rsqlMongoDB('lastName=~do*');
    //=> { "lastName": { $regex: "do*", $options: "" } }

    // Like operator with options
    rsqlMongoDB('lastName=~do*=si');
    //=> { "lastName": { $regex: "do*", $options: "si" } }
    rsqlMongoDB('lastName=~"do=*"=si');
    //=> { "lastName": { $regex: "do=*", $options: "si" } }

    // Exists operator
    rsqlMongoDB('childs=exists=true');
    //=> { "childs": { $exists: true } }

    // Groups
    rsqlMongoDB('(firstName=="john";lastName=="doe"),(firstName==janne;lastName==doe)');
    //=> { $or: [ { $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] } , { $and: [ { "firstName" : "janne" } , { "lastName" : "doe" } ] } ] }
    
}
catch(err){
    console.log(err);
}
```

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/rsql-mongodb.svg
[npm-url]: https://npmjs.org/package/rsql-mongodb
[build-image]: https://travis-ci.org/Fizcko/rsql-mongodb.svg?branch=master
[build-url]: https://travis-ci.org/Fizcko/rsql-mongodb
[coveralls-image]: https://coveralls.io/repos/github/Fizcko/rsql-mongodb/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/Fizcko/rsql-mongodb?branch=master