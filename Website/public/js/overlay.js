$(document).ready(function(){
  evt.init();
});


var evt = {
  init : function(){
    var src = new EventSource("https://raxabot.raxa.dev/api/eventStream");
    src.addEventListener("message", function(event){
      console.log(event.data);
      var data = JSON.parse(event.data);
      console.log(data.system);
      if(data.system === "overlay"){
        switch (data.type) {
          case "playSound":
            playSound(data.value);
            break;
          case "playAlert":
            playAlert(data);
          default:

        }
        updateElements(data);
      }
    }, false);
  }
};


function updateElements(data){
  console.log(data);
}

function playAlert(data){

}

function playSound(fileName){
  var audio = new Audio('/sound/'+fileName);
  audio.play();
}
