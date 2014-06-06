/**
 * Created by bcouriol on 7/06/14.
 */
function stub() {
   logEntry("stub");
   var my_url = $("#url_param option:selected").val();
   make_article_readable (my_url);
   logWrite(DBG.TAG.DEBUG, "url", my_url);
   logExit("stub");
}
