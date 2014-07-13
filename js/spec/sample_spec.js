/**
 * Created by bcouriol on 11/07/14.
 */

define(['chai','readability'], function(chai, RD) {
   var expect = chai.expect;

   describe('bootstrap', function() {
      it('chai should work', function() {
         expect('a').to.equal('a');
      });

      it('sinon should work', function() {

         function Obj() {}
         Obj.prototype.method = function() {
            return ('I am Obj#method()');
         };

         sinon.stub(Obj.prototype, 'method', function() {
            return ('I am Sinon stub!');
         });

         var obj = new Obj();
         expect(obj.method()).to.equal('I am Sinon stub!');

         Obj.prototype.method.restore();
         expect(obj.method()).to.equal('I am Obj#method()');
      });
   });
   describe('testing readability', function() {
      it ('require js works with RD', function () {
         expect (RD.getIndexInArray([{div: "hello"}, {div: "hi"}], "div", "hi")).to.equal(1);
      })});
});

