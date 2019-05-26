# rsql-mongodb

Converting RSQL queries to MongoDB queries.

## Installation

```bash
$ npm install rsql-mongodb
```

## What is RSQL

RSQL is a query language that introduces basic and logical operators. It is perfect for RESTful APIs.

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

###### NOTE
Parenthesized expression can be used to define the precedence.

## Examples

```js
const rsqlMongoDB = require('rsql-mongodb');

// String comparison : you have to add quotes for string values
rsqlMongoDB('lastName=="doe"');
//=> { "lastName" : "doe" }

// Boolean comparison
rsqlMongoDB('married!=true');
//=> { "married": { $ne: true } }

// Number comparison
rsqlMongoDB('childs=gt=2');
//=> { "childs": { $gt: 2 } }

// Date comparison
rsqlMongoDB('birthday=ge=1959-10-21');
//=> { "birthday": { $gte: new Date("1959-10-21") } }

// In comparison
rsqlMongoDB('childs=in=(1,2,3)');
//=> { "childs": { $in: [1,2,3] } }

// Out comparison
rsqlMongoDB('childs=out=(1,2,3)');
//=> { "childs": { $nin: [1,2,3] } }

// Groups
rsqlMongoDB('(firstName=="john";lastName=="doe"),(firstName=="janne";lastName=="doe")');
//=> { $or: [ { $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] } , { $and: [ { "firstName" : "janne" } , { "lastName" : "doe" } ] } ] }
```