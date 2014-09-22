/*
* joining dictionary translation tables
*/
SELECT DISTINCT pglemmatranslationcz.translation_lemma,
pglemmatranslationcz.translation_sense,
pglemmaen.lemma_gram_info,
pglemmaen.lemma,
pglemmaen.sense,
pglemmatranslationcz.translation_gram_info,
pgsamplesentenceencz.example_sentence_from,
pgsamplesentenceencz.example_sentence_to,
pgwordfrequency_short.freq_cat
FROM pglemmaen
INNER JOIN pglemmatranslationcz ON (pglemmatranslationcz.lemma_sense_id = pglemmaen.lemma_sense_id)
LEFT JOIN pgsamplesentenceencz ON (pglemmatranslationcz.lemma_sense_id = pgsamplesentenceencz.lemma_sense_id)
INNER JOIN pgwordfrequency_short ON (pglemmatranslationcz.translation_lemma = pgwordfrequency_short.lemma)
WHERE LOWER (pglemmatranslationcz.translation_lemma) in
    (select unnest(string_to_array (RIGHT (LEFT (ts_lexize('cspell', 'dosavadní')::varchar, -1), -1), ',')))

ORDER BY
  pgwordfrequency_short.lemma ASC;
/*
* Some select to check lemmatization of postgres and word singled as being most frequent
*/
select * from pgWordFrequency where freq_cat = 'A' ;/* gives back 1000 words e.g. 500 roots aprox. */

select * from pgWordFrequency where frequency > 12000; /* gives back 1000 words e.g. 500 roots aprox. */
select to_tsquery('cs',string_agg(word, ' | ')) from pgWordFrequency where freq_cat = 'A'; /* gives back 1000 words e.g. 500 roots aprox. */
select string_agg(word, ' | ') from pgWordFrequency where freq_cat = 'A'; /* gives back 1000 words e.g. 500 roots aprox. */

select to_tsquery('cs', string_agg(word, " | ")) from pgWordFrequency where frequency > FREQ.LEVEL.I -> qFreqQuery
put result in query
select ts_headline('cs', text_sent_by_io , qFreqQuery),
'StartSel="<span class=''highlight''>",StopSel=</span>, HighlightAll=true');

-- check correspondence between lemma from postgres and lemma from excel file
select * from (SELECT right(left(ts_lexize('cspell','Moskva')::varchar,-1),-1) AS lexeme) AS TEMP LEFT JOIN pgwordfrequency_short  ON (lower(lemma) = TEMP.lexeme)
select * from pgwordfrequency_short where lemma like '%oskva'

-- how many lemma I have translated
SELECT DISTINCT
  pglemmatranslationcz.translation_lemma
FROM
  public.pglemmaen
  INNER JOIN public.pglemmatranslationcz ON (pglemmatranslationcz.lemma_sense_id = pglemmaen.lemma_sense_id)
  LEFT JOIN public.pgsamplesentenceencz ON (pglemmatranslationcz.lemma_sense_id = public.pgsamplesentenceencz.lemma_sense_id)
  INNER JOIN public.pgwordfrequency_short on (pglemmatranslationcz.translation_lemma = pgwordfrequency_short.lemma)
