var your_url = 'http://www.lemonde.fr/pixels/article/2014/06/03/accueillir-snowden-en-france-les-points-cles-du-debat_4431332_4408996.html';
setDebugMode(false);

/**********************
 * MAIN BODY
 */
url_load(your_url, extract_relevant_text_from_html);
$("#destination p").mousemove(function (e) {
   console.log("Found: " + getWordAtPoint(e.target, e.clientX, e.clientY));
});


// todo configure git : ok for sharing on remote, now check in and out in local and push to remote
// todo modularize js

