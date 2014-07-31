/**
 * Created by bcouriol on 17/07/14.
 */
define(['chai'], function (chai) {
   function check_equal_prop(actual_obj, expected_obj, prop_name) {
      /*
       used in the context of testing specifications
       allow to test if the property of actual and expected object are deeply equal
       */
      chai.expect(actual_obj[prop_name]).to.deep.equal(expected_obj[prop_name]);
   }
   return {
      check_equal_prop: check_equal_prop
   }
});
