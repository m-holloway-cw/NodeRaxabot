function testFollow(){
  console.log('testing follow')
  $.ajax({
    url: '/api/testAlert',
    type: 'post',
    data: {type: 'follow'},
    success:function(data){
      console.log('sent test follow');
    }
  });
}
function testSub(){
  $.ajax({
    url: '/api/testAlert',
    type: 'post',
    data: {type: 'sub'},
    success:function(data){
      console.log('sent test sub');
    }
  });
}
function testRaid(){
  $.ajax({
    url: '/api/testAlert',
    type: 'post',
    data: {type: 'raid'},
    success:function(data){
      console.log('sent test raid');
    }
  });
}
function testBit(){
  $.ajax({
    url: '/api/testAlert',
    type: 'post',
    data: {type: 'bit'},
    success:function(data){
      console.log('sent test bit');
    }
  });
}
