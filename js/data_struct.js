/**
 * Created by bcouriol on 2/06/14.
 */

var DS = DS || {
   ParagraphData: function ParagraphData(init_object) {
      /* For each paragraph, calculate a series of indicators
       number of sentences
       average length of sentences in words
       number of links
       the first enclosing div
       */
      // limit cases : init_object not defined
      init_object = init_object || {};

      this.$el = init_object.$el || null;
      this.tag = init_object.tag;
      this.text = init_object.text // text content of the tag
      this.sentence_number = init_object.sentence_number;
      this.avg_sentence_length = init_object.avg_sentence_length; //average length of sentences in words
      this.enclosing_div = init_object.enclosing_div; // first enclosing div
      this.enclosing_div_id = init_object.enclosing_div_id;
      this.enclosing_div_class = init_object.enclosing_div_class;

      this.toString = function () {
         return [this.$el.selector, this.tag, this.text.slice(0, 40), this.sentence_number, this.avg_sentence_length,
                 this.enclosing_div, "$$$"].join("\\");
      }
   }
}
