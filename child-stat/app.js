$(document).ready(function () {


  if (window.location.href.indexOf('http://') === 0 && window.location.host.indexOf('127.0.0.1') !== 0) {
    window.location = window.location.href.replace('http://', 'https://');
  }

  // Be sure to use your own app key so you can set up your own redirect URI.
  var APP_KEY = 'q0pa3lmetgckf2i';

  var client = new Dropbox.Client({key: APP_KEY});

  // Use a pop-up for auth.
  client.authDriver(new Dropbox.AuthDriver.Popup({receiverUrl: window.location.href + 'oauth_receiver.html'}));


  // First check if we're already authenticated.
  client.authenticate({interactive: false});

  if (client.isAuthenticated()) {
    // If we're authenticated, update the UI to reflect the logged in status.
    loggedIn();
  } else {
    // Otherwise show the login button.
    $('#login').show();
  }

  $('#login').click(function () {
    client.authenticate(function (err) {
      if (err) {
        alert('Error: ' + err);
        return;
      }
      loggedIn();
    });
  });

  function loggedIn() {
    $('#login').hide();
    $('.buttons').show();
    var dataStoreManager = client.getDatastoreManager();

    dataStoreManager.openDefaultDatastore(function (err, datastore) {
        if (err) {
          alert('Error: ' + err);
          return;
        }

        var add = function (type) {
          table.insert({
            type: type,
            time: (new Date()).toLocaleString(),
          });
        }


        // Make sure we use the "max" resolution rule to resolve conflicts about which level we're on.
        var table = datastore.getTable('child-stat-test');
        // table.setResolutionRule('level', 'max');

        $('body').on('click', '.js-delete-row', function (e) {

          e.preventDefault();
          var $el = $(this);
          var id = $el.data('id')
          console.log(id);
          var record = table.get(id)

          record.deleteRecord();

          $el.parent().parent().remove();

          return false;
        })

        $('.button').click(function () {
          var type = $(this).data('type')
          add(type);
          return false;
        })



        var updateResultTable = function () {
          $('.js-date-results').html('')

          var records = table.query();
          var limit = 20;
          var max = records.length - 1;

          for (var i = max; i >= 0; i--) {

            if (limit == 0) {
              break;
            }

            limit--;

            var record = records[i];
            var fields = record.getFields();

            var date = new Date(fields.time);
            $('.js-date-results').append('<div class="row"> ' +
              '<div class="row-name">'
              + fields.type
              + '</div>'
              + '<div class="row-date">'
              + date.getFullYear() + '-'+date.getMonth() +'-'+date.getDay() + ' '+date.getHours() +':'+date.getMinutes()
              + '</div>'

              + '<div class="row-action">'
              + '<a class="js-delete-row" href="#" data-id="' + record.getId() + '" >del</a>'
              + '</div>'


              + '</div>');

          }
        }

        datastore.recordsChanged.addListener(updateResultTable);

        updateResultTable();


        $('#logout').show().click(function (e) {
          e.preventDefault();
          client.signOut();
          $('#login').show();
          $('#box, #instructions').hide();
          $('#container').css('padding', 0);
          $('h1').text('Click the Box');
        });
      }
    )
    ;
  }
})