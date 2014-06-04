/**
 * Created by bcouriol on 3/06/14.
 */
/* holds copy of texts for temporary holding */

/*
logWrite("INFO", "element", element.nodeType, element.tagName, $(this).attr("id"),
         element.textContent.slice(0, 30), hierarchy[0] ? $(hierarchy[0]).attr("class") : "??");
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