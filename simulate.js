var _ = require('./lib/underscore');

var n = 40, // pool size
    g = 4, // group size
    members = [];

var settings = {
  sPercentage: 20,
  kPercentage: 25
};

settings.sLimit = Math.floor(n * settings.sPercentage / 100 + 0.5);
settings.kLimit = Math.floor(n * settings.kPercentage / 100 + 0.5);

var Member = function(id) {
  this.id = id;
  this.reject = [];
  this.avoid = [];
  this.neutral = [];
  this.known = [];
  this.strong = [];
  this.score = 0;
};

var init = function() {
  _(_.range(n)).each(function(id){
    members.push(new Member(id));
  });
};

var draw = function (ceiling, floor) {
  floor = floor || 0;
  return Math.floor(Math.random() * (ceiling - floor)) + floor;
};

var cast = function(voter) {
  // ballot is a copy of the cohort
  var ballot = _.range(n);
  // remove self from the ballot
  ballot.splice(voter.id, 1);
  var idx, candicate;

  // simulation: randomly select "strong interest"
  var s = draw(settings.sLimit, 2); // size and floor of category
  for (var i1 = 0; i1 < s; i1++) {
    idx = draw(ballot.length-1);
    candidate = ballot.splice(idx, 1)[0];
    voter.strong.push(candidate);
  }

  // simulation: randomly select "known compatible"
  var k = draw(settings.kLimit, 4); // size and floor of category
  for (var i2 = 0; i2 < k; i2++) {
    idx = draw(ballot.length-1);
    candidate = ballot.splice(idx, 1)[0];
    voter.known.push(candidate);    
  }

  // simulation: randomly select "avoid"
  var a = draw(5, 0); // size and floor of category
  for (var i3 = 0; i3 < a; i3++) {
    idx = draw(ballot.length-1);
    candidate = ballot.splice(idx, 1)[0];
    voter.avoid.push(candidate);    
  }

  // simulation: randomly select "reject"
  var bound = draw(15), // increase the variation
      type = draw(1.5),
      r = draw(bound*draw(type+type));
  for (var i4 = 0; i4 < r; i4++) {
    idx = draw(ballot.length-1);
    candidate = ballot.splice(idx, 1)[0];
    voter.reject.push(candidate);    
  }

  voter.neutral = ballot;

  // console.log(voter);

};

var survey = function(){
  _(members).each(function(voter){
    cast(voter);
  });
};

var tally = function(){
  _(members).each(function(voter){

    _(voter.strong).each(function(target){
      members[target].score+=3;
      voter.score+=0;
    });

    _(voter.known).each(function(target){
      members[target].score+=2;
      voter.score+=1;
    });

    _(voter.avoid).each(function(target){
      members[target].score-=1;
      voter.score-=1;
    });

    _(voter.reject).each(function(target){
      members[target].score-=1;
      voter.score-=3;
    });

  });
};

var allocate = function() {
  var assignee;
  while (selection.length) {
    assignee = selection.unshift();
    groups.push(assignee);
    arrange(assignee);
  }
};

var arrange = function(assignee) {
  while (groups.length && groups.length / g !== 0) {

  }
};

var extract = function(list) {
  var winner = list[0], max = 0;
  _(list).each(function(idx){

  });

};

init();
survey();
tally();

// var scores = [];
// _(members).each(function(p){
//   scores.push(p.score);
// });

var queue = members.slice();
queue.sort(function(a,b){ return b.score - a.score; });
queue = _(queue).map(function (member) {
  return member.id;
});

var groups = [];

console.log(queue);



