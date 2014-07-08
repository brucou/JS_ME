/**
 * Created by bcouriol on 27/06/14.
 */
//!!!!! Deprecated!!!!

/* Parameters:
 TIMEOUT : timeout after which the client will stop waiting for a result from remote function calls and activate the callback with a TIMEOUT error code
 */
define(['utils', 'socketio'], function (UL, IO) {
   function setTimeOut() {
   }

   function rpc() {
      /*
       rpc(name : function_name, param1, param2, ..., function : callback);
       Minimum of two arguments : the remote function to call and the callback
       Those two arguments are the first and the last

       */
      // nice to have: put error messags in constants
      var iArgs = arguments.length;
      const MIN_ARGS = 2;
      if (iArgs < MIN_ARGS) {
         logWrite(DBG.TAG.ERROR, "In rpc call", "wrong number of arguments");
         return -1;
      }
      var function_name = arguments[0]; // first argument
      var callback = arguments[iArgs - 1]; // last argument
      if (UI.isString(function_name) && UI.isFunction(callback)) {
         // let's proceed with packing up the remaining arguments if any
         var args = Array.prototype.slice.call(arguments, 1, iArgs);

      } else {
         logWrite(DBG.TAG.ERROR, "In rpc call", "wrong type of arguments");
         return -1;
      }
   }

});

function rpc() {
   /* Used by clients to call remote functions on server_side
    typical call is rpc(name : function_name, param1, param2, ..., function : callback);
    The callback function is mandatory: if no action is to be taken, pass an empty function

    */

   // Create namespace rpc on existing socket
   // on connection : log message, initialize any ressources
   // on disconnection : log message, release any ressources?

   // CLIENT SIDE: rpc.js
   // rpc.setTimeout (timeout ms);
   // rpc(name : function_name, param1, param2, ..., function : callback);
   // process args -> JSON object : {id: id_number, name: function, params: args}
   // NOTE : id number has to be unique among all the clients !! Otherwise other clients will receive the event
   // NOTE : possibly generating security problems or unintended side-effects (exec. of function in wrong client)
   // NOTE : would it be possible to pass directly the socket id?
   // settimeout to call the callback with timeout error code when expires
   // emit to the server the JSON object on namespace 'rpc', event 'exec'
   // setup an io.on ('rpc_return_$id') on the namespaced socket
   //       result has arrived!
   //       decript result as {data: result, error: msg}
   //       cancel timeout
   //       call callback with {data, error} object

   // SERVER SIDE : rpc.js
   // on 'exec' event:
   //       get function name
   //       match function_name and existing functions signalled for rpc
   //       NOTE : in the future might be interesting to implement exec rights but not now
   //       make the args of arguments from received data
   //       get the id from received data
   //       call the function with the arguments
   //       NOTE: the function called must be independent of state client-side. All dependeance client-side are in the parameters passed
   //       emit 'rpc_return_id') the result of function call
   //       NOTE : if async. result -> this emit must be in a callback function in case the function to execute make an asynchornous call
   // !!! difficult part : how to encapsulate it out of the body of the executed function!!
   //       return_cb = function (f) : f the function (err, result) to be used normally as a callback in async. calls for results
   //       return_cb (f) is function (err, result) as well but encapsulates f
   /*       For example
    client.query(expr, return_cb(function (err, result) {
    if (err) {
    LOG.write(LOG.TAG.ERROR, 'error running query', err);
    }
    socket.send(JSON.stringify({type: 'highlight_important_words', data: result.rows[0].highlit_text}));
    }));
    */
   // NOTE : if symc. result -> then return directly the result in the emit event.
   // NOTE: so we need a way to set a parameter to the remote function as per they are async. or sync.
}