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

var rePool = function(){
  var pool = members.slice();
  pool = _(pool).map(function (member) {
    return member.id;
  });
  // console.log(pool)
  return pool;
};

var randomly = function(pool){
  var groups = [];
  var pos;
  while (pool.length) {
    pos = draw(pool.length);
    groups.push(pool.splice(pos, 1)[0]);
  }
  // console.log(groups);
  return groups;
};

init();
survey();
tally();
retally();
wishlist();

// UTILITY TEST

var experiment = function(rounds){
  var pool, groups;
  var max = -5000, score, best;
  for (var i = 0; i < rounds; i++) {
    pool = rePool();
    groups = randomly(pool);
    score = calculateUtil(groups);
    if (score > max) {
      best = groups.slice();
      max = score;
    }
  }
  return [max, best];
};

var calculateUtil = function(groups){
  var teams = divide(groups.slice(), n/g);
  var cohortUtil = 0;
  _(teams).each(function (team){
    cohortUtil += teamUtil(team);
  });
  return cohortUtil;
};

var teamUtil = function(team) {
  var groupUtil = 0;
  _(team).each(function (mate){
    groupUtil += memberUtil(mate, team);
  });
  return groupUtil;
};

var memberUtil = function(mateId, team) {
  var mate = members[mateId];
  var sScore = 0, kScore = 0, nScore = 0, aScore = 0, rScore = 0;

  _(mate.strong).each(function (target){
    if (team.indexOf(target) !== -1) { sScore += 1; }
  });
  _(mate.known).each(function (target){
    if (team.indexOf(target) !== -1) { kScore += 1; }
  });
  _(mate.neutral).each(function (target){
    if (team.indexOf(target) !== -1) { nScore += 1; }
  });
  _(mate.avoid).each(function (target){
    if (team.indexOf(target) !== -1) { aScore += 1; }
  });
  _(mate.reject).each(function (target){
    if (team.indexOf(target) !== -1) { rScore += 1; }
  });

  var mateUtil = 0;
  mateUtil += sScore * 5;
  mateUtil += kScore * 2;
  mateUtil += nScore * 0;
  mateUtil += aScore * -200;
  mateUtil += rScore * -400;

  return mateUtil;

};

var bestGrouping = experiment(5000);
console.log("Grouping Score: " + bestGrouping[0]);
printUtility(bestGrouping[1]);






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



function printUtility (grouping) {

  var teams = divide(grouping.slice(), n/g);

  _(teams).each(function (team){
    console.log("\nTEAM: ");

    _(team).each(function (mateId) {
      var mate = members[mateId];
      var sScore = 0, kScore = 0, nScore = 0, aScore = '', rScore = '';
      _(mate.strong).each(function (target){
        if (team.indexOf(target) !== -1) { sScore += 1; }
      });
      _(mate.known).each(function (target){
        if (team.indexOf(target) !== -1) { kScore += 1; }
      });
      _(mate.neutral).each(function (target){
        if (team.indexOf(target) !== -1) { nScore += 1; }
      });
      _(mate.avoid).each(function (target){
        if (team.indexOf(target) !== -1) { aScore += '*'; }
      });
      _(mate.reject).each(function (target){
        if (team.indexOf(target) !== -1) { rScore += 'x'; }
      });

      console.log("Member: " + mateId + " \t" + 
        sScore + ' ' + 
        kScore + ' ' +
        nScore + '\t' +
        aScore + ' ' +
        rScore
      );

    });

  });

}
