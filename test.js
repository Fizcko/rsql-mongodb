const assert = require('assert');
const chai = require('chai'); 
const expect = chai.expect;
const rsqlMongoDB = require('./');

describe('rsql-mongodb', function () {
    it("Test operator Equal To ('==')", function () {
        expect(rsqlMongoDB('lastName=="doe"')).to.deep.include({ "lastName" : "doe" });
        expect(rsqlMongoDB('birthday=="1959-10-21"')).to.deep.include({ "birthday" : "1959-10-21" });
        expect(rsqlMongoDB('birthday==1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('married==true')).to.deep.include({ "married" : true });
        expect(rsqlMongoDB('childs==2')).to.deep.include({ "childs" : 2 });
    });
    it("Test operator Not Equal To ('!=')", function () {
        expect(rsqlMongoDB('lastName!="doe"')).to.deep.include({ "lastName": { $ne: "doe" } });
        expect(rsqlMongoDB('birthday!="1959-10-21"')).to.deep.include({ "birthday": { $ne: "1959-10-21" } });
        expect(rsqlMongoDB('birthday!=1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('married!=true')).to.deep.include({ "married": { $ne: true } });
        expect(rsqlMongoDB('childs!=2')).to.deep.include({ "childs": { $ne: 2 } });
        
    });
    it("Test operator Greater Than ('=gt=')", function () {
        expect(rsqlMongoDB('birthday=gt="1959-10-21"')).to.deep.include({ "birthday": { $gt: "1959-10-21" } });
        expect(rsqlMongoDB('birthday=gt=1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('childs=gt=2')).to.deep.include({ "childs": { $gt: 2 } });
    });
    it("Test operator Greater Or Equal To ('=ge=')", function () {
        expect(rsqlMongoDB('birthday=ge="1959-10-21"')).to.deep.include({ "birthday": { $gte: "1959-10-21" } });
        expect(rsqlMongoDB('birthday=ge=1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('childs=ge=2')).to.deep.include({ "childs": { $gte: 2 } });
    });
    it("Test operator Less Than ('=lt=')", function () {
        expect(rsqlMongoDB('birthday=lt="1959-10-21"')).to.deep.include({ "birthday": { $lt: "1959-10-21" } });
        expect(rsqlMongoDB('birthday=lt=1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('childs=lt=2')).to.deep.include({ "childs": { $lt: 2 } });
    });
    it("Test operator Less Or Equal To ('=le=')", function () {
        expect(rsqlMongoDB('birthday=le="1959-10-21"')).to.deep.include({ "birthday": { $lte: "1959-10-21" } });
        expect(rsqlMongoDB('birthday=le=1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('childs=le=2')).to.deep.include({ "childs": { $lte: 2 } });
    });
    it("Test operator In ('=in=')", function () {
        expect(rsqlMongoDB('childs=in=(1,2,3)')).to.deep.include({ "childs": { $in: [1,2,3] } });
        expect(rsqlMongoDB('childs=in=("1","2","3")')).to.deep.include({ "childs": { $in: ["1","2","3"] } });
    });
    it("Test operator Out ('=out=')", function () {
        expect(rsqlMongoDB('childs=out=(1,2,3)')).to.deep.include({ "childs": { $nin: [1,2,3] } });
        expect(rsqlMongoDB('childs=out=("1","2","3")')).to.deep.include({ "childs": { $nin: ["1","2","3"] } });
    });
    it("Test logical operator AND (';')", function () {
        expect(rsqlMongoDB('firstName=="john";lastName=="doe"')).to.deep.include({ $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] });
    }); 
    it("Test logical operator OR (',')", function () {
        expect(rsqlMongoDB('firstName=="john",firstName=="janne"')).to.deep.include({ $or: [ { "firstName" : "john" } , { "firstName" : "janne" } ] });
    }); 
    it("Test groups", function () {
        expect(rsqlMongoDB('(firstName=="john";lastName=="doe"),(firstName=="janne";lastName=="doe")')).to.deep.include({ $or: [ { $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] } , { $and: [ { "firstName" : "janne" } , { "lastName" : "doe" } ] } ] });
        expect(rsqlMongoDB('(firstName==john;lastName==doe),(firstName=="janne";lastName=="doe")')).to.deep.include({ $or: [ { $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] } , { $and: [ { "firstName" : "janne" } , { "lastName" : "doe" } ] } ] });
    });
    it("Test errors", function () {
        expect(function () { rsqlMongoDB('azerty') }).to.throw('Wrong RSQL query. No operator found.');
        expect(function () { rsqlMongoDB('firstName=={ $where: [ { lastName : "doe" } ] }') }).to.throw('Injection detected.');
    });
});