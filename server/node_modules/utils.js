/**
 * Created by bcouriol on 27/06/14.
 */
const pgVERBATIM = "$random_some$"; // !! if this is already in the text, there will be a problem

function f_none () {
  // the empty function - used when there is no action to perform in a callback context
}

function wrap_string (wrap_begin, word, wrap_end) {
  return [wrap_begin, word, wrap_end].join("");
}

function print_rows (rows) {
  for (var i = 0; i < result.rows.length; i++) {
    console.log(result.rows[i]);
  }
}

function pg_escape_string (string) {
  return pgVERBATIM + string + pgVERBATIM;
}

module.exports = {
  f_none          : f_none,
  wrap_string     : wrap_string,
  print_rows      : print_rows,
  pg_escape_string: pg_escape_string
};
