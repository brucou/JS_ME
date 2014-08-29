/*
* joining dictionary translation tables
*/
SELECT
  pglemmatranslationcz.translation_lemma,
  pglemmatranslationcz.translation_sense,
  pglemmaen.lemma_gram_info,
  pglemmaen.lemma,
  pglemmaen.sense,
  pglemmatranslationcz.translation_gram_info,
  pgsamplesentenceencz.example_sentence_from,
  pgsamplesentenceencz.example_sentence_to,
  pgwordfrequency_short.freq_cat
FROM
  public.pgwordfrequency_short,
  public.pglemmaen,
  public.pglemmatranslationcz,
  public.pgsamplesentenceencz
WHERE
  pglemmatranslationcz.lemma_sense_id = pglemmaen.lemma_sense_id AND
  pglemmatranslationcz.lemma_sense_id = public.pgsamplesentenceencz.lemma_sense_id AND
  pglemmatranslationcz.translation_lemma = pgwordfrequency_short.lemma
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
