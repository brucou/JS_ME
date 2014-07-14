/**
 * Created by bcouriol on 14/07/14.
 */
define(['chai', 'readability'], function (chai, RD) {
   var expect = chai.expect;
   /*html_text =
    '<p> S odkazem na sdělení čínské firmy to v pátek uvedla agentura Reuters. This is in order to have a minimum of five paragraphs. The bad thing is I need to have at least five paragraphs to be selected. So here are two in English and one in czech, with enough words to have a high average and be selected. propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';
    */
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

