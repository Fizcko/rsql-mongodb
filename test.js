const assert = require('assert');
const rsqlMongoDB = require('./');

describe('rsql-mongodb', function () {
    it("Test operator Equal To ('==')", function () {
        assert.equal(rsqlMongoDB('lastName=="doe"'), '{ "lastName" : "doe" }');
        assert.equal(rsqlMongoDB('birthday=="1959-10-21"'), '{ "birthday" : "1959-10-21" }');
        assert.equal(rsqlMongoDB('birthday==1959-10-21'), '{ "birthday" : new Date("1959-10-21") }');
        assert.equal(rsqlMongoDB('married==true'), '{ "married" : true }');
        assert.equal(rsqlMongoDB('childs==2'), '{ "childs" : 2 }');
    });
    it("Test operator Not Equal To ('!=')", function () {
        assert.equal(rsqlMongoDB('lastName!="doe"'), '{ "lastName": { $ne: "doe" } }');
        assert.equal(rsqlMongoDB('birthday!="1959-10-21"'), '{ "birthday": { $ne: "1959-10-21" } }');
        assert.equal(rsqlMongoDB('birthday!=1959-10-21'), '{ "birthday": { $ne: new Date("1959-10-21") } }');
        assert.equal(rsqlMongoDB('married!=true'), '{ "married": { $ne: true } }');
        assert.equal(rsqlMongoDB('childs!=2'), '{ "childs": { $ne: 2 } }');
    });
    it("Test operator Greater Than ('=gt=')", function () {
        assert.equal(rsqlMongoDB('birthday=gt="1959-10-21"'), '{ "birthday": { $gt: "1959-10-21" } }');
        assert.equal(rsqlMongoDB('birthday=gt=1959-10-21'), '{ "birthday": { $gt: new Date("1959-10-21") } }');
        assert.equal(rsqlMongoDB('childs=gt=2'), '{ "childs": { $gt: 2 } }');
    });
    it("Test operator Greater Or Equal To ('=ge=')", function () {
        assert.equal(rsqlMongoDB('birthday=ge="1959-10-21"'), '{ "birthday": { $gte: "1959-10-21" } }');
        assert.equal(rsqlMongoDB('birthday=ge=1959-10-21'), '{ "birthday": { $gte: new Date("1959-10-21") } }');
        assert.equal(rsqlMongoDB('childs=ge=2'), '{ "childs": { $gte: 2 } }');
    });
    it("Test operator Less Than ('=lt=')", function () {
        assert.equal(rsqlMongoDB('birthday=lt="1959-10-21"'), '{ "birthday": { $lt: "1959-10-21" } }');
        assert.equal(rsqlMongoDB('birthday=lt=1959-10-21'), '{ "birthday": { $lt: new Date("1959-10-21") } }');
        assert.equal(rsqlMongoDB('childs=lt=2'), '{ "childs": { $lt: 2 } }');
    });
    it("Test operator Less Or Equal To ('=le=')", function () {
        assert.equal(rsqlMongoDB('birthday=le="1959-10-21"'), '{ "birthday": { $lte: "1959-10-21" } }');
        assert.equal(rsqlMongoDB('birthday=le=1959-10-21'), '{ "birthday": { $lte: new Date("1959-10-21") } }');
        assert.equal(rsqlMongoDB('childs=le=2'), '{ "childs": { $lte: 2 } }');
    });
    it("Test operator In ('=in=')", function () {
        assert.equal(rsqlMongoDB('childs=in=(1,2,3)'), '{ "childs": { $in: [1,2,3] } }');
    });
    it("Test operator Out ('=out=')", function () {
        assert.equal(rsqlMongoDB('childs=out=(1,2,3)'), '{ "childs": { $nin: [1,2,3] } }');
    });
    it("Test logical operator AND (';')", function () {
        assert.equal(rsqlMongoDB('firstName=="john";lastName=="doe"'), '{ $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] }');
    }); 
    it("Test logical operator OR (',')", function () {
        assert.equal(rsqlMongoDB('firstName=="john",firstName=="janne"'), '{ $or: [ { "firstName" : "john" } , { "firstName" : "janne" } ] }');
    }); 
    it("Test groups", function () {
        assert.equal(rsqlMongoDB('(firstName=="john";lastName=="doe"),(firstName=="janne";lastName=="doe")'), '{ $or: [ { $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] } , { $and: [ { "firstName" : "janne" } , { "lastName" : "doe" } ] } ] }');
    }); 
});