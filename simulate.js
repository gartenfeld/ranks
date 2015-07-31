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
  this.superscore = 0;
  this.preferences = [];
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

var retally = function() {
  _(members).each(function(voter){
    if (voter.score > 0) {
      _(voter.strong).each(function(target){
        members[target].superscore += voter.score / g;
      });
      _(voter.known).each(function(target){
        members[target].superscore += voter.score / g;
      });
    }
  });
  _(members).each(function(member){
    member.superscore = Math.floor(member.superscore + g * member.score);
  });
};

var order = function(idxArr){
  idxArr.sort(function(a, b){ return members[b].superscore - members[a].superscore; });
};

var wishlist = function(){
  _(members).each(function(member){
    order(member.strong);
    order(member.known);
    order(member.neutral);
    order(member.avoid);
    order(member.reject);
    member.preferences = [].concat(member.strong, member.known, member.neutral, member.avoid, member.reject);
  });
};

var allocate = function() {
  var assignee;
  while (queue.length) {
    assignee = queue.shift();
    groups.push(assignee);
    accompany(assignee);
  }
};

var accompany = function(assigneeId) {
  var assignee = members[assigneeId],
      tuple = recruit(assignee.preferences);
  if (tuple) {
    var friendId = tuple[0],
        inQueuePos = tuple[1];
    // extract friend from the queue, and add friend to groups
    groups.push(queue.splice(inQueuePos, 1)[0]);
    if (groups.length / g !== 0) {
      accompany(friendId);
    }
  }
};

var recruit = function(list) {
  // go down the preference list of candidates
  var friend, foundAt;
  for (var i = 0; i < list.length; i++) {
    // check if this candidate is still available
    friend = list[i];
    foundAt = queue.indexOf(friend);
    if (foundAt !== -1) {
      return [friend, foundAt];
    }
  }
};

init();
survey();
tally();
retally();
wishlist();

// var scores = [];
// _(members).each(function(p){
//   scores.push(p.superscore);
// });
// console.log(scores);

var queue = members.slice();
queue.sort(function(a,b){ return b.superscore - a.superscore; });
queue = _(queue).map(function (member) {
  // return [member.id, member.score, member.superscore];
  return member.id;
});

// console.log(queue);

var groups = [];

allocate();

// console.log(groups);

// _(groups).each(function(id) {
//   console.log(id, members[id].superscore);
// });

groups = divide(groups, n/g);
// console.log(groups);

var calculate = function(mateId, team) {
  var mate = members[mateId];
  var sScore, kScore, nScore, aScore, rScore;
  

};

// UTILITY TEST
_(groups).each(function (team) {
  console.log("\nTeam: ", team);
  _(team).each(function(mate){
    calculate(mate, team);
  });
});

// var testee = members[15];
// _(testee.preferences).each(function (idx){
//   console.log(members[idx].superscore);
// });

// imported an array division function
function divide(a, n) {
  var len = a.length,out = [], i = 0;
  while (i < len) {
      var size = Math.ceil((len - i) / n--);
      out.push(a.slice(i, i + size));
      i += size;
  }
  return out;
}
