/**
 * Created by bcouriol on 14/07/14.
 */
define(['chai'], function (chai) {
   var expect = chai.expect;
   /*html_text =
    '<p> S odkazem na sdělení čínské firmy to v pátek uvedla agentura Reuters. This is in order to have a minimum of five paragraphs. The bad thing is I need to have at least five paragraphs to be selected. So here are two in English and one in czech, with enough words to have a high average and be selected. propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';
    */
   // function generateTagAnalysisData($source, tagHTML, TABLE_SELECTORS)
   describe('Testing text_handling.js', function () {
      describe('get_text_stats', function () {
         it('Accurate count with one sentence', function () {
            var test_one_sentence = "La visita coincide con el 25º aniversario de las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental.";
            expect(get_text_stats(test_one_sentence)).to.deep.equal({sentence_number: 1, avg_sentence_length: 36});
         });


         it('Accurate count with two sentences', function () {
            var test_two_sentences = "La visita coincide con el 25º aniversario de las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental. El presidente de Estados Unidos, acusado de descuidar los derechos humanos en favor de la realpolitik, pronunciará el miércoles un discurso con ocasión de este aniversario.";
            expect(get_text_stats(test_two_sentences).sentence_number).to.deep.equal(2);
            expect(get_text_stats(test_two_sentences).avg_sentence_length).to.deep.equal(Math.round(62 / 2));
         });

         it('Accurate count with four sentences', function () {
            var test_four_sentences_and_slash_n = "Varsovia es la primera etapa de un viaje de Obama que también le llevará a Bruselas y Francia, y que marca el regreso de Europa como preocupación fundamental de Estados Unidos, tras años de desinterés en los que este país ha intentado un giro hacia Asia. La reorientación no se ha aparcado, insiste la Casa Blanca, pero tras las acciones de Putin en Ucrania el Viejo Continente es de nuevo una prioridad.\n" +
                                                  "La visita coincide con el 25º aniversario de las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental. El presidente de Estados Unidos, acusado de descuidar los derechos humanos en favor de la realpolitik, pronunciará el miércoles un discurso con ocasión de este aniversario.";
            expect(get_text_stats(test_four_sentences_and_slash_n).sentence_number).to.deep.equal(4);
            expect(get_text_stats(test_four_sentences_and_slash_n).avg_sentence_length).to.deep.equal(Math.round(134 /
                                                                                                                 4));
         });

         it('Accurate count with lots of spaces', function () {
            var test_four_sentences_and_spaces = "Varsovia     es      la    primera etapa de un viaje    de Obama que también le llevará a Bruselas y Francia, y que marca el regreso de Europa como preocupación fundamental de Estados Unidos, tras años de desinterés en los que este país ha intentado un giro hacia Asia. La reorientación no se ha aparcado, insiste la Casa Blanca, pero tras las acciones de Putin en Ucrania el Viejo Continente es de nuevo una prioridad.\n" +
                                                 "La visita      coincide con     el      25º     aniversario de      las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental. El presidente de Estados Unidos, acusado de descuidar los derechos humanos en favor de la realpolitik, pronunciará el miércoles un discurso con ocasión de este aniversario.";
            expect(get_text_stats(test_four_sentences_and_spaces).sentence_number).to.deep.equal(4);
            expect(get_text_stats(test_four_sentences_and_spaces).avg_sentence_length).to.deep.equal(Math.round(134 /
                                                                                                                4));
         });

         it('"normal" punctuation ,;!\? signs, lots of spaces', function () {
            var test_four_sentences_and_punct = "Varsovia!     es?      la:    primera, etapa; de un viaje    de Obama que también le llevará a Bruselas y Francia, y que marca el regreso de Europa como preocupación fundamental de Estados Unidos, tras años de desinterés en los que este país ha intentado un giro hacia Asia. La reorientación no se ha aparcado, insiste la Casa Blanca, pero tras las acciones de Putin en Ucrania el Viejo Continente es de nuevo una prioridad.\n" +
                                                "La visita      coincide con     el      25º     aniversario de      las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental. El presidente de Estados Unidos, acusado de descuidar los derechos humanos en favor de la realpolitik, pronunciará el miércoles un discurso con ocasión de este aniversario.";
            expect(get_text_stats(test_four_sentences_and_punct).sentence_number).to.deep.equal(4);
            expect(get_text_stats(test_four_sentences_and_punct).avg_sentence_length).to.deep.equal(Math.round(134 /
                                                                                                               4));
         });

         it('limit cases : space before punct sign : and ?', function () {
            var test_limit_cases_space_punct = "Varsovia!     es ?      la :    primera, etapa; de un viaje    de Obama que también le llevará a Bruselas y Francia, y que marca el regreso de Europa como preocupación fundamental de Estados Unidos, tras años de desinterés en los que este país ha intentado un giro hacia Asia. La reorientación no se ha aparcado, insiste la Casa Blanca, pero tras las acciones de Putin en Ucrania el Viejo Continente es de nuevo una prioridad.\n" +
                                               "La visita      coincide con     el      25º     aniversario de      las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental. El presidente de Estados Unidos, acusado de descuidar los derechos humanos en favor de la realpolitik, pronunciará el miércoles un discurso con ocasión de este aniversario.";
            expect(get_text_stats(test_limit_cases_space_punct).sentence_number).to.deep.equal(4);
            expect(get_text_stats(test_limit_cases_space_punct).avg_sentence_length).to.deep.equal(Math.round(134 / 4));
         });

         it('limit cases : empty', function () {
            var test_limit_cases_empty_spaces = "     ";
            expect(get_text_stats(test_limit_cases_empty_spaces).sentence_number).to.deep.equal(1);
            expect(get_text_stats(test_limit_cases_empty_spaces).avg_sentence_length).to.deep.equal(Math.round(0));
         });

         it('limit cases : full of spaces or punct', function () {
            var test_limit_cases_empty_spaces = "   !:?  ";
            expect(get_text_stats(test_limit_cases_empty_spaces).sentence_number).to.deep.equal(1);
            expect(get_text_stats(test_limit_cases_empty_spaces).avg_sentence_length).to.deep.equal(Math.round(0));
         });


         it('limit cases : czech punctuation (date format)', function () {
            var test_limit_cases_czech_date = "   1.6.2014  !?:";
            expect(get_text_stats(test_limit_cases_czech_date).sentence_number).to.deep.equal(1);
            expect(get_text_stats(test_limit_cases_czech_date).avg_sentence_length).to.deep.equal(Math.round(3));
         });
      });

      describe('getWordAtPoint', function () {
         it('pending figuring out a way');
      });


      describe('clean_text', function () {
         it('no tag title in page');
      });

      describe('disaggregate_input', function () {
         it('no tag title in page');
      });
   });
});

