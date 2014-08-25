/**
 * Created by bcouriol on 3/06/14.
 */
/* holds copy of texts for temporary holding */

function clean_up(html_text) {
   /*
    currently only removes the <head> tag
    IMPROVEMENT : remove (body, script, css, footer, header, nav) tags
    */
   logEntry("clean_up");
   //logWrite(DBG_TAGS.INFO,"HTML_TEXT : " + html_text);
   var BODY_TAG_OPENING = "<body ";
   var CLOSE_TAG_OPENING = "</body>";
   var open_body_pos = html_text.indexOf(BODY_TAG_OPENING);
   var close_body_pos = html_text.indexOf('data-view="body">', 0);
   var close_close_body_pos = html_text.indexOf(CLOSE_TAG_OPENING, open_body_pos);

   logWrite("INFO", "open_body_pos, close_body_pos, close_close_body_pos", open_body_pos, close_body_pos, close_close_body_pos);
   if (open_body_pos > -1 && close_body_pos > -1 && close_close_body_pos > -1) {
      logExit("clean_up");
      return html_text.slice(close_body_pos, close_close_body_pos);
   }
   logWrite(DBG_TAGS.ERROR,"issue with mandatory html tag");
   return html_text;
}

/*
postgres practice
 */
//http://sqlfiddle.com/#!15/34dd2/58
   /* SELECT to_tsvector('fat cats ate fat rats') @@ to_tsquery('fat & rat'); */
/*
   select to_tsvector('english', 'Obvinění z porušování příměří, které je součástí širšího mírového plánu, však přicházejí i z druhé strany. „Premiér“ proruské Doněcké lidové republiky Alexandr Borodaj na sobotní tiskové konferenci tvrdil, že ostřelování je východoukrajinského města Slavjansk ukrajinskými jednotkami pokračuje. Podobně se vyjádřil také proruský gubernátor Donbasu Pavel Gubarev.')
@@ to_tsquery('english', 'a | se | v | na | je | že | s | z | o | do | to | i | k | ve | si | pro | za | by | ale | jsem | jako | po | V | tak | jsou | které | od | který | jeho | však | už | nebo | byl | jen | co | bude | aby | u | jak | až | A | než | má | jsme | ze | která | když | při | být | bylo
');
select ts_headline('english', '„Vladimir Putin podporuje rozhodnutí prezidenta Ukrajiny Petra Porošenka vyhlásit příměří na jihovýchodě Ukrajiny, stejně jako jeho záměr učinit několik konkrétních kroků k mírovému vyrovnání,“ uvedl Kreml v oficiálním prohlášení.Porošenkův mírový plán by podle Moskvy neměl být ultimátem. Obě strany musí využít příležitost a začít konstruktivní jednání, které povede k politickým kompromisům, citovala prohlášení Kremlu agentura ITAR-TASS.„Hlava ruského státu ale poukázala na to, že navrhovaný plán bez praktických činů k zahájení vyjednávacího procesu není životaschopný a realistický.“Jednostranné zastavení bojů na východě Ukrajiny, které má proruským separatistům umožnit složit zbraně, oznámil Porošenko v pátek. Ukrajinské ministerstvo vnitra k příměří uvedlo, že vládní složky budou střílet jen tehdy, pokud se dostanou pod palbu. Rebelové však zatím odmítli složit zbraně, dokud se armáda nestáhne (více čtěte zde).
' , to_tsquery('english', 'a | se | v | na | je | že | s | z | o | do | to | i | k | ve | si | pro | za | by | ale | jsem | jako | po | V | tak | jsou | které | od | který | jeho | však | už | nebo | byl | jen | co | bude | aby | u | jak | až | A | než | má | jsme | ze | která | když | při | být | bylo'
), 'StartSel="<span class=''highlight''>",StopSel=</span>
   , HighlightAll=true');

   Results:
      „Vladimir Putin podporuje rozhodnutí prezidenta Ukrajiny Petra Porošenka vyhlásit příměří <span class='highlight'>na</span> jihovýchodě Ukrajiny, stejně <span class='highlight'>jako</span> <span class='highlight'>jeho</span> záměr učinit několik konkrétních kroků <span class='highlight'>k</span> mírovému vyrovnání,“ uvedl Kreml <span class='highlight'>v</span> oficiálním prohlášení.Porošenkův mírový plán by podle Moskvy neměl <span class='highlight'>být</span> ultimátem. Obě strany musí využít příležitost a začít konstruktivní jednání, <span class='highlight'>které</span> povede <span class='highlight'>k</span> politickým kompromisům, citovala prohlášení Kremlu agentura ITAR-TASS.„Hlava ruského státu <span class='highlight'>ale</span> poukázala <span class='highlight'>na</span> to, <span class='highlight'>že</span> navrhovaný plán bez praktických činů <span class='highlight'>k</span> zahájení vyjednávacího procesu není životaschopný a realistický.“Jednostranné zastavení bojů <span class='highlight'>na</span> východě Ukrajiny, <span class='highlight'>které</span> <span class='highlight'>má</span> proruským separatistům umožnit složit zbraně, oznámil Porošenko <span class='highlight'>v</span> pátek. Ukrajinské ministerstvo vnitra <span class='highlight'>k</span> příměří uvedlo, <span class='highlight'>že</span> vládní složky budou střílet <span class='highlight'>jen</span> tehdy, pokud <span class='highlight'>se</span> dostanou pod palbu. Rebelové <span class='highlight'>však</span> zatím odmítli složit zbraně, dokud <span class='highlight'>se</span> armáda nestáhne (více čtěte zde).

Czech sentence for checking cs full text search
Příliš žluťoučký kůň se napil žluté vody
select * from ts_debug('cs','Příliš žluťoučký kůň se napil žluté vody');
SELECT ts_lexize('cspell','napil'); ->napit
 */

/*
 client.query("select string_agg(word, ' | ') as freq_words from pgWordFrequency where freq_cat = 'A';",
 function (err, result) {
 if (err) {
 return console.error('error running query', err);
 }
 qryImportantWords = result.rows[0].freq_words;
 console.log("qry: " + qryImportantWords);
 //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
 });
 */

// qunit, jasmine, sinon, mocha, jstestdriver, karma
// ->will use karma with mocha and sinon
// don't forget q.js (promises), Nock (mocks for http and network mocking and expectations)

/* One word for testing function displaying word translation
 pglemmatranslationcz.translation_lemma,
 pglemmatranslationcz.translation_sense,
 pglemmaen.lemma_gram_info,
 pglemmaen.lemma,
 pglemmaen.sense,
 pglemmatranslationcz.translation_gram_info,
 pgwordfrequency_short.freq_cat
 "avšak";"formálněji";"conj";"but";"(yet)";"sp";"A "
 "avšak";"na začátku věty, méně časté";"adv";"however";"(on the other hand)";"sp";"A "
 "avšak";"na začátku věty, méně časté";"adv";"however";"(nonetheless)";"sp";"A "
 "avšak";"na začátku věty, méně časté";"adv";"however";"(despite that)";"sp";"A "
 */

/*
todo:
**translation_lemma** | *translation_sense* | lemma | sense | lemma_gram_info
* Avšak
 (formálněji)	But (yet)	sp
 na začátku věty, méně časté	However (on the other hand)	sp
 na začátku věty, méně časté	However (nonetheless)	sp
 na začátku věty, méně časté	However (despite that)	sp

 div.from_lemma {from_lemma}
 div.from_lemma_sense { from_lemma _sense}
 div.to_lemma {to_lemma}
 div.to_lemma_sense
 div.to_lemma_gram_info
 repeat each

 and then some style info for the classes

 */
