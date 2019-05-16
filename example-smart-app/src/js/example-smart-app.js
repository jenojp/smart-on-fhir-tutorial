/**
 * IIFE that declares/assigns methods to window scope upon a sucessful authorization
 * process that occurs in the <script/> segment of inlaunch.html, where we
 * give ourselves access to Patient and Observation with our CernerCare
 * credentials. 
 *
 * 1. Assigns variable window.extractData(), which is called in index.html
 *    and returns a promise whose resolved value is then passed to 
 *    window.drawVisualization
 */
(function(window){
  window.extractData = function() {
    /**
     * ret is a promise object that can be .then() chained later on.
     * It is what is returned from window.ExtractData()
     */
    var ret = $.Deferred();

    // Invoked if authorization or any sort of api call fails
    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      console.log('Calling onReady()');
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });
        $.when(pt, obv).fail(onError);
        $.when(pt, obv).done(function(patient, obv) {
          console.log('onReady.when.done()')
          console.log(obv);

          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }
   /**
    * Module FHIR exported from ../lib/js/fhir-client-v0.1.12.js
    * on line 17612, following is exported to global scope window
    * window.FHIR = {
    *   client: client,
    *    oauth2: oauth2
    * };
    * oath2.ready() appears to be asynchornous function that
    * accepts a callback function, onReady, to execute upon successful
    * authorization, and onError, as an error catching function. 
    */
    console.log('calling Fhir.oath2.ready(onReady, onError)');
    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  }; //end window.extractData()

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    console.log('in window.drawVisualization(p)... p:');
    console.log(p);
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };
/**
 * Pass the singular 'window' object of the HTML document.
 */
})(window);
