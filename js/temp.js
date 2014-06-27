/**
 * Created by bcouriol on 3/06/14.
 */
/* holds copy of texts for temporary holding */

/*
logWrite("INFO", "element", element.nodeType, element.tagName, $(this).attr("id"),
         element.textContent.slice(0, 30), hierarchy[0] ? $(hierarchy[0]).attr("class") : "??");
   */

/*
 Unit Testing of utils
var gre;
// test isArray
logWrite(DBG.TAG.DEBUG, "is Array []", isArray([]));
logWrite(DBG.TAG.DEBUG, "is Array (null)", isArray(null));
logWrite(DBG.TAG.DEBUG, "is Array (undefined)", isArray(gre));
//OK!!

var g = caching(function (x) {
   return 2 * x;
}, []);


logWrite(DBG.TAG.DEBUG, "Testing with 2, 1, 10", g([2, 1, 10]));
logWrite(DBG.TAG.DEBUG, "the same values second time and new one", g([2, 1, 10, 3]));
 */

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
table creation:

   CREATE TABLE aWordList (
   word        varchar(40) CONSTRAINT firstkey PRIMARY KEY
);

insert into aWordList (word)  values ('a');
insert into aWordList (word)  values ('se');
insert into aWordList (word)  values ('v');
insert into aWordList (word)  values ('na');
insert into aWordList (word)  values ('je');
insert into aWordList (word)  values ('že');
insert into aWordList (word)  values ('s');
insert into aWordList (word)  values ('z');
insert into aWordList (word)  values ('o');
insert into aWordList (word)  values ('do');
insert into aWordList (word)  values ('to');
insert into aWordList (word)  values ('i');
insert into aWordList (word)  values ('k');
insert into aWordList (word)  values ('ve');
insert into aWordList (word)  values ('si');
insert into aWordList (word)  values ('pro');
insert into aWordList (word)  values ('za');
insert into aWordList (word)  values ('by');
insert into aWordList (word)  values ('ale');
insert into aWordList (word)  values ('jsem');
insert into aWordList (word)  values ('jako');
insert into aWordList (word)  values ('po');
insert into aWordList (word)  values ('V');
insert into aWordList (word)  values ('tak');
insert into aWordList (word)  values ('jsou');
insert into aWordList (word)  values ('které');
insert into aWordList (word)  values ('od');
insert into aWordList (word)  values ('který');
insert into aWordList (word)  values ('jeho');
insert into aWordList (word)  values ('však');
insert into aWordList (word)  values ('už');
insert into aWordList (word)  values ('nebo');
insert into aWordList (word)  values ('byl');
insert into aWordList (word)  values ('jen');
insert into aWordList (word)  values ('co');
insert into aWordList (word)  values ('bude');
insert into aWordList (word)  values ('aby');
insert into aWordList (word)  values ('u');
insert into aWordList (word)  values ('jak');
insert into aWordList (word)  values ('až');
insert into aWordList (word)  values ('A');
insert into aWordList (word)  values ('než');
insert into aWordList (word)  values ('má');
insert into aWordList (word)  values ('jsme');
insert into aWordList (word)  values ('ze');
insert into aWordList (word)  values ('která');
insert into aWordList (word)  values ('když');
insert into aWordList (word)  values ('při');
insert into aWordList (word)  values ('být');
insert into aWordList (word)  values ('bylo');


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
