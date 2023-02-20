var globalData = null;
      function getCommands(){
        //console.log("test print in getCommands()");
        $.ajax({
          url: '/getCommands',
          type: 'get',
          success:function(data){
            //console.log(data)
            //we get the json data here, possible iterate over and fill table
            //console.log(data[0].command);
            //console.log(data.length);
            //create and fill table

            //make headers for table off items in json
            var col = [];
              for (var i = 0; i < data.length; i++) {
                  for (var key in data[i]) {
                      if (col.indexOf(key) === -1) {
                          col.push(key);
                      }
                  }
              }


            //create table
            var table = document.createElement("table");
            table.id = 'commandsTable';
            var tr = table.insertRow(-1);
            var th = document.createElement("th");      // table header.
            th.innerHTML = "Commands"
            tr.appendChild(th);

            const commands = Object.entries(data)
              //add json data as rows
              for (var i = 0; i < commands.length; i++) {
                tr = table.insertRow(-1);
                tr.id = commands[i][1].name;
                  var tabCell = tr.insertCell(-1);
                  tabCell.id = commands[i][1].name;
                  tabCell.innerHTML = "<input type='button' value='" + commands[i][1].name + "' onclick='showCommandData(this);'/>";
              }

              var divShowData = document.getElementById('showData');
              divShowData.innerHTML = "";
              divShowData.appendChild(table); //add table and show
              globalData = commands;
          },
          error: function(XMLHttpRequest, textStatus, errorThrown) {
              alert("Error occurred in request");
            }
        });
      }

      const sort_by = (field, reverse, primer) => {

        const key = primer ?
          function(x) {
            return primer(x[field])
          } :
          function(x) {
            return x[field]
          };

        reverse = !reverse ? 1 : -1;

        return function(a, b) {
          return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
      }

      //function to search commands based on input
      function filterCommands(){
        var input = document.getElementById('commandSearch');
        var filter = input.value.toUpperCase();
        var table = document.getElementById('commandsTable');
        var tr = table.getElementsByTagName('tr');

        for (var i = 1; i < tr.length; i++){
          var item = tr[i].id;
          if(item.toUpperCase().includes(filter)){
            tr[i].style.display = "";
          } else {
            tr[i].style.display = "none";
          }
        }
      }


    //function to show command info based on button pressed
    //calls api with params to get info
    function showCommandData(buttonPressed){
      document.getElementById("restartRepeats").className = "";
      var commandName = buttonPressed.value;
      //console.log('sending api call for command: ' + buttonPressed.value);
      if(commandName.includes("#")){
        commandName = commandName.replace('#', '%23');
      }
      if(commandName.includes('&')){
        commandName = commandName.replace('&', '%26');
      }

    //  console.log("test print in getCommands()");
      var endPoint = '/getCommandInfo?q=' + commandName;
      $.ajax({
        url: endPoint,
        type: 'get',
        body: commandName,
        success:function(data){
          //we get the json data here, possible iterate over and fill table
          //console.log(data);
          //create object to hold our command
          var c = data;


          //name, text, auth, cooldown, initialDelay, interval, disabled, repeating, sound
          document.getElementById("commandForm").reset();
          document.getElementById("formHeading").innerHTML = "Command Info for: " + c.name;
          //insert name into the delete command form field
          document.getElementById("deleteCommand").setAttribute('value', c.name);
          //set method to edit
          document.getElementById("method").setAttribute('value', "edit");
          document.getElementById("commandName").setAttribute('value', c.name);
          document.getElementById("commandText").innerHTML = c.text;

          document.getElementById("commandAuth").setAttribute('value', c.auth);
          document.getElementById("commandCooldown").setAttribute('value', c.cooldownInSec);
        //  document.getElementById("commandInitialDelay").setAttribute('value', c.initialDelay);
        //  document.getElementById("commandInterval").setAttribute('value', c.interval);
          if(c.active){
            document.getElementById("enabledTrue").checked = true;
          } else {
            document.getElementById("enabledFalse").checked = true;
          }
          if(c.repeating){
            document.getElementById("repeatingTrue").checked = true;
          } else {
            document.getElementById("repeatingFalse").checked = true;
          }
          document.getElementById("commandSound").setAttribute('value', c.sound);

          document.getElementById('repeating').className = ""; //hide repeating

          //if reserved disable the submit button
          if(c.reserved){
            var butt = document.getElementById('submitCommandButton');
            butt.disabled = true;
            butt.value = "Reserved Command";
            butt.style = "cursor:not-allowed;"

          } else {
            var butt = document.getElementById('submitCommandButton');
            butt.disabled = false;
            butt.value = "Submit Command";
            butt.style = "cursor:pointer;"
          }

          //show form
          var create = document.getElementById("commandInfo");
          create.className = "show";
        }
      });
    }


        function showAddCommand(){
          document.getElementById("restartRepeats").className = "";
          document.getElementById('repeating').className = "";
          //show form
          var create = document.getElementById("commandInfo");
          if(create.className === "show"){
            create.className = "";
          } else {
            var butt = document.getElementById('submitCommandButton');
            butt.disabled = false;
            butt.value = "Submit Command";
            butt.style = "cursor:pointer;"
          //display the form for adding a new command and hide commandInfo
          //set defaults and clear out old info
          //name, text, auth, cooldown, initialDelay, interval, disabled, repeating, sound
          document.getElementById("commandForm").reset();
          document.getElementById("formHeading").innerHTML = "Add a new command: ";
          //set method to new
          document.getElementById("method").setAttribute('value', "add");
          document.getElementById("commandName").setAttribute('placeholder', "!commandName");
          document.getElementById("commandName").setAttribute('value', '');
          document.getElementById("commandText").setAttribute('placeholder', "message here");
          document.getElementById("commandText").innerHTML = "";
          document.getElementById("commandAuth").setAttribute('placeholder', "auth (+a +s +m)");
          document.getElementById("commandAuth").setAttribute('value', '');
          document.getElementById("commandCooldown").setAttribute('placeholder', "time in seconds");
          document.getElementById("commandCooldown").setAttribute('value', '');
        //  document.getElementById("commandInitialDelay").setAttribute('placeholder', "time in seconds");
        //  document.getElementById("commandInitialDelay").setAttribute('value', '');
        //  document.getElementById("commandInterval").setAttribute('placeholder', "time in seconds");
        //  document.getElementById("commandInterval").setAttribute('value', '');
          document.getElementById("enabledTrue").checked = true;
          document.getElementById("repeatingFalse").checked = true;
          document.getElementById("commandSound").setAttribute('placeholder', "sound file");
          document.getElementById("commandSound").setAttribute('value', '');
          document.getElementById("submitStatus").innerHTML = "";

          //show form
          create.className = "show";
        }
        }

        //submit command info
        $('#commandForm').submit(function(){
          submitEditCommand();
          return false;
        });

        function submitEditCommand(){
          $.ajax({
            url: '/submitCommand',
            type: 'post',
            data: $('#commandForm').serialize(),
            success:function(data){
              //console.log('submitted command edit');
              //console.log(data);
              /*if(data === "duplicate"){
                //don't auto open command edit in case there's text to copy/paste over
                document.getElementById("submitStatus").innerHTML = "Command already exists"
              } else if(data === "200 OK"){
                document.getElementById("submitStatus").innerHTML = "Changed successfully"
              } else if(data === "401"){
                document.getElementById("submitStatus").innerHTML = "Not Authorized"
              }*/
              document.getElementById("submitStatus").innerHTML = "Changed successfully"
              getCommands(); //reset command list to ensure changes
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error occurred in edit request");
              }
          });
        };



        //submit command delete
        $('#delForm').submit(function(){
          submitDeleteCommand();
          return false;
        });

        function submitDeleteCommand(){
          $.ajax({
            url: '/submitCommand',
            type: 'post',
            data: $('#delForm').serialize(),
            success:function(data){
              console.log('submitted command delete');
              console.log(data);
              getCommands(); //reset command list to ensure changes
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error occurred in delete request");
              }
          });
        };

//todo add call to server's post /postRepeatingCommands with request form serialize or something to handle change
        function showRepeating(){
          document.getElementById("commandInfo").className = "";//hide command form
          var rep = document.getElementById('repeating');
          if(rep.className === "show"){
            rep.className = "";
            document.getElementById("restartRepeats").className = "";
          } else {
            document.getElementById("restartRepeats").className = "show";
            //create table
            var table = document.createElement("table");
            var tr = table.insertRow(-1);
            var th = document.createElement("th");      // table header.
            th.innerHTML = "Repeating Commands"
            tr.appendChild(th);

            //add json data as rows
            for (var i = 0; i < globalData.length; i++) {
              if(globalData[i].repeating){
                tr = table.insertRow(-1);
                var tabCell = tr.insertCell(-1);
                tabCell.innerHTML = "<input type='button' value='" + globalData[i].name + "' onclick='showRepeatingData(this);'/>";
              }
            }

            var divRepeating = document.getElementById('repeating');
            divRepeating.innerHTML = "";
            divRepeating.appendChild(table); //add table and show

            rep.className = "show";
          }
        }
        function showRepeatingData(buttonPressed){
          var commandName = buttonPressed.value;
          //get data from our global list
          for (var i = 0; i < globalData.length; i++) {
            if(globalData[i].name === commandName){

            }
          }
        }

        //send to bot to restart/rebuild repeating commands array
        function restartRepeats(){
          $.ajax({
            url: '/restartRepeats',
            type: 'post',
            data: '',
            success:function(data){
              if(data === "200 OK"){
                document.getElementById("submitStatus").innerHTML = "Repeating commands restarted";
              } else {
                document.getElementById("submitStatus").innerHTML = "Error occurred restarting repeats";
              }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error occurred in restart request");
              }
          });
        }


        $(document).ready(function(){
                //get command list
                getCommands();
        });
