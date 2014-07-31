/**
 * Created by bcouriol on 14/07/14.
 */
define(['chai'], function (chai) {
   var expect = chai.expect;

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

         it('computes well with nested tags', function () {
            var test_four_sentences_and_punct = "Varsovia!     es?      la:    primera, etapa; de un viaje    de Obama que también le llevará a Bruselas y Francia, y que marca el regreso de Europa como preocupación fundamental de Estados Unidos, tras años de desinterés en los que este país ha intentado un giro hacia Asia. La reorientación no se ha aparcado, insiste la Casa Blanca, pero tras las acciones de Putin en Ucrania el Viejo Continente es de nuevo una prioridad.\n" +
                                                "La visita     <ul><li>have</li></ul> coincide con     el      25º     aniversario de      las primeras elecciones parcialmente democráticas en Polonia, que dieron la victoria al movimiento Solidaridad y aceleraron el fin del dominio de la URSS en Europa central y oriental. El presidente de Estados Unidos, acusado de descuidar los derechos humanos en favor de la realpolitik, pronunciará el miércoles un discurso con ocasión de este aniversario.";
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

         /* todo: finish
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
         */
      });

      describe('clean_text', function () {
         it('sentence with trailing and leading spaces and extra spaces and new lines', function () {
            var test_one_sentence = "   La visita \rcoincide \r\n con   el 25º \n   aniversario.  \n ";
            expect(clean_text(test_one_sentence)).to.deep.equal("La visita coincide con el 25º aniversario.");
         });
         it('sentence without any trailing and leading spaces and extra spaces and new lines', function () {
            var test_one_sentence = "La visita coincide con el 25º aniversario.";
            expect(clean_text(test_one_sentence)).to.deep.equal("La visita coincide con el 25º aniversario.");
         });
      });

      describe('disaggregate_input', function () {
         it('various common punctuation signs and extra spaces', function () {
            var test_sentence = "La visita coincide con el 25º aniversario.    Shaangu získá v rámci dohody \"letter of intent\", která vymezuje obsah budoucí smlouvy, exkluzivitu pro jednání s českou firmou na dobu 120 dní, uvádí se v materiálu zveřejněném čínskou společností.";
            var aResults = disaggregate_input(test_sentence);
            var aExpectedResults = ["La", "visita", "coincide", "con", "el", "25", "º", "aniversario", ".", "Shaangu",
                                    "získá", "v", "rámci", "dohody", "\"", "letter", "of", "intent", "\"", ",", "která",
                                    "vymezuje", "obsah", "budoucí", "smlouvy", ",", "exkluzivitu", "pro", "jednání",
                                    "s", "českou", "firmou", "na", "dobu", "120", "dní", ",", "uvádí", "se", "v",
                                    "materiálu", "zveřejněném", "čínskou", "společností", "."];
            expect(aResults.length).to.equal(45);
            expect(aResults).to.deep.equal(aExpectedResults);
         });
         it('unusual punctuation signs and extra spaces', function () {
            var test_sentence = "¿Por qué Yellen apunta a las redes sociales como burbuja bursátil? ¡no se por qué! 50% of them are wrong. #follow_me bruno.couriol@gmail.com Refer to §2. Per thousands ‱ triple prime‴";
            var aResults = disaggregate_input(test_sentence);
            var aExpectedResults = ["¿", "Por", "qué", "Yellen", "apunta", "a", "las", "redes", "sociales", "como",
                                    "burbuja", "bursátil", "?", "¡", "no", "se", "por", "qué", "!", "50", "%", "of",
                                    "them", "are", "wrong", ".", "#", "follow", "_", "me", "bruno", ".", "couriol", "@",
                                    "gmail", ".", "com", "Refer", "to", "§", "2", ".", "Per", "thousands", "‱",
                                    "triple", "prime", "‴"];
            expect(aResults.length).to.equal(48);
            expect(aResults).to.deep.equal(aExpectedResults);
         });
      });
   });

   describe('getWordAtPoint', function () {
      it('pending figuring out a way');
   });
});

