/**
 * Created by bcouriol on 1/06/14.
 */

var wpToRead = "assets/El incendio de un edifico durante los choques en Odesa deja 31 muertos.html"
var wpToRead2 = "assets/djokovic ne pensait qu a ca.htm";
var wpToRead3 = "assets/oracle guerre brevet.htm";

function requestReadTextFile(file) {
   var rawFile = new XMLHttpRequest();
   var allText;
   rawFile.open("GET", file, true);
   rawFile.onreadystatechange = readTextFile;
   rawFile.send(null);

   function readTextFile() {
      if (rawFile.readyState === 4) {
         if (rawFile.status === 200 || rawFile.status == 0) {
            webPage = rawFile.responseText;
         }
      }
   }
}

//requestReadTextFile(wpToRead2);

/*setTimeout(function(){
 ecrire(webPage);
 aData = []; // array where to store stats about tags in page
 generateTagAnalysisData("#source", "p", aData);
 wInsert.innerHTML="";
 $("#destination").hover(function(e){
 console.log("Found: " + getWordAtPoint(e.target, e.clientX, e.clientY));
 }, function () {});
 $("#destination").click(function(e){
 console.log("Found: " + getWordAtPoint(e.target, e.clientX, e.clientY));
 }, function () {});
 // il faut rajouter faire en sorte qu'il soit sorti et aussi quand il sort vraiment, mouseover just quand il rentre
 //analyzeHTML("<p>Salon des joueurs à Monte-Carlo. Pluie fine. Novak Djokovic est à l'heure. Souriant malgré un poignet droit qui le fait souffrir. Naviguant entre ses pulsions d'exigence absolue, son éternelle quête de perfection et cette volonté plus récemment affichée de prendre du recul. Le Serbe essaie de relativiser sa relation aux résultats. Pas facile, quand on a perdu son statut de numéro 1 depuis le 7 octobre dernier. Pas facile, quand on reste sur quatre finales de Grand Chelem perdues sur les six dernières disputées. Pas facile, quand on n'est plus tenant d'aucun titre du « Big Four ». Pas facile enfin de céder face au Suisse Stanislas Wawrinka en quarts de finale de l'Open d'Australie, où il n'avait plus perdu depuis 2010, mettant ainsi fin à une série de 14 victoires de rang face au futur vainqueur de l'édition 2014. Redevenir numéro 1 sans tomber dans la quête obsessionnelle. Faire mine de ne plus revendiquer la quête d'absolu pour mieux l'apprivoiser. Vainqueur à Miami et à Indian Wells cette saison, le Serbe s'essaie à tirer des bords, habité par cette ambivalence. Paradoxe gagnant ?</p><p>«Vous avez un point commun avec Victoria Beckham, Oprah Winfrey, Jennifer Aniston ou encore Gwyneth Paltrow. Lequel ?Elles mangent sans gluten comme moi ?Gagné. Et ça change quoi pour vous ?Je me sens mieux dans mon être, en tant que joueur et aussi dans ma vie quotidienne. Nous sommes entrés dans une ère où chacun essaye de faire attention à son corps, à son hygiène de vie, à son bien-être. À ce qu'on mange et à ce qu'on boit. Tout cela concourt également à se sentir bien dans sa tête. La santé ce n'est pas une affaire de docteur. C'est une responsabilité individuelle. Longtemps, face à mes « coups de pompe », j'ai cru que je craquais mentalement. Je me suis mis à la méditation et au yoga. Et en même temps j'ai augmenté de manière obsessionnelle mes doses à l'entraînement. Je progressais, mais sans atteindre mon rêve de toucher le sommet.</p><p>Pourquoi aujourd'hui essayer de convaincre, à travers un livre (1), ceux qui ne font pas d'intolérance au gluten de suivre votre régime alimentaire ?Je ne suis pas en croisade. Je veux juste partager mon expérience de vie. Et raconter comment ma relation à l'hygiène alimentaire m'a fait avancer. À la fois comme être humain et comme joueur de tennis. J'ai pris conscience que j'avais le pouvoir de vivre mieux en agissant sur mes habitudes de vie. De devenir maître de moi-même.Vous vivez à Monaco, où la cuisine italienne domine, vos parents tenaient une pizzeria en Yougoslavie. Comment faites-vous pour ne pas succomber à la tentation ?Les gens l'ignorent, mais on peut manger des pâtes sans gluten. Je n'ai donc aucun souci à me lâcher. Je me fais plaisir et je mange des pâtes comme tout le monde. Sans gluten, c'est tout.Vous ne craquez jamais face à un bon croissant, une baguette bien croustillante ?Mon corps et mon esprit sont habitués à ce régime. J'y prends même plaisir. Jamais je ne renonce. Et puis je trouve ça bon. Mais je reconnais qu'au début, en 2010, ça n'a pas été simple. En Serbie, aussi, il y a des boulangeries à chaque coin de rue et ça sent bon... Quand je passais devant, au début, j'avais la tentation d'y entrer. C'est fini. J'ai éliminé toutes les toxines que j'avais en moi. Mon message va bien au-delà du gluten. Il vise à responsabiliser chacun sur ce qu'il mange, ce qui lui fait du bien ou pas. La nourriture est notre carburant. Pour un sportif de haut niveau, c'est essentiel. J'ai perdu quatre kilos depuis 2010, je suis devenu numéro 1 et j'ai gagné cinq tournois du Grand Chelem, dont le mythique Wimbledon, contre un seul avant. Et j'en ai fini avec mes allergies et mon asthme. Je suis aussi devenu plus confiant. Moins sensible aux peurs.</p>");
 //wInsert.append(aData.toString());
 }
 , 1000);
 */
