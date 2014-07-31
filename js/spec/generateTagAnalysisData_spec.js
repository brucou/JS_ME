/**
 * Created by bcouriol on 14/07/14.
 */
define(['chai', 'readability', 'data_struct', 'utils_spec', 'socketio'], function (chai, RD, DS, US, IO) {
   var expect = chai.expect;
   // function generateTagAnalysisData($source)
   // initialize the test by creating some content in the $source

   before(function (done) {
      var RPC_NAMESPACE = '/rpc';
      var server_address = 'http://localhost:3000';
      var host = [server_address, RPC_NAMESPACE].join("");
      var options = {
         'reconnection delay'  : 0,
         'reopen delay'        : 0,
         'connect timeout'     : 1000,
         //transports: ['polling', 'websocket'],
         'force new connection': true
      };
      this.rpc_socket = io.connect(host, options);
      this.socket = this.rpc_socket.socket;
      var _socket = this.socket;
      _socket.on('connect', function () {
         console.log('worked...');
         done();
      });
      _socket.on('disconnect', function () {
         console.log('disconnected...');
         done();
      });
      _socket.on('connect_failed', function () {
         if (typeof console !== "undefined" && console !== null) {
            console.log("Connect failed (port " + _socket.socket_port + ")");
         }
         done();
      });
      _socket.on('error', function (err) {
         if (typeof console !== "undefined" && console !== null) {
            console.log("Socket.io reported a generic error", err);
         }
         done();
      });

      window.rpc_socket = this.rpc_socket;
   });

   after(function (done) {
      var RPC_NAMESPACE = '/rpc';
      this.socket.on('disconnect', function () {
         console.log('disconnected...');
         done();
      });
      this.socket.disconnect(RPC_NAMESPACE);
   });

   describe('test gen...TagAnalysisData', function () {
      this.timeout(1000);
      beforeEach(function () {
         // create source div in DOM with some content
         this.$source = $("<div id='source'> </div>");
         this.$source.appendTo("body");
      });
      afterEach(function () {
         this.$source.remove();
      });

      it('computes good stats : only one p tag - 5 sentences', function () {
         var test_html_content = "'<p> S odkazem na sdělení čínské firmy to v pátek uvedla agentura Reuters. This is in order to have a minimum of five paragraphs. The bad thing is I need to have at least five paragraphs to be selected. So here are two in English and one in czech, with enough words to have a high average and be selected. propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';";
         var $source = this.$source;
         $source.html(test_html_content);
         var aExpectedResult = new DS.ParagraphData();
         aExpectedResult.enclosing_div = "#source";
         aExpectedResult.enclosing_div_class = "";
         aExpectedResult.enclosing_div_id = "source";
         aExpectedResult.tag = "P";
         aExpectedResult.sentence_number = 5;
         aExpectedResult.avg_sentence_length = 14;
         // don't test the text, it could be messy because of all the spaces and so on, and there is little gain anyways

         console.dir(RD.generateTagAnalysisData($source));
         expect(RD.generateTagAnalysisData($source).length).to.equal(1);
         var actualValue = RD.generateTagAnalysisData($source)[0];

         US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div");
         US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_class");
         US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_id");
         US.check_equal_prop(actualValue, aExpectedResult, "tag");
         US.check_equal_prop(actualValue, aExpectedResult, "sentence_number");
         US.check_equal_prop(actualValue, aExpectedResult, "avg_sentence_length");
      });

      it('computes good stats : 5 p tag - 5 sentences', function () {
         var test_html_content = "'<p> S odkazem na sdělení čínské firmy to v pátek uvedla agentura Reuters. </p> " +
                                 "<p>This is in order to have a minimum! of \n   \r five paragraphs.   </p>   " +
                                 "<p>The bad thing is I need to have at least five paragraphs to be selected. </p> " +
                                 "<p> So here are two in English and one in czech, with enough words to have a high average and be selected.</p> " +
                                 "<p> propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';";
         var $source = this.$source;
         $source.html(test_html_content);
         var aExpectedResult = new DS.ParagraphData();
         aExpectedResult.enclosing_div = "#source";
         aExpectedResult.enclosing_div_class = "";
         aExpectedResult.enclosing_div_id = "source";
         aExpectedResult.tag = "P";
         aExpectedResult.sentence_number = 1;
         aExpectedResult.aAvgLength = [12, 11, 15, 21, 9];
         //aExpectedResult.avg_sentence_length = 14;
         // don't test the text, it could be messy because of all the spaces and so on, and there is little gain anyways

         var aActualResult = RD.generateTagAnalysisData($source);
         console.dir(aActualResult);
         expect(aActualResult.length).to.equal(5);
         aActualResult.forEach(function (actualValue, index, array) {
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div");
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_class");
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_id");
            US.check_equal_prop(actualValue, aExpectedResult, "tag");
            US.check_equal_prop(actualValue, aExpectedResult, "sentence_number");
            expect(actualValue.avg_sentence_length).to.equal(aExpectedResult.aAvgLength[index]);
         });
      });

      it('identifies parent div', function () {
         var test_html_content_div1 = "<div id='article' class='highlight'> <div id='main' class='show time'>" +
                                      "'<p> S odkazem na <em>sdělení</em> čínské firmy to v pátek uvedla agentura Reuters. </p> " +
                                      "<p>This is in order to <strong>have</strong> a minimum! of \n   \r five paragraphs.   </p>   " +
                                      "<p>The bad thing is I need to have at least five paragraphs to be selected. </p> " +
                                      "<p> So here are two in English and one in czech, with enough words to have a high average and be selected.</p> " +
                                      "<p> propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';";
         var $source = this.$source;
         $source.html(test_html_content_div1);
         var aExpectedResult = new DS.ParagraphData();
         aExpectedResult.enclosing_div = "#main.show.time";
         aExpectedResult.enclosing_div_class = "show time";
         aExpectedResult.enclosing_div_id = "main";
         aExpectedResult.tag = "P";
         aExpectedResult.sentence_number = 1;
         aExpectedResult.aAvgLength = [12, 11, 15, 21, 9];
         //aExpectedResult.avg_sentence_length = 14;
         // don't test the text, it could be messy because of all the spaces and so on, and there is little gain anyways

         var aActualResult = RD.generateTagAnalysisData($source);
         console.dir(aActualResult);
         expect(aActualResult.length).to.equal(5);
         aActualResult.forEach(function (actualValue, index, array) {
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div");
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_class");
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_id");
            US.check_equal_prop(actualValue, aExpectedResult, "tag");
            US.check_equal_prop(actualValue, aExpectedResult, "sentence_number");
            expect(actualValue.avg_sentence_length).to.equal(aExpectedResult.aAvgLength[index]);
         });
      });

      it('takes only p tags when computing stats', function () {
         var test_html_content_div1 = "<div id='article' class='highlight'> <div id='main' class='show time'>" +
                                      "'<p> S odkazem na <em>sdělení</em> čínské firmy to v pátek uvedla agentura Reuters. </p> " +
                                      "<p>This is in order to <strong>have</strong> a minimum! of \n   \r five paragraphs.   </p>   " +
                                      "<p>The bad thing is I need to have at least five paragraphs to be selected. </p> " +
                                      "<p> So here are two in English and one in czech, with enough words to have a high average and be selected.</p> " +
                                      "<p> propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';" +
                                      "<ul><li>Some extra tags who should not be taken into account</li></ul>" +
                                      "<h1>Another test</h1><h2>And another</h2><h3>And a third one</h3>" +
                                      "<h4>fourth  test</h4><h5>fifth test</h5><h6>6th h level</h6>" +
                                      "<table><tr><th>Month</th><th>Savings</th></tr><tr><td>January</td><td>$100</td></tr>" +
                                      "</table></div></div>";
         var $source = this.$source;
         $source.html(test_html_content_div1);
         var aExpectedResult = new DS.ParagraphData();
         aExpectedResult.enclosing_div = "#main.show.time";
         aExpectedResult.enclosing_div_class = "show time";
         aExpectedResult.enclosing_div_id = "main";
         aExpectedResult.tag = "P";
         aExpectedResult.sentence_number = 1;
         aExpectedResult.aAvgLength = [12, 11, 15, 21, 9];
         //aExpectedResult.avg_sentence_length = 14;
         // don't test the text, it could be messy because of all the spaces and so on, and there is little gain anyways

         var aActualResult = RD.generateTagAnalysisData($source);
         console.dir(aActualResult);
         expect(aActualResult.length).to.equal(5);
         aActualResult.forEach(function (actualValue, index, array) {
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div");
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_class");
            US.check_equal_prop(actualValue, aExpectedResult, "enclosing_div_id");
            US.check_equal_prop(actualValue, aExpectedResult, "tag");
            US.check_equal_prop(actualValue, aExpectedResult, "sentence_number");
            expect(actualValue.avg_sentence_length).to.equal(aExpectedResult.aAvgLength[index]);
         });
      });

      // testing now highlighting server side
      it('highlights important words in text', function (done) {
         var test_text = "S odkazem na čínské firmy to v pátek uvedla agentura Reuters.";
         var expected_text = "";
         var $div_test = $("#source");
         this.$source.html(test_text);

         // exec async function!!
         // check that the callback function is called each time with the right content for sWords
         // This will prove the split functionality of h_t_i_d works
         // The highlighting functionality should be tested in another test
         RD.highlight_proper_text($div_test, function (sWords, highlit_text, $el) {
            expect(sWords).to.deep.equal(test_text);// we don't want to change spacing or else in the input text
            expect(highlit_text).to.deep.equal(expected_text);// we don't want to change spacing or else in the text
            done();
         });
      });

      it('highlights important words in $div', function (done) {
         var test_html_content_div1 = "<div id='article' class='highlight'> <div id='main' class='show time'>" +
                                      "'<p> S odkazem na <em>sdělení</em> čínské firmy to v pátek uvedla agentura Reuters. </p> " +
                                      "<p>This is in order to <strong>have</strong> a minimum! of \n   \r five paragraphs.   </p>   " +
                                      "<p>The bad thing is I need to have at least five paragraphs to be selected. </p> " +
                                      "<p> So here are two in English and one in czech, with enough words to have a high average and be selected.</p> " +
                                      "<p> propertyIsEnumerable Je ochotna za něj zaplatit 1,34 miliardy korun.  </p>';";
         var $div_test = $("#article");
         this.$source.html(test_html_content_div1);
         // exec async function!!
         // check that the callback function is called each time with the right content for sWords
         // This will prove the split functionality of h_t_i_d works
         // The highlighting functionality should be tested in another test
         RD.highlight_text_in_div($div_test, function (sWords, highlit_text, $el) {
            expect($("span.highlight").length).to.equal(1);
            done();
         });
      });

      it('empty tag title', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });
      it('non-empty tag title', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });
      it('several non-empty tag titles', function () {
         expect(RD.getIndexInArray([
                                      {div: "hello"},
                                      {div: "hi"}
                                   ], "div", "hi")).to.equal(1);
      });

   });


});

