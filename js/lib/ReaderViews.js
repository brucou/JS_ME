/**
 * Created by bcouriol on 28/08/14.
 */
define([], function () {
  var RV = {};
  var tpl = [];
  tpl.push("<div class='translation'>");
  tpl.push("<table>");
  tpl.push("<thead>");
  tpl.push("<tr>");
  tpl.push("<th colspan='3'>{{translation_lemma}}</th>");
  tpl.push("</tr>");
  tpl.push("</thead>");
  tpl.push("<tbody>");
  tpl.push("{{#result_rows}}");
  tpl.push("<tr>");
  tpl.push("<td> {{translation_sense}}</td>");
  tpl.push("<td> {{lemma}}</td>");
  tpl.push("<td> {{sense}}</td>");
  tpl.push("</tr>");
  tpl.push("<tr>");
  tpl.push("<td colspan='3' class='sample_sentence_from'> {{example_sentence_from}}<br>");
  tpl.push("                                                <strong>{{example_sentence_to}}</strong></td>");
  tpl.push("</tr>");
  /**             tpl.push("<tr>");
   tpl.push("<td colspan='3' class='sample_sentence_to'> {{example_sentence_to}}</td>");
   tpl.push("</tr>");
   */             tpl.push("{{/result_rows}}");
  tpl.push("</tbody>");
  tpl.push("</table>");
  tpl.push("</div>");
  RV.translation_template = tpl.join("\n");

  return RV;
});

