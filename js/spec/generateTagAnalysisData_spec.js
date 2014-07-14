/**
 * Created by bcouriol on 14/07/14.
 */
define(['chai', 'readability'], function (chai, RD) {
   var expect = chai.expect;

   // function generateTagAnalysisData($source, tagHTML, TABLE_SELECTORS)
   describe('check title is accurately set', function () {
      it('no tag title in page', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });
      it('empty tag title', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });
      it('non-empty tag title', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });
      it('several non-empty tag titles', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });

   });


});

