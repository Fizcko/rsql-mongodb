const assert = require('assert');
const chai = require('chai'); 
const expect = chai.expect;
const rsqlMongoDB = require('./');
const { ObjectId } = require('bson');

describe('rsql-mongodb', function () {
    it("Test null return", function () {
        expect(rsqlMongoDB('')).to.be.null;
    });
    it("Test operator Equal To ('==')", function () {
        expect(rsqlMongoDB('lastName=="doe"')).to.deep.include({ "lastName" : "doe" });
        expect(rsqlMongoDB('birthday=="1959-10-21"')).to.deep.include({ "birthday" : "1959-10-21" });
        expect(rsqlMongoDB('birthday==1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('married==true')).to.deep.include({ "married" : true });
        expect(rsqlMongoDB('childs==null')).to.deep.include({ "childs" : null });
        expect(rsqlMongoDB('childs==2')).to.deep.include({ "childs" : 2 });
        expect(rsqlMongoDB('creationDate==2021-10-30T00:00:00.000Z')).to.be.a('object');
        expect(rsqlMongoDB('_id==650a7389a7ab39ddcfbc6832')).to.deep.include({ "_id": new ObjectId('650a7389a7ab39ddcfbc6832') });
        expect(rsqlMongoDB('_id==650a7389a7ab39ddcfbc683')).to.deep.include({ "_id": '650a7389a7ab39ddcfbc683' });
        expect(rsqlMongoDB('_id=="650a7389a7ab39ddcfbc6832"')).to.deep.include({ "_id": new ObjectId('650a7389a7ab39ddcfbc6832') });
        expect(rsqlMongoDB("_id=='650a7389a7ab39ddcfbc6832'")).to.deep.include({ "_id": new ObjectId('650a7389a7ab39ddcfbc6832') });
        expect(rsqlMongoDB('lastName=="janne\\(doe\\)"')).to.deep.include({ "lastName" : "janne(doe)" });
        expect(rsqlMongoDB('lastName=="janne\\;doe"')).to.deep.include({ "lastName" : "janne;doe" });
        expect(rsqlMongoDB('lastName=="janne\\,doe"')).to.deep.include({ "lastName" : "janne,doe" });
    });
    it("Test operator Not Equal To ('!=')", function () {
        expect(rsqlMongoDB('lastName!="doe"')).to.deep.include({ "lastName": { $ne: "doe" } });
        expect(rsqlMongoDB('birthday!="1959-10-21"')).to.deep.include({ "birthday": { $ne: "1959-10-21" } });
        expect(rsqlMongoDB('birthday!=1959-10-21')).to.be.a('object');
        expect(rsqlMongoDB('married!=false')).to.deep.include({ "married": { $ne: false } });
        expect(rsqlMongoDB('childs!=null')).to.deep.include({ "childs": { $ne: null } });
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
        expect(rsqlMongoDB('childs=in=(1, 2, 3 )')).to.deep.include({ "childs": { $in: [1,2,3] } });
        expect(rsqlMongoDB('_id=in=(650a7389a7ab39ddcfbc6832,650a7389a7ab39ddcfbc6833)')).to.deep.include({ "_id": { $in: [new ObjectId('650a7389a7ab39ddcfbc6832'),new ObjectId('650a7389a7ab39ddcfbc6833')] }});
        expect(rsqlMongoDB('invoice.userid=in=("XXFF11 \\(180kW\\)")')).to.deep.include({ "invoice.userid": { $in: ['XXFF11 (180kW)'] } });
    });
    it("Test operator Out ('=out=')", function () {
        expect(rsqlMongoDB('childs=out=(1,2,3)')).to.deep.include({ "childs": { $nin: [1,2,3] } });
        expect(rsqlMongoDB('childs=out=("1","2","3")')).to.deep.include({ "childs": { $nin: ["1","2","3"] } });
        expect(rsqlMongoDB('childs=out=(1, 2, 3 )')).to.deep.include({ "childs": { $nin: [1,2,3] } });
        expect(rsqlMongoDB('invoice.userid=out=("XXFF11 \\(180kW\\)")')).to.deep.include({ "invoice.userid": { $nin: ['XXFF11 (180kW)'] } });
    });
    it("Test operator Like ('=regex=')", function () {
        expect(rsqlMongoDB('lastName=regex=do*')).to.deep.include({ "lastName": { $regex: "do*", $options: "" } });
        expect(rsqlMongoDB('lastName=regex=.*oe')).to.deep.include({ "lastName": { $regex: ".*oe", $options: "" } });
        expect(rsqlMongoDB('lastName=regex=do*=i')).to.deep.include({ "lastName": { $regex: "do*", $options: "i" } });
        expect(rsqlMongoDB('lastName=regex=do*=mxs')).to.deep.include({ "lastName": { $regex: "do*", $options: "mxs" } });
        expect(rsqlMongoDB('lastName=regex="do=*"=mxs')).to.deep.include({ "lastName": { $regex: "do=*", $options: "mxs" } });
    });
    it("Test operator Exists ('=exists=')", function () {
        expect(rsqlMongoDB('childs=exists=true')).to.deep.include({ "childs": { $exists: true } });
        expect(rsqlMongoDB('childs=exists=false')).to.deep.include({ "childs": { $exists: false } });
        expect(rsqlMongoDB('childs=exists=true')).to.be.a('object');
    });
    it("Test logical operator AND (';')", function () {
        expect(rsqlMongoDB('firstName=="john";lastName=="doe"')).to.deep.include({ $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] });
        expect(rsqlMongoDB('lastName=="doe";_id==650a7389a7ab39ddcfbc6832')).to.deep.include({ $and: [ { "lastName" : "doe" }, { "_id" : new ObjectId('650a7389a7ab39ddcfbc6832') } ] });
    }); 
    it("Test logical operator OR (',')", function () {
        expect(rsqlMongoDB('firstName=="john",firstName=="janne"')).to.deep.include({ $or: [ { "firstName" : "john" } , { "firstName" : "janne" } ] });
    }); 
    it("Test groups", function () {
        expect(rsqlMongoDB('(firstName==john;lastName==doe),(firstName==janne;lastName==doe)')).to.deep.include({ $or: [ { $and: [ { "firstName" : "john" } , { "lastName" : "doe" } ] } , { $and: [ { "firstName" : "janne" } , { "lastName" : "doe" } ] } ] });
        expect(rsqlMongoDB('(firstName==john,firstName==janne),married==true;lastName==doe')).to.deep.include({$and:[{$or:[{$or:[{"firstName":"john"},{"firstName":"janne"}]},{"married":true}]},{"lastName":"doe"}]});
    });
    it("Test other cases", function () {
        expect(rsqlMongoDB('firstName==john,firstName==janne,firstName==jim')).to.deep.include({$or:[{"firstName":"john"},{"firstName":"janne"},{"firstName":"jim"}]});
        expect(rsqlMongoDB('firstName==john,firstName==janne,firstName==jim;lastName==doe')).to.deep.include({$and:[{$or:[{"firstName":"john"},{"firstName":"janne"},{"firstName":"jim"}]},{"lastName":"doe"}]});
        expect(rsqlMongoDB('a==1;(b==2,c==3)')).to.deep.include({"$and":[{"a":1},{"$or":[{"b":2},{"c":3}]}]});
        expect(rsqlMongoDB('(b==2,c==3);a==1')).to.deep.include({"$and":[{"$or":[{"b":2},{"c":3}]},{"a":1}]});
    });  
    it("Test errors", function () {
        expect(function () { rsqlMongoDB('azerty') }).to.throw('Wrong RSQL query. No operator found.');
        expect(function () { rsqlMongoDB('lastName=~do*') }).to.throw('Wrong RSQL query. No operator found.');
        expect(function () { rsqlMongoDB('lastName=regex=*oe') }).to.throw('Invalid regular expression');
        expect(function () { rsqlMongoDB("name=='SELECT (CHaR(75)||CHaR(76)||CHaR(77))'") }).to.throw('Wrong RSQL query. No operator found.');
        expect(function () { rsqlMongoDB('firstName=={ $where: [ { lastName : "doe" } ] }') }).to.throw('Injection detected.');
        expect(function () { rsqlMongoDB('birthday==1959-21-12') }).to.throw('Invalid Date.');
    });
});
